import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { formatSek, getRegion, getSdk } from "@/lib/medusa";
import { quoteHref } from "@/lib/site";
import { AddToCartForm } from "@/components/forms";
import { Icon } from "@/components/ui/icons";
import { Loading, ProductImage, StoreError } from "@/components/store-ui";

async function ProductDetails({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let product: HttpTypes.StoreProduct | undefined;
  try {
    const region = await getRegion();
    const { products } = await getSdk().store.product.list({
      handle,
      region_id: region.id,
      fields: "id,title,subtitle,description,handle,thumbnail,*images,*variants.calculated_price",
      limit: 1,
    });
    product = products[0];
  } catch (error) {
    return <StoreError error={error} />;
  }
  if (!product) {
    notFound();
  }

  const variant = product.variants?.[0];
  const price = variant?.calculated_price?.calculated_amount;

  return (
    <article className="grid items-start gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      <div className="overflow-hidden rounded-[9px] border border-line bg-white">
        <ProductImage src={product.images?.[0]?.url ?? product.thumbnail} alt={product.title} className="rounded-none" />
      </div>
      <div>
        <div className="eyebrow">
          <span className="eyebrow-line" />
          Värmepump
        </div>
        <h1 className="page-title">{product.title}</h1>
        {product.subtitle && <p className="mt-2 text-[15px] text-muted">{product.subtitle}</p>}

        <div className="mt-6 rounded-[9px] border border-line bg-white p-6">
          <p className="font-heading text-[34px] font-semibold tracking-[-1.2px]">
            {typeof price === "number" ? formatSek(price) : "Pris saknas"}
          </p>
          <p className="text-[12px] text-muted">inkl. moms · exkl. installation</p>
          {variant ? (
            <AddToCartForm variantId={variant.id} />
          ) : (
            <p className="mt-6 text-danger">Produkten kan inte köpas just nu.</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-[9px] border border-line p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#d2dac6] text-[20px]">
            ↗
          </span>
          <p className="flex-1 text-[13px] text-muted">
            <strong className="font-semibold text-ink">Vill du ha den installerad?</strong> Vi ger dig ett fast pris
            med installation.
          </p>
          <Link
            href={quoteHref({ product: product.title })}
            className="inline-flex shrink-0 items-center gap-3 text-[12px] font-[650] hover:text-copper"
          >
            Begär offert <Icon name="diagonal" className="!h-[18px] !w-[18px]" />
          </Link>
        </div>

        {product.description && (
          <div className="mt-8 border-t border-line pt-6">
            <h2 className="font-heading text-[18px] font-semibold tracking-[-0.4px]">Om produkten</h2>
            <p className="mt-3 text-[14px] leading-[1.8] text-muted">{product.description}</p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ProductPage({ params }: PageProps<"/produkter/[handle]">) {
  return (
    <div className="shell page">
      <Link href="/produkter" className="text-button mb-6">
        ← Alla värmepumpar
      </Link>
      <Suspense fallback={<Loading label="Hämtar produkt…" />}>
        <ProductDetails params={params} />
      </Suspense>
    </div>
  );
}
