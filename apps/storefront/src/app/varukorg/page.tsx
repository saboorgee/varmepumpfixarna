import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { retrieveCart } from "@/lib/cart";
import { formatSek } from "@/lib/medusa";
import { LineItemControls } from "@/components/forms";
import { Loading, StoreError } from "@/components/store-ui";

export const metadata: Metadata = { title: "Varukorg" };

async function CartContents() {
  let cart: HttpTypes.StoreCart | null;
  try {
    cart = await retrieveCart();
  } catch (error) {
    return <StoreError error={error} />;
  }

  if (!cart?.items?.length) {
    return (
      <p>
        Varukorgen är tom.{" "}
        <Link href="/" className="text-sky-700 hover:underline">
          Fortsätt handla
        </Link>
      </p>
    );
  }

  const items = [...cart.items].sort((a, b) =>
    String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  );

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <Link
                href={`/produkter/${item.product_handle}`}
                className="font-medium hover:text-sky-700"
              >
                {item.product_title ?? item.title}
              </Link>
              <p className="text-sm text-slate-600">{formatSek(item.unit_price)} / st</p>
            </div>
            <div className="flex items-center gap-6">
              <LineItemControls lineId={item.id} quantity={item.quantity} />
              <p className="w-28 text-right font-medium">{formatSek(item.total)}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <dt>Delsumma</dt>
          <dd>{formatSek(cart.item_total)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>varav moms</dt>
          <dd>{formatSek(cart.item_tax_total)}</dd>
        </div>
        <div className="flex justify-between text-slate-600">
          <dt>Frakt</dt>
          <dd>Beräknas i kassan</dd>
        </div>
      </dl>

      <div className="text-right">
        <Link
          href="/kassa"
          className="inline-block rounded-md bg-sky-700 px-6 py-3 font-medium text-white hover:bg-sky-800"
        >
          Gå till kassan
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Varukorg</h1>
      <Suspense fallback={<Loading label="Hämtar varukorg…" />}>
        <CartContents />
      </Suspense>
    </>
  );
}
