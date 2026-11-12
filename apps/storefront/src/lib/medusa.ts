/**
 * Server-side Medusa client. Only imported from Server Components and Server
 * Actions – the browser never talks to Medusa directly, so the backend URL can
 * be the Docker-internal address and the publishable key is read at runtime.
 */
import Medusa, { FetchError } from "@medusajs/js-sdk";
import type { HttpTypes } from "@medusajs/types";

export const COUNTRY_CODE = "se";

let client: Medusa | undefined;

export class StoreConfigError extends Error {}

export function getSdk(): Medusa {
  const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY?.trim();
  if (!publishableKey) {
    throw new StoreConfigError(
      "MEDUSA_PUBLISHABLE_KEY saknas. Kör seed-kommandot och lägg nyckeln i .env (se README)."
    );
  }
  if (!client) {
    client = new Medusa({
      baseUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
      publishableKey,
      debug: process.env.NODE_ENV === "development",
      // No customer auth in this storefront; never touch browser storage.
      auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
    });
  }
  return client;
}

let regionCache: { region: HttpTypes.StoreRegion; expires: number } | undefined;

/** The Swedish region (SEK). Cached briefly; failures are not cached. */
export async function getRegion(): Promise<HttpTypes.StoreRegion> {
  if (regionCache && regionCache.expires > Date.now()) {
    return regionCache.region;
  }
  const { regions } = await getSdk().store.region.list({
    fields: "id,name,currency_code,*countries",
    limit: 50,
  });
  const region = regions.find((r) =>
    r.countries?.some((c) => c.iso_2 === COUNTRY_CODE)
  );
  if (!region) {
    throw new StoreConfigError(
      "Ingen region för Sverige hittades i Medusa. Kör seed-kommandot (se README)."
    );
  }
  regionCache = { region, expires: Date.now() + 5 * 60_000 };
  return region;
}

const sekFormatter = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Medusa v2 amounts are in major units (kronor). */
export function formatSek(amount: number | null | undefined): string {
  return sekFormatter.format(Number(amount ?? 0));
}

export function isNotFound(error: unknown): boolean {
  return error instanceof FetchError && error.status === 404;
}

// Swedish wording for common Medusa validation errors; anything else is shown
// as Medusa reports it (validation itself always happens in Medusa).
const KNOWN_ERRORS: [RegExp, string][] = [
  [/required inventory/i, "Det finns inte tillräckligt många i lager för vald kvantitet."],
  [/email/i, "Ange en giltig e-postadress."],
  [/shipping/i, "Fraktsättet kunde inte användas för leveransadressen."],
  [/payment/i, "Betalningen kunde inte genomföras."],
];

/** Turns SDK errors into a short message suitable for the UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof StoreConfigError) {
    return error.message;
  }
  if (error instanceof FetchError) {
    const original = error.message || `Medusa svarade med status ${error.status}.`;
    const known = KNOWN_ERRORS.find(([pattern]) => pattern.test(original));
    return known ? `${known[1]} (${original})` : original;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ett okänt fel inträffade.";
}
