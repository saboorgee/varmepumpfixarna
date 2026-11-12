# Värmepumpfixarna – commerce foundation

Minimal working e-commerce foundation for a Swedish heat-pump retailer:

| Part | Tech | URL (local) |
|---|---|---|
| Storefront | Next.js 16.4 (App Router, TypeScript, Tailwind 4), `@medusajs/js-sdk` | http://localhost:8000 |
| Backend + Admin | Medusa 2.22.6 (shared worker mode, in-memory providers) | http://localhost:9000, Admin at http://localhost:9000/app |
| Database | Supabase-hosted PostgreSQL (used only as Postgres) | external, via `DATABASE_URL` |

Swedish UI, SEK prices including 25 % moms, guest checkout with a clearly labelled **manual test payment** (`pp_system_default`, nothing is charged).

```
browser ──► storefront :8000 (Next.js server) ──► backend:9000 (Docker network) ──► Supabase Postgres (TLS)
browser ──► backend :9000  (Admin /app, product images /static)
```

* All Medusa calls run on the Next.js server (Server Components / Server Actions). The browser never calls the Store API, so the storefront uses the Docker-internal URL `http://varmepumpfixarna-backend:9000` (a network alias of the `backend` service), and the publishable key is a runtime server variable.
* The cart id lives only in an HTTP-only cookie (`vpf_cart_id`, `SameSite=Lax`). After checkout it's replaced by a short-lived HTTP-only cookie holding the order id. The confirmation page only renders for that order, because Medusa's Store API returns any order by id.
* Commerce validation (stock, prices, address, shipping eligibility, payment) stays in Medusa. The storefront forwards input and shows Medusa's errors, with Swedish wording for common ones.

## Prerequisites

* **Docker Desktop with Compose v2** (`docker compose version` must print v2.x). Docker 19.x and `docker-compose` 1.x are too old.
* A Supabase project and access to its SQL Editor.
* No host Node.js or PostgreSQL is needed.

## Initial setup (once per environment)

All commands run from the repository root.

### 1. Back up the existing database

The database already contains data. Take a backup before the first migration (uses a throwaway container, no host `pg_dump` needed). Use the `postgres` connection string from Supabase (Dashboard → Connect → Session pooler):

```sh
docker run --rm -v "$PWD:/backup" postgres:17 \
  pg_dump "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  -Fc -f /backup/pre-medusa-$(date +%Y%m%d).dump
```

(PowerShell: replace `$PWD` with `${PWD}` and the date expression with a fixed name.) `*.dump` files are git-ignored; store the dump somewhere safe outside the repo.

### 2. Create the Medusa role and schema

Open [apps/backend/sql/supabase-setup.sql](apps/backend/sql/supabase-setup.sql), replace `CHANGE_ME` with a long random password, and run it in the Supabase **SQL Editor**. It does five things:

