"use server";

import { QUOTE_INTENTS, QUOTE_KINDS } from "@/lib/site";

export type QuoteField = "name" | "postcode" | "contact";

export type QuoteState =
  | { status: "idle" }
  | { status: "invalid"; field: QuoteField; error: string }
  | { status: "not-configured"; submissionId: string };

const POSTCODE = /^\d{3} ?\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{6,20}$/;

/**
 * Quote / service / compare request from the homepage form.
 *
 * TODO(config): the form is not connected yet. Before going live:
 *   1. Store the request – e.g. a Medusa "Förfrågningar" module (custom module +
 *      store API route) with a list in Medusa Admin, so requests aren't lost.
 *   2. Notify the company by email at info@varmepumpfixarna.se (Resend or SMTP;
 *      the sending domain needs SPF/DKIM records in Cloudflare).
 *   3. Attached quotes (PDF/images, "Jämför offert"): store them PRIVATELY –
 *      never in Medusa's public /static uploads – and raise the Server Action
 *      body limit (next.config.ts → experimental.serverActions.bodySizeLimit)
 *      or upload directly to the backend. The file input currently has no
 *      `name`, so no file is sent.
 *   4. Spam protection (honeypot/turnstile) and rate limiting per IP.
 *   5. Privacy: retention period and a real policy on /integritet.
 * Until then this action validates the input and reports honestly that nothing
 * was sent. It never logs personal data.
 */
export async function submitQuoteRequest(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const intent = QUOTE_INTENTS.find((i) => i.value === text("intent"))?.value ?? "pump";
  const kind = QUOTE_KINDS.find((k) => k.value === text("kind"))?.value ?? "unsure";
  const contactType = text("contactType") === "email" ? "email" : "phone";
  const name = text("name");
  const postcode = text("postcode");
  const contact = text("contact");
  const message = text("message").slice(0, 2000);

  if (!name) return { status: "invalid", field: "name", error: "Fyll i ditt namn." };
  if (!POSTCODE.test(postcode)) {
    return { status: "invalid", field: "postcode", error: "Fyll i ett svenskt postnummer med fem siffror." };
  }
  if (contactType === "email" ? !EMAIL.test(contact) : !PHONE.test(contact)) {
    return {
      status: "invalid",
      field: "contact",
      error: contactType === "email" ? "Fyll i en giltig e-postadress." : "Fyll i ditt telefonnummer.",
    };
  }

  // TODO(config): deliver { intent, kind, name, postcode, contactType, contact, message } (see above).
  void [intent, kind, message];

  return { status: "not-configured", submissionId: crypto.randomUUID() };
}
