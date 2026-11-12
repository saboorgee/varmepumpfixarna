/**
 * Pre-migration guard, run by the Docker entrypoint before `medusa db:migrate`.
 *
 *  1. Validates DATABASE_URL / DATABASE_SCHEMA / TLS settings.
 *  2. Waits until the database accepts connections (bounded retries).
 *  3. Refuses to continue if `public` contains tables that Medusa's initial
 *     migrations treat as "Medusa v1 leftovers" (they would be altered or,
 *     for `cat_*`, dropped).
 *  4. Verifies the connecting role defaults to the Medusa schema (role-level
 *     search_path from sql/supabase-setup.sql) and can create objects there.
 *  5. Re-applies the revocation of Supabase's Data API roles (`anon`,
 *     `authenticated`) on the schema when the role owns it.
 *
 * Usage: node src/lib/db-preflight.js   (compiled output, inside the container)
 */
import { Client } from "pg"
import fs from "node:fs"
import {
  buildSslOptions,
  getDatabaseSchema,
  getSslMode,
  sanitizeDatabaseUrl,
} from "./database"

// Table names that Medusa's core migrations probe for in the *public* schema,
// regardless of the configured schema (Medusa v1 upgrade paths):
//   product, store, shipping_option, payment_collection → ALTERed
//   cat_*                                                → DROPPED (index module)
const PUBLIC_COLLISION_TABLES = ["product", "store", "shipping_option", "payment_collection"]

// Postgres error codes for which retrying is pointless.
const FATAL_CODES = new Set(["28P01", "28000", "3D000", "42501"])

const log = (msg: string) => console.log(`[db-preflight] ${msg}`)

function fail(msg: string): never {
  console.error(`[db-preflight] ERROR: ${msg}`)
  process.exit(1)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function validateConfig() {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    fail("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
  }
  if (/\[YOUR-PASSWORD\]|<[a-z-]+>|YOUR_/i.test(raw)) {
    fail("DATABASE_URL still contains placeholder values from .env.example.")
  }
  for (const name of ["JWT_SECRET", "COOKIE_SECRET"]) {
    const value = process.env[name] ?? ""
    if (process.env.NODE_ENV === "production" && (value.length < 32 || value.includes("<"))) {
      fail(`${name} must be set to a random value of at least 32 characters.`)
    }
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    fail("DATABASE_URL is not a valid URL (special characters in the password must be URL-encoded).")
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) {
    fail(`DATABASE_URL must start with postgresql:// (got ${url.protocol}//).`)
  }
  if (url.port === "6543") {
    fail(
      "DATABASE_URL points at Supabase's transaction pooler (port 6543). " +
        "Use the session pooler (port 5432) or the direct connection."
    )
  }

  const schema = getDatabaseSchema()
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) {
    fail(`DATABASE_SCHEMA "${schema}" must be a lowercase SQL identifier.`)
  }
  if (schema === "public" && process.env.ALLOW_PUBLIC_SCHEMA !== "true") {
    fail(
      'DATABASE_SCHEMA=public would place Medusa tables in Supabase\'s Data API schema. ' +
        "Use the default (medusa) or set ALLOW_PUBLIC_SCHEMA=true deliberately."
    )
  }
  if (["auth", "storage", "extensions", "realtime", "graphql", "graphql_public", "vault", "pgbouncer", "supabase_functions", "supabase_migrations"].includes(schema)) {
    fail(`DATABASE_SCHEMA "${schema}" is managed by Supabase. Choose a dedicated schema such as "medusa".`)
  }

  const sslMode = getSslMode()
  const caFile = process.env.DATABASE_SSL_CA_FILE?.trim()
  if (sslMode === "verify-full" || sslMode === "verify-ca") {
    if (caFile && !fs.existsSync(caFile)) {
      fail(
        `DATABASE_SSL_CA_FILE=${caFile} does not exist. Download the Supabase CA certificate ` +
          "(Dashboard → Database → Settings → SSL Configuration) into ./certs/ (see README)."
      )
    }
    if (!caFile && /supabase\.(co|com)$/i.test(url.hostname)) {
      fail(
        "Supabase certificates are signed by Supabase's own root CA. Set DATABASE_SSL_CA_FILE " +
          "to the downloaded certificate (see README), or DATABASE_SSL=no-verify for troubleshooting only."
      )
    }
  } else {
    log(`WARNING: DATABASE_SSL=${sslMode} – the server certificate is NOT verified.`)
  }

  return { url, schema, sslMode }
}

async function connectWithRetry(): Promise<Client> {
  const timeoutSec = Number(process.env.DB_WAIT_TIMEOUT_SECONDS || 90)
  const deadline = Date.now() + timeoutSec * 1000
  let attempt = 0
  for (;;) {
    attempt++
    const client = new Client({
      connectionString: sanitizeDatabaseUrl(process.env.DATABASE_URL),
      ssl: buildSslOptions(),
      connectionTimeoutMillis: 10_000,
      application_name: "medusa-preflight",
    })
    try {
      await client.connect()
      return client
    } catch (err) {
      await client.end().catch(() => undefined)
      const e = err as NodeJS.ErrnoException & { code?: string }
      const msg = e.message || String(err)
      if (e.code && FATAL_CODES.has(e.code)) {
        fail(`Database rejected the connection (${e.code}): ${msg}`)
      }
      if (/certificate|self[- ]signed|SSL|TLS/i.test(msg) && !/ECONN|ETIMEDOUT|ENOTFOUND|EAI_AGAIN/.test(e.code || "")) {
        fail(`TLS verification failed: ${msg}. Check DATABASE_SSL_CA_FILE / DATABASE_SSL (see README).`)
      }
      if (e.code === "ENETUNREACH" || e.code === "EHOSTUNREACH") {
        log(
          `Network unreachable (${e.code}). The direct Supabase host is IPv6-only unless the IPv4 add-on ` +
            "is enabled; use the session pooler connection string instead."
        )
      }
      if (Date.now() >= deadline) {
        fail(`Database not reachable after ${attempt} attempts / ${timeoutSec}s: ${msg}`)
      }
      log(`Database not ready (attempt ${attempt}): ${msg} – retrying in 3s`)
      await sleep(3000)
    }
  }
}

