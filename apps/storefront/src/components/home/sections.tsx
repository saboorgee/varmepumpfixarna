import Image from "next/image";
import Link from "next/link";
import toshibaLogo from "@/assets/brands/toshiba.png";
import { SITE } from "@/lib/site";
import { BrandMark, Icon } from "@/components/ui/icons";
import { IntentLink } from "@/components/ui/intent-link";
import { HeroArt } from "./hero-art";
import { LocalMap } from "./local-map";
import { QuoteForm } from "./quote-form";

export function Hero() {
  return (
    <section className="hero">
      <div className="shell hero-grid">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            Värmepump i {SITE.serviceArea}
          </div>
          <h1>
            Ett varmare hem.
            <br />
            <span>Ett bättre pris.</span>
          </h1>
          <p className="hero-intro">
            Hitta rätt värmepump för ditt hem och din budget. Vi hjälper dig med valet, installationen och
            servicen.
          </p>
          <div className="hero-benefits">
            <span>
              <Icon name="check" />
              Flera ledande märken
            </span>
            <span>
              <Icon name="check" />
              Pris med installation
            </span>
          </div>
          {/* TODO(config): optionally swap for a real photo from your own installations later. */}
          <figure className="hero-photo hero-art">
            <HeroArt />
            <div className="photo-label">
              <Icon name="pin" />
              <span>
                Lokalt förankrade.
                <br />
                <strong>I {SITE.serviceArea}.</strong>
              </span>
            </div>
          </figure>
        </div>
        <QuoteForm />
      </div>
    </section>
  );
}

export function Brands() {
  return (
    <section className="brands" aria-label="Varumärken">
      <div className="shell brands-inner">
        <p>
          Fler märken.
          <br />
          <strong>Fler möjligheter.</strong>
        </p>
        {/* TODO(config): replace the NIBE text wordmark with the official dealer logo file (with permission). */}
        <div className="brand-nibe">NIBE</div>
        {/* Toshiba logo from global.toshiba brand assets, self-hosted (transparent background). */}
        <Image src={toshibaLogo} alt="Toshiba" className="brand-logo" />
        <span className="brand-more">
          Och flera andra
          <br />
          kvalitetsmärken
        </span>
        <p className="brands-note">
          Vi hjälper dig jämföra alternativen
          <br />
          utifrån ditt hem och din budget.
        </p>
      </div>
    </section>
  );
}

