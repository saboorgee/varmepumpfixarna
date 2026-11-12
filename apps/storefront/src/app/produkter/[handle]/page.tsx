import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { formatSek, getRegion, getSdk } from "@/lib/medusa";
import { AddToCartForm } from "@/components/forms";
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
    <article className="grid gap-8 md:grid-cols-2">
      <ProductImage src={product.images?.[0]?.url ?? product.thumbnail} alt={product.title} />
      <div>
        <h1 className="text-3xl font-bold">{product.title}</h1>
        {product.subtitle && <p className="mt-1 text-slate-600">{product.subtitle}</p>}
        <p className="mt-4 text-2xl font-semibold">
          {typeof price === "number" ? formatSek(price) : "Pris saknas"}
        </p>
        <p className="text-sm text-slate-500">inkl. moms</p>
        {product.description && <p className="mt-6 leading-relaxed">{product.description}</p>}
        {variant ? (
          <AddToCartForm variantId={variant.id} />
        ) : (
          <p className="mt-6 text-red-700">Produkten kan inte köpas just nu.</p>
        )}
      </div>
    </article>
  );
}

export default function ProductPage({ params }: PageProps<"/produkter/[handle]">) {
  return (
    <>
      <Link href="/" className="mb-6 inline-block text-sm text-sky-700 hover:underline">
        ← Alla produkter
      </Link>
      <Suspense fallback={<Loading label="Hämtar produkt…" />}>
        <ProductDetails params={params} />
      </Suspense>
    </>
  );
}
