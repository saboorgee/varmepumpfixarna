import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import type { HttpTypes } from "@medusajs/types";
import { formatSek, getRegion, getSdk } from "@/lib/medusa";
import { Icon } from "@/components/ui/icons";
import { IntentLink } from "@/components/ui/intent-link";
import { Loading, Page, ProductImage, StoreError } from "@/components/store-ui";

export const metadata: Metadata = {
  title: "Värmepumpar",
  description: "Värmepumpar med pris – köp direkt eller be om en offert med installation.",
};

function lowestPrice(product: HttpTypes.StoreProduct): number | undefined {
  const amounts = (product.variants ?? [])
    .map((v) => v.calculated_price?.calculated_amount)
    .filter((a): a is number => typeof a === "number");
  return amounts.length ? Math.min(...amounts) : undefined;
}

async function ProductList() {
  await connection();
  let products: HttpTypes.StoreProduct[];
  try {
    const region = await getRegion();
    // TODO(config): filter by Medusa product category (Luft/luft, Luft/vatten, Bergvärme)
    // once the categories exist; the homepage cards will then link here with ?kategori=.
    ({ products } = await getSdk().store.product.list({
      region_id: region.id,
      fields: "id,title,subtitle,handle,thumbnail,*variants.calculated_price",
      limit: 50,
      order: "title",
    }));
  } catch (error) {
    return <StoreError error={error} />;
  }

  if (!products.length) {
    return <p className="text-muted">Inga produkter hittades just nu.</p>;
  }

  return (
    <ul className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const price = lowestPrice(product);
        return (
          <li
            key={product.id}
            className="flex flex-col overflow-hidden rounded-[7px] border border-line bg-white transition hover:-translate-y-1 hover:shadow-[0_12px_25px_#213a2b0b]"
          >
            <Link href={`/produkter/${product.handle}`} className="group flex flex-1 flex-col">
              <ProductImage src={product.thumbnail} alt={product.title} className="rounded-none" />
              <div className="flex flex-1 flex-col px-[23px] pt-[23px]">
                <h2 className="font-heading text-[22px] font-semibold tracking-[-0.8px] group-hover:text-copper">
                  {product.title}
                </h2>
                {product.subtitle && <p className="mt-1 text-[13px] leading-relaxed text-muted">{product.subtitle}</p>}
                <p className="mt-auto pt-4 font-heading text-[24px] font-semibold tracking-[-0.6px]">
                  {price !== undefined ? formatSek(price) : "Pris saknas"}
                </p>
                <p className="pb-4 text-[11px] text-muted">inkl. moms, exkl. installation</p>
              </div>
            </Link>
            <div className="mx-[23px] flex min-h-[57px] items-center justify-between border-t border-[#e6e9df] text-[11px] font-[650]">
              <Link href={`/produkter/${product.handle}`} className="hover:text-copper">
                Läs mer &amp; köp
              </Link>
              <Link
                href={`/?produkt=${encodeURIComponent(product.title)}#offert`}
                className="inline-flex items-center gap-2 hover:text-copper"
              >
                Offert med installation <Icon name="diagonal" className="!h-4 !w-4" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProductsPage() {
  return (
    <Page
      eyebrow="Våra värmepumpar"
      title="Värmepumpar"
      intro="Köp direkt i butiken – eller låt oss ge dig ett fast pris med installation. Osäker på vad som passar? Vi hjälper dig välja."
    >
      <Suspense fallback={<Loading label="Hämtar produkter…" />}>
        <ProductList />
      </Suspense>
      <div className="service-strip">
        <span className="service-symbol" aria-hidden="true">
          ↗
        </span>
        <p>
          <strong>Vill du ha hjälp att välja?</strong> Berätta om ditt hus, så föreslår vi rätt pump och pris med
          installation.
        </p>
        <IntentLink intent="pump" className="text-button">
          Få en kostnadsfri offert <Icon name="arrow" />
        </IntentLink>
      </div>
    </Page>
  );
}
