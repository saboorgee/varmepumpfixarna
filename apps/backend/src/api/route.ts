import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * The Admin dashboard is served at /app. Redirect the bare backend domain
 * (e.g. https://admin.varmepumpfixarna.se/) there instead of returning 404.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.redirect(302, "/app")
}
