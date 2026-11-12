// Company and contact details shown across the site.
// Open configuration items are marked `TODO(config)`; list them all with:
//   grep -rn "TODO(config)" apps

export const SITE = {
  brand: "Värmepumpfixarna",
  byline: "by Häglared Bygg och Kyla AB",
  legalName: "Häglared Bygg och Kyla AB",
  orgNr: "559453-6129",
  street: "Häglared Gohult 9",
  postcode: "516 90",
  city: "Dalsjöfors",
  // TODO(config): the mailbox info@varmepumpfixarna.se is not set up yet
  // (create it and add MX/SPF/DKIM records in Cloudflare DNS).
  email: "info@varmepumpfixarna.se",
  // TODO(config): add a public phone number when one exists, and show it in the
  // header/footer and the quote form's fallback text.
  phone: null as string | null,
  // Static on purpose: Next.js prerendering forbids reading the current time.
  copyrightYear: 2026,
} as const;

/** Values used by the quote form's "Jag är intresserad av" select. */
export const QUOTE_KINDS = [
  { value: "unsure", slug: "osaker", label: "Osäker – hjälp mig välja" },
  { value: "airair", slug: "luft-luft", label: "Luft/luftvärmepump" },
  { value: "airwater", slug: "luft-vatten", label: "Luft/vattenvärmepump" },
  { value: "ground", slug: "bergvarme", label: "Bergvärme" },
  { value: "service", slug: "service", label: "Service & reparation" },
] as const;

export type QuoteKind = (typeof QUOTE_KINDS)[number]["value"];

/** Tabs at the top of the quote form, with their URL slug (`?flik=`). */
export const QUOTE_INTENTS = [
  { value: "pump", slug: "ny", label: "Ny värmepump" },
  { value: "compare", slug: "jamfor", label: "Jämför offert" },
  { value: "service", slug: "service", label: "Service" },
] as const;

export type QuoteIntent = (typeof QUOTE_INTENTS)[number]["value"];

/** Link to the quote form with a tab / product type preselected. */
export function quoteHref(options: { intent?: QuoteIntent; kind?: QuoteKind; product?: string } = {}) {
  const params = new URLSearchParams();
  const intent = QUOTE_INTENTS.find((i) => i.value === options.intent);
  const kind = QUOTE_KINDS.find((k) => k.value === options.kind);
  if (intent && intent.value !== "pump") params.set("flik", intent.slug);
  if (kind && kind.value !== "unsure") params.set("typ", kind.slug);
  if (options.product) params.set("produkt", options.product);
  const query = params.toString();
  return `/${query ? `?${query}` : ""}#offert`;
}
