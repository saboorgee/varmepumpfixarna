import Link from "next/link";
import { Suspense } from "react";
import { retrieveCart } from "@/lib/cart";
import { SITE } from "@/lib/site";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "@/components/ui/mobile-menu";

async function CartCount() {
  let count = 0;
  try {
    const cart = await retrieveCart("id,*items");
    count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  } catch {
    // The header must render even if Medusa is unavailable.
  }
  if (!count) return null;
  return (
    <span className="cart-count" aria-label={`${count} varor`}>
      {count}
    </span>
  );
}

export function SiteHeader() {
  return (
    <>
      <a className="skip" href="#main">
        Hoppa till innehållet
      </a>
      {/* TODO(config): remove this notice once a real payment provider and real products are live. */}
      <div className="test-notice">Testläge – fiktiva produkter, inga riktiga betalningar.</div>
      <div className="utility">
        <div className="shell utility-inner">
          <span>
            <span className="live-dot" />
            Hemma i {SITE.city}
          </span>
          <span>Värmepumpar, installation &amp; service</span>
          <Link href="#kontakt">
            {SITE.legalName} <Icon name="diagonal" />
          </Link>
        </div>
      </div>
      <header className="header">
        <div className="shell header-inner">
          <Logo />
          <MobileMenu
            actions={
              <div className="header-actions">
                <Link className="header-cart" href="/varukorg">
                  <Icon name="bag" />
                  <span className="header-cart-label">Varukorg</span>
                  <Suspense fallback={null}>
                    <CartCount />
                  </Suspense>
                </Link>
                <Link className="button button-dark header-quote" href="/#offert">
                  Få en gratis offert <Icon name="diagonal" />
                </Link>
              </div>
            }
          >
            <Link href="/produkter">Värmepumpar</Link>
            <Link href="/#installation">Så går det till</Link>
            <Link href="/#om-oss">Om oss</Link>
            <Link href="/#fragor">Vanliga frågor</Link>
            <Link className="nav-quote" href="/#offert">
              Få en gratis offert
            </Link>
          </MobileMenu>
        </div>
      </header>
    </>
  );
}
