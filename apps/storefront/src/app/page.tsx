import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import type { HttpTypes } from "@medusajs/types";
import { formatSek, getRegion, getSdk } from "@/lib/medusa";
import { Loading, ProductImage, StoreError } from "@/components/store-ui";

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
    return <p>Inga produkter hittades. Kör seed-kommandot (se README).</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const price = lowestPrice(product);
        return (
          <li key={product.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Link href={`/produkter/${product.handle}`} className="group block">
              <ProductImage src={product.thumbnail} alt={product.title} />
              <h2 className="mt-4 text-lg font-semibold group-hover:text-sky-700">{product.title}</h2>
              {product.subtitle && <p className="text-sm text-slate-600">{product.subtitle}</p>}
              <p className="mt-2 font-medium">
                {price !== undefined ? formatSek(price) : "Pris saknas"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Värmepumpar</h1>
      <Suspense fallback={<Loading label="Hämtar produkter…" />}>
        <ProductList />
      </Suspense>
    </>
  );
}