* creates login role `medusa` with `search_path = medusa`;
* creates schema `medusa` owned by that role;
* grants `CREATE` on the database (Medusa's link sync needs it, see [Findings](#medusa-2226-findings));
* revokes `anon` / `authenticated` / `service_role` from the schema;
* grants `medusa` to `postgres`, so the dashboard and `pg_dump` can see Medusa's objects.

Medusa therefore never touches `public`, `auth`, `storage` or other Supabase schemas. The role has no privileges on existing tables.

### 3. TLS certificate

Download the CA certificate from Supabase (Dashboard → Database → Settings → **SSL Configuration** → Download certificate) and save it as:

```
certs/supabase-ca.crt
```

`certs/` is mounted read-only into the backend container and is git-ignored.

### 4. Environment file

```sh
cp .env.example .env
```

Fill in:

* `DATABASE_URL`: connect as the **`medusa`** role (URL-encode the password).
  * **Session pooler** (default, IPv4): `postgresql://medusa.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`. The username is `role.project-ref`.
  * **Direct connection**: `postgresql://medusa:<password>@db.<project-ref>.supabase.co:5432/postgres`. This needs IPv6 from Docker, or Supabase's IPv4 add-on.
  * The **transaction pooler (port 6543) is rejected** by the preflight check, because migrations and Medusa need session semantics.
* `JWT_SECRET`, `COOKIE_SECRET`: 32+ random characters each (`openssl rand -hex 32`).

`.env` is read by the backend container only. The storefront receives just `MEDUSA_PUBLISHABLE_KEY` and `STOREFRONT_COOKIE_SECURE` through explicit `environment:` entries. Neither image contains `.env` or certificates (see the `.dockerignore` files).

### 5. Build, migrate, seed, create an admin

```sh
docker compose build
docker compose run --rm backend migrate
docker compose run --rm backend seed
docker compose run --rm backend create-admin admin@example.com 'a-strong-password'
```

* `migrate` runs the [preflight checks](#startup-sequence-and-safety-checks), then `medusa db:migrate --execute-safe-links --execute-safe-search`. It never prompts and never drops anything.
* `seed` is **idempotent**: it creates only what's missing and never overwrites. It sets up:
  * SEK as the default, tax-inclusive store currency;
  * region "Sverige" with manual payment;
  * tax region SE at 25 % moms;
  * stock location "Lager Göteborg", fulfilment for Sweden and shipping option "Standardfrakt" at 495 kr;
  * sales channel "Webbutik" with a linked publishable key;
  * three fictional heat pumps with placeholder images in the uploads volume and 25 units in stock each.

  It prints the key:

  ```
  Publishable API key (set MEDUSA_PUBLISHABLE_KEY in .env): pk_…
  ```

  Put that value into `.env` as `MEDUSA_PUBLISHABLE_KEY`.

### 6. Start

```sh
docker compose up --build
```

* Storefront: http://localhost:8000
* Admin: http://localhost:9000/app. Orders appear under **Orders**, with payment status *Authorized* through the manual provider.

On every start the backend runs the preflight checks and `db:migrate` (idempotent; disable with `MIGRATE_ON_START=false`), then `medusa start`. The storefront waits until the backend's `/health` check passes.

## Everyday commands

```sh
docker compose up --build                 # start (after initial setup)
docker compose logs -f backend            # backend logs
docker compose run --rm backend seed      # re-run seed (safe; creates only missing data)
docker compose run --rm backend preflight # database checks only
docker compose down                       # stop (keeps the uploads volume)
docker compose down -v                    # stop AND delete uploaded images (DB data is unaffected)
```

## Images from GitHub Actions → server

[.github/workflows/docker-images.yml](.github/workflows/docker-images.yml) builds both images on every push and publishes them to GitHub Container Registry. Pull requests are built only.

| Image | Tags |
|---|---|
| `ghcr.io/saboorgee/varmepumpfixarna-backend` | `latest` (default branch), `<branch>`, `sha-<short>`, `<version>` for `v*` tags |
| `ghcr.io/saboorgee/varmepumpfixarna-storefront` | same |

The images contain no `.env`, secrets or certificates; everything is injected at runtime.

### Server deployment (nginx-proxy, same pattern as the other apps)

The server already runs `jwilder/nginx-proxy` on ports 80/443 on the external Docker network `nginx-proxy`. HTTPS is terminated in front of it (Cloudflare). [docker-compose.server.yml](docker-compose.server.yml) attaches both services to that network:

| Service | `VIRTUAL_HOST` | `VIRTUAL_PORT` |
|---|---|---|
| storefront | `STOREFRONT_DOMAIN` (e.g. `varmepumpfixarna.se`) | 8000 |
| backend (Store API, Admin at `/app`, images at `/static`) | `BACKEND_DOMAIN` (e.g. `admin.varmepumpfixarna.se`) | 9000 |

Setting `COMPOSE_PATH_SEPARATOR=:` and `COMPOSE_FILE=docker-compose.yml:docker-compose.server.yml` in the server's `.env` makes every plain `docker compose …` command include the overlay. Ports 8000/9000 are bound to `127.0.0.1` only; the public entry point is nginx-proxy. Override them with `STOREFRONT_HOST_PORT` / `BACKEND_HOST_PORT` if they're taken.

**First-time setup on the server** (Docker Engine with the Compose plugin; no Node.js or PostgreSQL needed):

```sh
cd /home/saboor/program
git clone https://github.com/saboorgee/varmepumpfixarna.git && cd varmepumpfixarna
chmod +x deploy.sh
# GHCR packages of a private repo are private: log in with a token that has read:packages
echo "<github-token>" | docker login ghcr.io -u <github-user> --password-stdin

cp .env.example .env
# Fill in as in "Initial setup" (DATABASE_URL, secrets), plus the server values:
#   COMPOSE_PATH_SEPARATOR=:
#   COMPOSE_FILE=docker-compose.yml:docker-compose.server.yml
#   STOREFRONT_DOMAIN=…   BACKEND_DOMAIN=…
#   STORE_CORS=https://<STOREFRONT_DOMAIN>
#   ADMIN_CORS=https://<BACKEND_DOMAIN>   AUTH_CORS=https://<BACKEND_DOMAIN>
#   MEDUSA_PUBLIC_URL=https://<BACKEND_DOMAIN>
#   MEDUSA_COOKIE_SECURE=true   STOREFRONT_COOKIE_SECURE=true
# Put the Supabase CA at certs/supabase-ca.crt

docker compose pull
docker compose run --rm backend migrate
docker compose run --rm backend seed            # prints MEDUSA_PUBLISHABLE_KEY → add to .env
docker compose run --rm backend create-admin admin@example.com 'a-strong-password'
docker compose up -d --no-build
```

Point both DNS names at the server (in Cloudflare, proxied, like the other sites). Then:

* Shop: `https://<STOREFRONT_DOMAIN>`
* Admin: `https://<BACKEND_DOMAIN>/app`

**Updates:** push to `main`, wait for the "Docker images" workflow, then run `./deploy.sh` on the server. It runs `git pull`, `docker compose pull` and `docker compose up -d`; the backend applies migrations on start. To pin a build instead of `latest`, set `BACKEND_IMAGE` / `STOREFRONT_IMAGE` in `.env` (e.g. `…:sha-1a2b3c4`).

Notes:

* **Upload size.** nginx-proxy uses nginx's default 1 MB request body limit, so Admin image uploads above 1 MB fail with `413`. To raise it, mount a vhost file into the proxy, e.g. `./vhost.d:/etc/nginx/vhost.d:ro` with a file named `<BACKEND_DOMAIN>` containing `client_max_body_size 20m;`.
* **One-off commands on a running server.** `docker compose run` briefly starts an extra backend container, and nginx-proxy routes some traffic to it while it runs. Once the shop is live, prefer `docker compose exec backend sh /app/docker-entrypoint.sh seed` (or `create-admin …`).

The [production requirements](#production-requirements-not-covered-by-this-local-foundation) still apply (Redis, worker split, and so on).

## Supabase notes

### Connection modes and TLS

| `DATABASE_SSL` | Behaviour |
|---|---|
| `verify-full` (default) | Verifies the chain against `DATABASE_SSL_CA_FILE` **and** the hostname |
| `verify-ca` | Verifies the chain but not the hostname. Use it if the pooler's certificate name doesn't match the host you connect to |
| `no-verify` | Encrypted without verification. Troubleshooting only; logs a warning |
| `disable` | Plaintext. Never use against Supabase |

TLS is configured in code ([apps/backend/src/lib/database.ts](apps/backend/src/lib/database.ts)). `sslmode`/`ssl` parameters are stripped from `DATABASE_URL`, because node-postgres lets URL parameters override the explicit TLS settings. A Supabase host without `DATABASE_SSL_CA_FILE` fails fast with instructions.

If startup logs `ENETUNREACH`/`EHOSTUNREACH`, you're using the IPv6-only direct host. Switch to the session pooler string.

### Keeping Medusa out of the Data API

Supabase's REST/GraphQL Data API only serves schemas listed under **Project Settings → Data API → Exposed schemas**, which defaults to `public` and `graphql_public`. Medusa's tables live in schema `medusa`, so:

1. **Don't add `medusa` to "Exposed schemas".**
2. The setup SQL revokes all privileges for `anon`, `authenticated` and `service_role` (as in Supabase's "Securing your API" guide) on the schema and on future tables, sequences and functions. Even if the schema were exposed, requests with the anon key would get permission errors. The preflight re-applies the schema-level revoke on every start.
3. Verify:
   ```sql
   select grantee, privilege_type from information_schema.usage_privileges where object_schema = 'medusa';
   select has_schema_privilege('anon', 'medusa', 'USAGE');  -- expect false
   ```
   ```sh
   curl -s "https://<project-ref>.supabase.co/rest/v1/order?select=id" \
     -H "apikey: <anon-key>" -H "Accept-Profile: medusa"   # expect an error, never rows
   ```

### Startup sequence and safety checks

[apps/backend/src/lib/db-preflight.ts](apps/backend/src/lib/db-preflight.ts) runs before every migrate, seed or start and refuses to continue if any of these hold:

* `DATABASE_URL` is missing, still has placeholders, or uses port 6543;
* `DATABASE_SCHEMA` is `public` (unless `ALLOW_PUBLIC_SCHEMA=true`) or a Supabase-managed schema;
* TLS settings are inconsistent, or the CA file is missing;
* the database stays unreachable after `DB_WAIT_TIMEOUT_SECONDS` (default 90, retries every 3 s; auth errors fail immediately);
* the connecting role's default schema isn't `medusa`, or the role lacks `CREATE` on the schema or the database;
* `public` contains tables named `product`, `store`, `shipping_option`, `payment_collection` or `cat_*`. Medusa's initial migrations treat those as Medusa v1 leftovers and would ALTER them, or DROP `cat_*` tables. Override only after verifying: `SKIP_PUBLIC_COLLISION_CHECK=true`;
* `JWT_SECRET`/`COOKIE_SECRET` are shorter than 32 characters.

## Medusa 2.22.6 findings

Found while verifying against a real PostgreSQL. The design above works around them:

1. **`projectConfig.databaseSchema` alone does not isolate tables.** Module migrations run unqualified DDL, and Medusa's `SET LOCAL search_path` executes outside the migration transaction. Module tables were created in `public`; only link tables went to the configured schema. Fix: the role-level `search_path` on a dedicated role.
2. **Link tables were silently not created** without database-level `CREATE`. Link sync runs `CREATE SCHEMA IF NOT EXISTS`, which Postgres authorises before checking existence, and Medusa logs "Created" anyway. Fix: the grant in the setup SQL, enforced by the preflight.
3. **Tax-inclusive prices need the currency price preference.** `is_tax_inclusive` on the region only covers region-scoped prices, such as shipping. Product prices are per currency, so the seed sets SEK as tax-inclusive on the store. Without it, 25 % was added on top of the listed prices.
4. The default `search-postgres` module tries `CREATE EXTENSION pg_trgm/unaccent`, which soft-fails or installs into `medusa`. Only `/store/search` uses it; this storefront doesn't.

## Verification report (2026-11-11)

**Docker (2026-11-12, Docker Desktop 4.99 / Engine 29.9.3 / Compose v5.7.0):**

* `docker compose config` is valid.
* `docker compose build` passed for both images: backend 781 MB, storefront 294 MB. The lockfiles were regenerated with npm 10.9.9 from the `node:22.23.4` image, because the host's npm 11 lockfile was rejected by `npm ci` in the image.
* Both containers run as `node`, with no `.env` or certificates in either image.
* The backend entrypoint refuses to start without `DATABASE_URL`.
* The storefront container answers `GET /` with 200.

**Not executed:** anything that needs Supabase. No credentials were used, and nothing touched the real database. Still to run after setup:

* `docker compose up --build` against Supabase;
* upload-volume persistence across container restarts;
* the session pooler or direct connection with TLS verification against the Supabase CA;
* the Data API check above.

**Executed on the host** (Node 24) against a throwaway local PostgreSQL 17.10 (UTF-8, with Supabase-like `anon`/`authenticated` roles and pre-existing data in `public`). The setup SQL was applied unchanged except for the password.

| Check | Result |
|---|---|
| Lockfiles | `npm install` → committed `package-lock.json` in both apps; `npm ci --omit=dev` inside the built backend succeeded (Dockerfile runtime step) |
| Backend typecheck / `medusa build` (server + Admin bundle) | pass |
| Storefront `tsc`, `eslint`, `next build` (no backend reachable, no key) | pass; all routes are static shells with request-time data streamed |
| `docker-compose config` (v1.27, best effort) | valid; `DATABASE_URL` is only in the backend service |
| Preflight negatives | missing/placeholder URL, port 6543, `public`/`auth` schema, missing CA, invalid TLS mode, unreachable DB, colliding `public.product`, `postgres` role (default schema `public`), missing database `CREATE`, placeholder secrets: all refused with clear messages |
| Migrations as `medusa` role | 147 tables in `medusa`, `public` unchanged (pre-existing rows intact); second run: no changes |
| Seed ×2 | first run created everything (and recovered from earlier partial runs); second run: "nothing created" |
| Store API | 400 without key; 3 products at 18 995 / 64 900 / 109 900 SEK; images served from `/static`; Admin `/app` → 200 |
| Cart (API and storefront Server Actions with HTTP-only cookie) | add, update quantity, remove; over-stock quantity rejected by Medusa |
| Guest checkout via the storefront | address → Standardfrakt → test payment → order; 303 redirect to confirmation; cart cookie cleared; order page hidden from other browsers |
| Totals | 3 × 18 995 + 495 = **57 480 kr incl. 11 496 kr moms** (after fix 3) |
| Restart persistence | backend stopped and restarted: preflight + migrate no-op; Admin login (session cookie `HttpOnly; SameSite=Lax`, no `Secure` on http); all orders listed via the Admin API; images still served |

## Storefront design and open configuration (TODO)

The storefront follows the Häglared homepage mockup: brand **Värmepumpfixarna by Häglared Bygg och Kyla AB**, quote-first homepage (`/`) with the shop under `/produkter`. Styles live in `apps/storefront/src/app/site.css` (ported from the mockup, same class names and breakpoints) with design tokens in `globals.css`; company details in `src/lib/site.ts`.

Everything that still needs configuration is marked in the code with `TODO(config)`. List the markers with `grep -rn "TODO(config)" apps`.

| Item | Where |
|---|---|
| **Quote form is not connected.** It validates and replies honestly that nothing was sent. Needed: store requests (Medusa module with an Admin list), email notification, spam protection and rate limiting | `src/lib/quote.ts` |
| Attached quotes ("Jämför offert"): private file storage (never public `/static`) and a larger body limit; the file input is not sent yet | `src/lib/quote.ts`, `quote-form.tsx` |
| Mailbox `info@varmepumpfixarna.se` plus MX/SPF/DKIM in Cloudflare; optional phone number | `src/lib/site.ts`, footer |
| Real privacy policy | `/integritet` |
| Medusa product categories (Luft/luft, Luft/vatten, Bergvärme) to filter `/produkter` from the homepage cards | `produkter/page.tsx`, `sections.tsx` |
| Official NIBE/Toshiba dealer logos (text wordmarks for now) | `sections.tsx` |
| Real payment provider, then remove the test notice and test labels | `header.tsx`, `forms.tsx` |
| Order confirmation emails | `order/[id]/page.tsx` |

## Production requirements (not covered by this local foundation)

* **Redis** for the event bus, cache/caching, workflow engine and locking modules (`@medusajs/medusa/event-bus-redis`, `workflow-engine-redis`, `locking-redis`, Redis caching), and as the session store. The in-memory providers lose state on restart and don't work across instances.
* **Separate server and worker deployments**: `MEDUSA_WORKER_MODE=server` for HTTP instances (scalable) and exactly one `worker` instance for subscribers and scheduled jobs, both with Redis. `shared` is for local use only. Serve the Admin only from server instances (`admin.disable: true` on the worker).
* **Migrations as a release step**, run once per deploy (`migrate` command), with `MIGRATE_ON_START=false` on app instances.
* **File storage**: an S3-compatible provider (e.g. Supabase Storage via S3 or AWS S3) instead of the local volume, behind a CDN.
* **Real payment provider** (Stripe, Klarna, Swish via a PSP) with webhooks; remove `pp_system_default` from the region.
* **HTTPS everywhere**: `MEDUSA_COOKIE_SECURE=true`, `STOREFRONT_COOKIE_SECURE=true`, real CORS origins and `MEDUSA_PUBLIC_URL`.
* **Secrets management** (not `.env` files); rotate JWT/cookie secrets and the DB password.
* **Database**: Supabase backups/PITR, network restrictions, connection limits sized for the pooler, monitoring of the `medusa` role.
* **Notifications** (order confirmation e-mail), customer accounts, Swedish legal pages (köpvillkor, GDPR, ångerrätt), real VAT and shipping configuration.
* Observability (logs, metrics, tracing), rate limiting, and a CI pipeline for builds and tests.

## Repository layout

```
apps/backend/        Medusa v2 (medusa-config.ts, src/lib/{database,db-preflight}.ts,
                     src/scripts/seed.ts, sql/supabase-setup.sql, Dockerfile, docker-entrypoint.sh)
apps/storefront/     Next.js (src/lib/{medusa,cart,actions}.ts, src/app/{page, produkter/[handle],
                     varukorg, kassa, order/[id]}, src/components, Dockerfile)
certs/               Supabase CA certificate (git-ignored, mounted read-only)
docker-compose.yml   backend + storefront, uploads volume
.env.example         configuration template (backend-only secrets)
```
