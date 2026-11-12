"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useState, type FormEvent } from "react";
import { submitQuoteRequest, type QuoteField, type QuoteState } from "@/lib/quote";
import { QUOTE_INTENTS, QUOTE_KINDS, type QuoteIntent, type QuoteKind } from "@/lib/site";
import { Icon } from "@/components/ui/icons";
import { QUOTE_INTENT_EVENT, type QuoteIntentDetail } from "@/components/ui/intent-link";

type Initial = { intent: QuoteIntent; kind: QuoteKind; product: string };

const DEFAULTS: Initial = { intent: "pump", kind: "unsure", product: "" };

const SUBMIT_LABEL: Record<QuoteIntent, string> = {
  pump: "Be om kostnadsfri offert",
  compare: "Be oss jämföra din offert",
  service: "Be om hjälp med service",
};

const POSTCODE = /^\d{3} ?\d{2}$/;

function kindFor(intent: QuoteIntent, kind?: QuoteKind): QuoteKind {
  if (intent === "service") return "service";
  return kind && kind !== "service" ? kind : "unsure";
}

function QuoteFormInner({ initial }: { initial: Initial }) {
  const [intent, setIntentState] = useState<QuoteIntent>(initial.intent);
  const [kind, setKind] = useState<QuoteKind>(kindFor(initial.intent, initial.kind));
  const [contactType, setContactType] = useState<"phone" | "email">("phone");
  const [detailsOpen, setDetailsOpen] = useState(initial.intent === "compare" || Boolean(initial.product));
  const [clientError, setClientError] = useState<{ field: QuoteField; error: string } | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<QuoteState, FormData>(submitQuoteRequest, {
    status: "idle",
  });

  const serverError = state.status === "invalid" ? state : null;
  const error = clientError ?? serverError;
  const showResult = state.status === "not-configured" && state.submissionId !== dismissed;

  function setIntent(next: QuoteIntent, nextKind?: QuoteKind) {
    setIntentState(next);
    setKind(kindFor(next, nextKind));
    setDetailsOpen(next === "compare");
    setClientError(null);
    if (state.status === "not-configured") setDismissed(state.submissionId);
  }

  // Category cards, "Jämför min offert", footer links … (see IntentLink).
  useEffect(() => {
    const onIntent = (event: Event) => {
      const { intent: next, kind: nextKind } = (event as CustomEvent<QuoteIntentDetail>).detail;
      setIntent(next, nextKind);
    };
    window.addEventListener(QUOTE_INTENT_EVENT, onIntent);
    return () => window.removeEventListener(QUOTE_INTENT_EVENT, onIntent);
  });

  function validate(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const value = (name: string) => String(new FormData(form).get(name) ?? "").trim();
    const contactInput = form.elements.namedItem("contact") as HTMLInputElement;
    let found: { field: QuoteField; error: string } | null = null;
    if (!value("name")) found = { field: "name", error: "Fyll i ditt namn." };
    else if (!POSTCODE.test(value("postcode")))
      found = { field: "postcode", error: "Fyll i ett svenskt postnummer med fem siffror." };
    else if (!value("contact") || !contactInput.validity.valid)
      found = {
        field: "contact",
        error: contactType === "email" ? "Fyll i en giltig e-postadress." : "Fyll i ditt telefonnummer.",
      };
    setClientError(found);
    if (found) {
      event.preventDefault();
      (form.elements.namedItem(found.field) as HTMLElement | null)?.focus();
    }
  }

  if (showResult) {
    return (
      <div className="form-result" role="status">
        <span className="result-icon">
          <Icon name="info" />
        </span>
        {/* TODO(config): replace with a real confirmation once requests are delivered (src/lib/quote.ts). */}
        <h3>Formuläret är inte kopplat ännu</h3>
        <p>
          Tack för ditt intresse! Webbplatsen byggs fortfarande och din förfrågan har <strong>inte</strong>{" "}
          skickats. Försök gärna igen om några dagar.
        </p>
        <button type="button" className="button button-dark" onClick={() => setDismissed(state.submissionId)}>
          Tillbaka till formuläret
        </button>
      </div>
    );
  }

  const invalid = (field: QuoteField) => (error?.field === field ? true : undefined);

  return (
    <>
      <div className="intent-tabs" role="group" aria-label="Typ av förfrågan">
        {QUOTE_INTENTS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={intent === tab.value}
            onClick={() => setIntent(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form action={formAction} onSubmit={validate} noValidate>
        <input type="hidden" name="intent" value={intent} />
        <div className="field">
          <label htmlFor="kind">Jag är intresserad av</label>
          <select id="kind" name="kind" value={kind} onChange={(e) => setKind(e.target.value as QuoteKind)}>
            {QUOTE_KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="name">
              Namn <span>*</span>
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Ditt namn"
              required
              aria-invalid={invalid("name")}
            />
          </div>
          <div className="field postcode-field">
            <label htmlFor="postcode">
              Postnummer <span>*</span>
            </label>
            <input
              id="postcode"
              name="postcode"
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="516 90"
              pattern="[0-9]{3} ?[0-9]{2}"
              maxLength={6}
              required
              aria-invalid={invalid("postcode")}
            />
          </div>
        </div>
        <fieldset className="contact-choice">
          <legend>Hur vill du bli kontaktad?</legend>
          <label>
            <input
              type="radio"
              name="contactType"
              value="phone"
              checked={contactType === "phone"}
              onChange={() => setContactType("phone")}
            />
            <span>Ring mig</span>
          </label>
          <label>
            <input
              type="radio"
              name="contactType"
              value="email"
              checked={contactType === "email"}
              onChange={() => setContactType("email")}
            />
            <span>Mejla mig</span>
          </label>
        </fieldset>
        <div className="field">
          <label htmlFor="contact">
            {contactType === "email" ? "E-post" : "Telefon"} <span>*</span>
          </label>
          <input
            key={contactType}
            id="contact"
            name="contact"
            type={contactType === "email" ? "email" : "tel"}
            autoComplete={contactType === "email" ? "email" : "tel"}
            placeholder={contactType === "email" ? "Din e-postadress" : "Ditt telefonnummer"}
            required
            aria-invalid={invalid("contact")}
          />
        </div>
        <details
          className="more-details"
          open={detailsOpen}
          onToggle={(e) => setDetailsOpen(e.currentTarget.open)}
        >
          <summary>
            <span>{intent === "compare" ? "Bifoga offert eller skriv ett meddelande" : "Lägg till ett meddelande"}</span>
            <span className="optional">Valfritt</span>
            <Icon name="plus" />
          </summary>
          <div className="field">
            <label className="visually-hidden" htmlFor="message">
              Meddelande
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              maxLength={2000}
              defaultValue={initial.product ? `Jag är intresserad av ${initial.product} med installation.` : ""}
              placeholder="Till exempel vad du har för uppvärmning idag, eller vad du vill ha hjälp med."
            />
          </div>
          {intent === "compare" && (
            <div className="upload-field">
              <label htmlFor="offer-file">
                Bifoga din offert <span>(valfritt)</span>
              </label>
              {/* TODO(config): no `name` on purpose – files are not sent until private storage exists (src/lib/quote.ts). */}
              <input id="offer-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" />
              <small>PDF eller bild. Undvik personnummer och andra känsliga uppgifter.</small>
            </div>
          )}
        </details>
        {error && (
          <div className="form-error" role="alert">
            {error.error}
          </div>
        )}
        <button className="button button-orange submit" type="submit" disabled={pending}>
          <span>{pending ? "Skickar…" : SUBMIT_LABEL[intent]}</span>
          <Icon name="arrow" />
        </button>
        <p className="form-fineprint">
          Dina uppgifter används för att besvara din förfrågan.
          <br />
          <Link className="text-link" href="/integritet">
            Läs om integritet
          </Link>
        </p>
      </form>
    </>
  );
}

function QuoteFormFromUrl() {
  const params = useSearchParams();
  const flik = params.get("flik");
  const typ = params.get("typ");
  const initial: Initial = {
    intent: QUOTE_INTENTS.find((i) => i.slug === flik)?.value ?? "pump",
    kind: QUOTE_KINDS.find((k) => k.slug === typ)?.value ?? "unsure",
    product: (params.get("produkt") ?? "").slice(0, 120),
  };
  return <QuoteFormInner key={params.toString()} initial={initial} />;
}

export function QuoteForm() {
  return (
    <div className="quote-card" id="offert">
      <div className="form-eyebrow">
        <span className="live-dot" />
        KOSTNADSFRITT &amp; UTAN KÖPKRAV
      </div>
      <h2>Vad kan vi hjälpa dig med?</h2>
      <p className="form-intro">Berätta lite om ditt behov, så tar vi nästa steg tillsammans.</p>
      <Suspense fallback={<QuoteFormInner initial={DEFAULTS} />}>
        <QuoteFormFromUrl />
      </Suspense>
    </div>
  );
}
