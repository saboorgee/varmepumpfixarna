import Link from "next/link";
import { SITE } from "@/lib/site";
import { IntentLink } from "@/components/ui/intent-link";
import { Logo } from "@/components/ui/logo";

export function SiteFooter() {
  return (
    <footer id="kontakt" className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div>
            <Logo className="footer-brand" />
            <p>
              Värmepumpar, installation och service.
              <br />
              Med bas i {SITE.city}.
            </p>
          </div>
          <div>
            <h3>Hitta rätt</h3>
            <Link href="/produkter">Våra värmepumpar</Link>
            <IntentLink intent="compare" className="footer-link">
              Jämför din offert
            </IntentLink>
            <IntentLink intent="service" className="footer-link">
              Service &amp; reparation
            </IntentLink>
          </div>
          <div>
            <h3>Kontakta oss</h3>
            <Link href="/#offert">Be oss kontakta dig ↗</Link>
            {/* TODO(config): mailbox not set up yet – see SITE.email in src/lib/site.ts. */}
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <p>
              {SITE.street}
              <br />
              {SITE.postcode} {SITE.city}
            </p>
          </div>
          <div>
            <h3>Företaget</h3>
            <p>
              {SITE.legalName}
              <br />
              Org.nr {SITE.orgNr}
            </p>
            <Link className="footer-link" href="/integritet">
              Integritet
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {SITE.copyrightYear} {SITE.legalName}
          </span>
          <span>Alla priser i SEK inkl. moms · Illustrativa bilder</span>
          <a href="#main">Till toppen ↑</a>
        </div>
      </div>
    </footer>
  );
}
