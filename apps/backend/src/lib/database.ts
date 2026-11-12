/**
 * Database connection helpers shared by `medusa-config.ts` and the
 * pre-migration guard (`src/lib/db-preflight.ts`).
 *
 * Supabase is used purely as PostgreSQL. Two connection modes are supported:
 *  - Session pooler (Supavisor, port 5432, user `postgres.<project-ref>`) – IPv4, default.
 *  - Direct connection (`db.<project-ref>.supabase.co:5432`) – IPv6 unless the
 *    IPv4 add-on is enabled.
 * The transaction pooler (port 6543) is rejected: migrations and Medusa's
 * workflow engine need session-level semantics.
 *
 * Kept free of non-Node imports so it can be compiled and run on its own.
 */
import fs from "node:fs"
import type { ConnectionOptions } from "node:tls"

export type SslMode = "verify-full" | "verify-ca" | "no-verify" | "disable"

const SSL_MODES: SslMode[] = ["verify-full", "verify-ca", "no-verify", "disable"]

/**
 * Query parameters that node-postgres parses from the connection string and
 * that would silently override the explicit `ssl` object passed in code
 * (node-pg merges parsed URL values over the config object).
 */
const URL_SSL_PARAMS = [
  "ssl",
  "sslmode",
  "ssl_mode",
  "sslcert",
  "sslkey",
  "sslrootcert",
  "uselibpqcompat",
]

export function sanitizeDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) {
    return rawUrl
  }
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    // Leave unparsable values untouched; the preflight check reports them.
    return rawUrl
  }
  for (const param of URL_SSL_PARAMS) {
    url.searchParams.delete(param)
  }
  return url.toString()
}

export function getSslMode(env: NodeJS.ProcessEnv = process.env): SslMode {
  const value = (env.DATABASE_SSL || "verify-full").trim().toLowerCase() as SslMode
  if (!SSL_MODES.includes(value)) {
    throw new Error(
      `DATABASE_SSL must be one of ${SSL_MODES.join(", ")} (got "${env.DATABASE_SSL}")`
    )
  }
  return value
}

/**
 * Builds the TLS options for node-postgres.
 *  - verify-full: verify the certificate chain against the Supabase CA and the hostname.
 *  - verify-ca:   verify the chain but not the hostname.
 *  - no-verify:   encrypt without verifying (insecure; troubleshooting only).
 *  - disable:     plain TCP (never use against Supabase).
 */
export function buildSslOptions(
  env: NodeJS.ProcessEnv = process.env
): ConnectionOptions | false {
  const mode = getSslMode(env)
  if (mode === "disable") {
    return false
  }
  if (mode === "no-verify") {
    return { rejectUnauthorized: false }
  }

  const caFile = env.DATABASE_SSL_CA_FILE?.trim()
  const options: ConnectionOptions = { rejectUnauthorized: true }
  if (caFile) {
    if (fs.existsSync(caFile)) {
      options.ca = fs.readFileSync(caFile, "utf8")
    }
    // A missing CA file is reported by the preflight check; without it the
    // handshake fails closed (Supabase uses its own root CA).
  }
  if (mode === "verify-ca") {
    options.checkServerIdentity = () => undefined
  }
  return options
}

export function getDatabaseSchema(env: NodeJS.ProcessEnv = process.env): string {
  return (env.DATABASE_SCHEMA || "medusa").trim()
}