async function main() {
  const { url, schema, sslMode } = validateConfig()
  log(`Connecting to ${url.hostname}:${url.port || 5432} as ${decodeURIComponent(url.username)} (TLS: ${sslMode}, schema: ${schema})`)

  const client = await connectWithRetry()
  try {
    const { rows: info } = await client.query<{ version: string; ssl: boolean | null }>(
      "select current_setting('server_version') as version, (select ssl from pg_stat_ssl where pid = pg_backend_pid()) as ssl"
    )
    log(`Connected. PostgreSQL ${info[0].version}, TLS in use: ${info[0].ssl ?? "unknown"}`)

    // Medusa 2.22's module migrations run unqualified DDL, so tables land in the
    // session's default schema. That default must be the Medusa schema – set on
    // the role (see apps/backend/sql/supabase-setup.sql), not just in config.
    const { rows: ctx } = await client.query<{
      user: string
      superuser: boolean
      schemas: string[]
      exists: boolean
      can_create: boolean | null
      owner: string | null
      can_create_db: boolean
    }>(
      `select current_user as user,
              (select rolsuper from pg_roles where rolname = current_user) as superuser,
              current_schemas(false)::text[] as schemas,
              exists(select 1 from pg_namespace where nspname = $1) as exists,
              case when exists(select 1 from pg_namespace where nspname = $1)
                   then has_schema_privilege(current_user, $1, 'CREATE') end as can_create,
              (select pg_get_userbyid(nspowner) from pg_namespace where nspname = $1) as owner,
              has_database_privilege(current_user, current_database(), 'CREATE') as can_create_db`,
      [schema]
    )
    const c = ctx[0]
    const setupHint = "Run apps/backend/sql/supabase-setup.sql once as postgres and connect as the medusa role (see README)."
    if (!c.exists) {
      fail(`Schema "${schema}" does not exist. ${setupHint}`)
    }
    if (!c.can_create) {
      fail(`Role "${c.user}" cannot create objects in schema "${schema}". ${setupHint}`)
    }
    if (!c.can_create_db) {
      // Medusa's link sync runs CREATE SCHEMA IF NOT EXISTS, which needs this
      // privilege even when the schema exists – and swallows the error.
      fail(`Role "${c.user}" lacks CREATE on the database; link tables would silently not be created. ${setupHint}`)
    }
    if (c.schemas[0] !== schema) {
      fail(
        `The default schema for role "${c.user}" is "${c.schemas[0] ?? "(none)"}", not "${schema}". ` +
          `Medusa's migrations would create tables there. ${setupHint}`
      )
    }
    if (c.user === "postgres" || c.superuser) {
      log(`WARNING: connected as privileged role "${c.user}". Use the dedicated medusa role.`)
    }
    log(`Role "${c.user}" defaults to schema "${schema}" (owner: ${c.owner}).`)

    if (schema !== "public" && process.env.SKIP_PUBLIC_COLLISION_CHECK !== "true") {
      // pg_tables lists tables regardless of the role's privileges.
      const { rows } = await client.query<{ table_name: string }>(
        `select tablename as table_name from pg_catalog.pg_tables
          where schemaname = 'public'
            and (tablename = any($1::text[]) or tablename like 'cat\\_%')
          order by tablename`,
        [PUBLIC_COLLISION_TABLES]
      )
      if (rows.length) {
        fail(
          `public schema contains ${rows.map((r) => `public.${r.table_name}`).join(", ")}. ` +
            "Medusa's initial migrations would ALTER these (or DROP cat_* tables) as Medusa v1 leftovers. " +
            "Rename/move them before migrating. Override only if you have verified these migrations " +
            "already ran: SKIP_PUBLIC_COLLISION_CHECK=true."
        )
      }
    }

    if (schema !== "public" && c.owner === c.user) {
      // Idempotent hardening (also done by the setup SQL).
      const { rows: roles } = await client.query<{ rolname: string }>(
        "select rolname from pg_roles where rolname in ('anon', 'authenticated')"
      )
      if (roles.length) {
        const list = roles.map((r) => `"${r.rolname}"`).join(", ")
        await client.query(`revoke all on schema "${schema}" from ${list}`)
        for (const kind of ["tables", "sequences", "functions"]) {
          await client.query(
            `alter default privileges in schema "${schema}" revoke all on ${kind} from ${list}`
          )
        }
        log(`Revoked Data API roles (${roles.map((r) => r.rolname).join(", ")}) from schema "${schema}".`)
      }
    }
    log("Preflight OK.")
  } finally {
    await client.end().catch(() => undefined)
  }
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)))
