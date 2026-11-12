import type { Metadata } from "next";
import { Page } from "@/components/store-ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Integritet" };

// TODO(config): replace this placeholder with the company's real privacy policy
// (personuppgiftsansvarig, ändamål, rättslig grund, lagringstid, mottagare som
// Supabase/e-postleverantör, och dina rättigheter enligt GDPR).
export default function PrivacyPage() {
  return (
    <Page eyebrow="Integritet" title="Så hanterar vi dina uppgifter">
      <div className="max-w-2xl space-y-5 text-[15px] leading-[1.8] text-muted">
        <p>
          {SITE.legalName} (org.nr {SITE.orgNr}) ansvarar för de personuppgifter du lämnar via {SITE.brand}.
        </p>
        <p>
          När du beställer använder vi dina kontakt- och leveransuppgifter för att hantera beställningen. När du
          ber om en offert använder vi uppgifterna för att besvara din förfrågan.
        </p>
        <p className="rounded-[5px] border border-line bg-white p-4 text-[13px]">
          Den fullständiga integritetspolicyn publiceras här innan webbplatsen tas i drift. Har du frågor
          redan nu? Kontakta {SITE.legalName}, {SITE.street}, {SITE.postcode} {SITE.city}.
        </p>
      </div>
    </Page>
  );
}
