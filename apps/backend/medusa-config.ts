import { loadEnv, defineConfig } from "@medusajs/framework/utils"
import {
  buildSslOptions,
  getDatabaseSchema,
  sanitizeDatabaseUrl,
} from "./src/lib/database"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

// Browser-reachable URL of this backend. Used for file URLs (product images),
// which the shopper's browser loads directly – never the Docker-internal host.
const publicBackendUrl = (
  process.env.MEDUSA_PUBLIC_URL || "http://localhost:9000"
).replace(/\/+$/, "")

const workerMode = (process.env.MEDUSA_WORKER_MODE || "shared") as
  | "shared"
  | "worker"
  | "server"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: sanitizeDatabaseUrl(process.env.DATABASE_URL),
    // Medusa tables live in their own schema so that Supabase-managed schemas
    // (public, auth, storage, …) are left untouched and the tables are not
    // exposed through Supabase's Data API (which only serves "Exposed schemas").
    databaseSchema: getDatabaseSchema(),
    databaseDriverOptions: {
      connection: {
        ssl: buildSslOptions(),
      },
      // Supabase's session pooler caps connections per user; keep the pool small.
      pool: {
        min: 0,
        max: Number(process.env.DATABASE_POOL_MAX || 5),
        idleTimeoutMillis: 30_000,
      },
    },
    workerMode,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
    // Medusa forces `Secure` session cookies when NODE_ENV=production. Locally
    // the Admin runs over plain http, so allow opting out via env.
    cookieOptions:
      process.env.MEDUSA_COOKIE_SECURE === undefined
        ? {}
        : { secure: process.env.MEDUSA_COOKIE_SECURE === "true" },
  },
  admin: {
    // Admin is served by this backend at /app; same-origin API calls.
    backendUrl: "/",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              // Relative to the working directory (/app in Docker), backed by a volume.
              upload_dir: "static",
              backend_url: `${publicBackendUrl}/static`,
            },
          },
        ],
      },
    },
  ],
})