function AirAirArt() {
  return (
    <svg viewBox="0 0 380 210" aria-hidden="true">
      <ellipse cx="190" cy="180" rx="125" ry="12" fill="#dce3db" />
      <rect x="75" y="55" width="230" height="73" rx="13" fill="#fff" stroke="#adb9ae" strokeWidth="1.3" />
      <path d="M89 105h202m-195 7h188" stroke="#8e9f92" strokeWidth="2" />
      <path d="M94 69h190" stroke="#e6ebe5" strokeWidth="3" />
      <circle cx="281" cy="91" r="2" fill="#70917a" />
      <path
        d="M124 143c-8 13 9 15 0 27m66-27c-8 13 9 15 0 27m66-27c-8 13 9 15 0 27"
        fill="none"
        stroke="#b5c5b4"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AirWaterArt() {
  return (
    <svg viewBox="0 0 380 210" aria-hidden="true">
      <ellipse cx="190" cy="180" rx="125" ry="12" fill="#e3ded1" />
      <rect x="62" y="79" width="164" height="92" rx="7" fill="#f9faf7" stroke="#b9b6aa" strokeWidth="1.3" />
      <circle cx="118" cy="123" r="33" fill="#e1e5de" stroke="#b9bfb4" />
      <g fill="#9eaba0" transform="translate(118 123)">
        <path d="M0 0c-26-13-22-29-9-24C4-20 5-9 0 0Z" />
        <path d="M0 0c24-17 36-5 25 4C16 14 7 11 0 0Z" />
        <path d="M0 0c4 29-12 35-15 21C-19 8-12 1 0 0Z" />
      </g>
      <circle cx="118" cy="123" r="5" fill="#6b7d6e" />
      <path d="M165 101h38m-38 9h38m-38 9h38m-38 9h38m-38 9h38" stroke="#c4cbc0" strokeWidth="2" />
      <rect x="246" y="25" width="69" height="150" rx="5" fill="#fff" stroke="#b9b6aa" strokeWidth="1.3" />
      <rect x="264" y="48" width="34" height="21" rx="3" fill="#294d40" />
      <path d="M247 96h67" stroke="#e3e5de" />
      <path d="M77 173v8m131-8v8m50-4v5m45-5v5" stroke="#889181" strokeWidth="5" />
    </svg>
  );
}

function GroundArt() {
  return (
    <svg viewBox="0 0 380 210" aria-hidden="true">
      <path d="m64 94 65-51 65 51" fill="#f8faf5" stroke="#95a88f" strokeWidth="2" />
      <path d="M76 89v64h105V89" fill="#f8faf5" stroke="#95a88f" strokeWidth="2" />
      <path d="M111 152v-34h30v34" fill="#dae4d4" stroke="#95a88f" />
      <rect x="247" y="43" width="62" height="110" rx="5" fill="#fff" stroke="#a4b09e" strokeWidth="1.3" />
      <rect x="263" y="60" width="30" height="18" rx="3" fill="#294d40" />
      <path d="M49 153h283" stroke="#7e9476" strokeWidth="2" />
      <path d="M166 155v32c0 8 13 8 13 0v-32m0 12h98v-14" fill="none" stroke="#b29c65" strokeWidth="3" />
      <path d="M52 172h76m83 18h109M65 194h64" stroke="#ced8c5" strokeWidth="1.5" />
    </svg>
  );
}

const SOLUTIONS = [
  {
    kind: "airair",
    art: "art-air",
    number: "01 / LUFT",
    title: "Luft/luft",
    tag: "Värme & svalka",
    text: "Ett komplement till din uppvärmning. För villa, fritidshus och garage.",
    cta: "Få pris med installation",
    Art: AirAirArt,
  },
  {
    kind: "airwater",
    art: "art-water",
    number: "02 / VATTEN",
    title: "Luft/vatten",
    tag: "Hela hemmets värme",
    text: "Värme och varmvatten för dig som har ett vattenburet värmesystem.",
    cta: "Få pris med installation",
    Art: AirWaterArt,
  },
  {
    kind: "ground",
    art: "art-ground",
    number: "03 / BERG",
    title: "Bergvärme",
    tag: "Energi från berget",
    text: "För dig som vill byta din befintliga bergvärmepump.",
    cta: "Få en anpassad offert",
    Art: GroundArt,
  },
] as const;

export function Solutions() {
  return (
    <section className="section solutions" id="varmepumpar">
      <div className="shell">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Värme som passar dig</div>
            <h2 className="heading-2">
              Olika hus.
              <br />
              Samma omtanke.
            </h2>
          </div>
          <p>
            En mindre villa, ett fritidshus eller ett helt nytt värmesystem? Vi hjälper dig hitta rätt bland
            flera märken och lösningar.
          </p>
        </div>
        <div className="solution-grid">
          {SOLUTIONS.map(({ kind, art, number, title, tag, text, cta, Art }) => (
            <article className="solution-card" key={kind}>
              <div className={`solution-art ${art}`}>
                <span className="art-number">{number}</span>
                <Art />
              </div>
              <div className="solution-body">
                <div className="solution-title">
                  <h3>{title}</h3>
                  <span>{tag}</span>
                </div>
                <p>{text}</p>
                <IntentLink intent="pump" kind={kind} className="card-link">
                  {cta} <Icon name="diagonal" />
                </IntentLink>
                {/* TODO(config): link to /produkter?kategori=… once Luft/luft, Luft/vatten and Bergvärme exist as Medusa product categories. */}
                <Link href="/produkter" className="card-link card-link-secondary">
                  Se produkter och priser <Icon name="arrow" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="service-strip">
          <span className="service-symbol" aria-hidden="true">
            ↗
          </span>
          <p>
            <strong>Har du redan en värmepump?</strong> Vi hjälper även till med service och reparation.
          </p>
          <IntentLink intent="service" className="text-button">
            Fråga om service <Icon name="arrow" />
          </IntentLink>
        </div>
      </div>
    </section>
  );
}

export function ComparePanel() {
  return (
    <section className="price-section">
      <div className="shell">
        <div className="price-panel">
          <div className="price-left">
            <div className="eyebrow">Låt oss jämföra</div>
            <h2 className="heading-2">
              Redan fått <br />
              en offert?
            </h2>
            <span className="price-doodle" aria-hidden="true">
              ↗
            </span>
          </div>
          <div className="price-right">
            <h3>Ge oss chansen att ge dig ett bättre pris.</h3>
            <p>
              Skicka din offert. Vi jämför pump, installation och villkor – och ser om vi kan matcha eller slå
              totalpriset.
            </p>
            <IntentLink intent="compare" className="button button-orange">
              Jämför min offert <Icon name="diagonal" />
            </IntentLink>
            <small>Du kan bifoga en bild eller PDF i formuläret.</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Local() {
  return (
    <section className="section local-section" id="om-oss">
      <div className="shell local-grid">
        <LocalMap address={`${SITE.street}, ${SITE.postcode} ${SITE.city}`}>
          <div className="local-gridlines" />
          <span className="local-caption">{SITE.legalName.toUpperCase()}</span>
          <div className="location-orbit orbit-one" />
          <div className="location-orbit orbit-two" />
          <div className="location-dot">
            <BrandMark />
          </div>
          <div className="local-location">
            <span>VI UTGÅR FRÅN</span>
            <strong>{SITE.city}</strong>
            <p>{SITE.street}</p>
          </div>
          <span className="local-postcode">{SITE.postcode}</span>
        </LocalMap>
        <div className="local-copy">
          <div className="eyebrow">Ett lokalt företag</div>
          <h2 className="heading-2">
            Nära till hands.
            <br />
            Hela vägen.
          </h2>
          <p>
            {SITE.brand} drivs av {SITE.legalName} och finns för dig i {SITE.serviceArea}. Vi säljer och
            installerar luft/luft och luft/vatten, byter befintliga bergvärmepumpar – och hjälper till med service.
          </p>
          <p>
            Du behöver inte veta vilken pump du ska välja. Börja med att berätta om ditt hus och din budget, så
            hjälper vi dig att jämföra alternativen.
          </p>
          <div className="local-points">
            <span>
              <Icon name="check" />
              Flera märken att välja mellan
            </span>
            <span>
              <Icon name="check" />
              Offert med tydligt installationsinnehåll
            </span>
            <span>
              <Icon name="check" />
              Hjälp även med service
            </span>
          </div>
          <a href="#offert" className="text-button">
            Låt oss prata om ditt hem <Icon name="arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "Berätta om ditt hem",
    text: "Fyll i formuläret. Välj vad du behöver hjälp med – eller låt oss hjälpa dig välja.",
  },
  {
    title: "Rådgivning & offert",
    text: "Vi går igenom dina förutsättningar och tar fram ett förslag med pris och omfattning.",
  },
  {
    title: "Installation",
    text: "När du godkänt offerten planerar vi installationen och går igenom nästa steg.",
  },
  {
    title: "Värme i vardagen",
    text: "Vi hjälper även till när det är dags för service eller om frågor dyker upp.",
  },
];

export function Process() {
  return (
    <section className="process-section section" id="installation">
      <div className="shell">
        <div className="section-heading">
          <div>
            <div className="eyebrow">Från första frågan till värme</div>
            <h2 className="heading-2">Enkelt att komma igång.</h2>
          </div>
          <a href="#offert" className="text-button">
            Ta första steget <Icon name="arrow" />
          </a>
        </div>
        <div className="steps">
          {STEPS.map((step, index) => (
            <article key={step.title}>
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="section faq-section" id="fragor">
      <div className="shell faq-grid">
        <div>
          <div className="eyebrow">Bra att veta</div>
          <h2 className="heading-2">
            Frågor före <br />
            ett varmare hem.
          </h2>
          <p>Det är ett stort beslut. Här är några saker som är bra att ha koll på.</p>
          <a className="text-button" href="#offert">
            Ställ din egen fråga <Icon name="arrow" />
          </a>
        </div>
        <div className="faq-list">
          <details>
            <summary>
              Vad kostar en värmepump med installation?
              <Icon name="plus" />
            </summary>
            <p>
              Priset beror på modell, husets förutsättningar och arbetet som behövs. I din offert ska pump,
              installation och eventuella tillägg framgå tydligt. Vid byte av bergvärmepump behöver vi också
              veta vilken pump du har i dag.
            </p>
          </details>
          <details>
            <summary>
              Vilken typ av värmepump ska jag välja?
              <Icon name="plus" />
            </summary>
            <p>
              Det beror bland annat på nuvarande uppvärmning, husets storlek och om du har vattenburna
              radiatorer eller golvvärme. Välj ”Osäker – hjälp mig välja” i formuläret, så börjar vi där.
            </p>
          </details>
          <details>
            <summary>
              Kan jag använda ROT-avdrag?
              <Icon name="plus" />
            </summary>
            <p>
              Installation av värmepump kan ge rätt till ROT-avdrag på arbetskostnaden om villkoren är
              uppfyllda. Be om ett tydligt pris både före och efter eventuellt avdrag i offerten.{" "}
              <a
                href="https://www.skatteverket.se/foretag/skatterochavdrag/rotochrut/gerarbetetratttillrotavdrag.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Läs aktuella villkor hos Skatteverket ↗
              </a>
            </p>
          </details>
          <details>
            <summary>
              Kan ni jämföra en offert jag redan fått?
              <Icon name="plus" />
            </summary>
            <p>
              Ja. Välj ”Jämför offert” och bifoga gärna en bild eller PDF. För en rättvis jämförelse behöver vi
              se modell, installationsomfattning, villkor och hur ROT-avdraget har räknats.
            </p>
          </details>
          <details>
            <summary>
              Hjälper ni till med service också?
              <Icon name="plus" />
            </summary>
            <p>
              Ja, vi erbjuder även service och reparation. Välj ”Service” i formuläret och berätta gärna vilket
              märke och vilken modell du har, samt vad du behöver hjälp med.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

export function Closing() {
  return (
    <section className="closing">
      <div className="shell closing-inner">
        <div>
          <div className="eyebrow">Ditt hem. Din budget.</div>
          <h2 className="heading-2">Vi hittar rätt värme tillsammans.</h2>
        </div>
        <a className="button button-orange" href="#offert">
          Få en kostnadsfri offert <Icon name="diagonal" />
        </a>
      </div>
    </section>
  );
}
