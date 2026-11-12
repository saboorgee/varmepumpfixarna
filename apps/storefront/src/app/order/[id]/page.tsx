import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { getLastOrderId } from "@/lib/cart";
import { formatSek, getSdk, isNotFound } from "@/lib/medusa";
import { Loading, StoreError } from "@/components/store-ui";

export const metadata: Metadata = { title: "Orderbekräftelse" };

async function Confirmation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Medusa's store API returns any order by id; only show the order that this
  // browser just placed (its id is kept in an HTTP-only cookie).
  if ((await getLastOrderId()) !== id) {
    notFound();
  }

  let order: HttpTypes.StoreOrder;
  try {
    ({ order } = await getSdk().store.order.retrieve(id, {
      fields:
        "id,display_id,email,created_at,currency_code,total,tax_total,item_total,shipping_total,*items,+items.total,*shipping_address,*shipping_methods",
    }));
  } catch (error) {
    if (isNotFound(error)) {
      notFound();
    }
    return <StoreError error={error} />;
  }

  const address = order.shipping_address;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-300 bg-green-50 p-4">
        <h1 className="text-2xl font-bold text-green-900">Tack för din beställning!</h1>
        <p className="mt-1">
          Ordernummer <strong>#{order.display_id}</strong>. En bekräftelse skulle skickas till{" "}
          {order.email} (e-post skickas inte i testmiljön).
        </p>
        <p className="mt-1 text-sm text-amber-900">
          Betalning: Testbetalning (manuell) – inget belopp har debiterats.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Artiklar</h2>
        <ul className="space-y-2 text-sm">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantity} × {item.product_title ?? item.title}
              </span>
              <span>{formatSek(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Varor</dt>
            <dd>{formatSek(order.item_total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Frakt ({order.shipping_methods?.[0]?.name ?? "–"})</dt>
            <dd>{formatSek(order.shipping_total)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Totalt</dt>
            <dd>{formatSek(order.total)}</dd>
          </div>
          <div className="flex justify-between text-slate-600">
            <dt>varav moms</dt>
            <dd>{formatSek(order.tax_total)}</dd>
          </div>
        </dl>
      </section>

      {address && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <h2 className="mb-2 font-semibold">Leveransadress</h2>
          <p>
            {address.first_name} {address.last_name}
            <br />
            {address.address_1}
            <br />
            {address.postal_code} {address.city}
          </p>
        </section>
      )}

      <Link href="/" className="inline-block text-sky-700 hover:underline">
        ← Fortsätt handla
      </Link>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <Suspense fallback={<Loading label="Hämtar order…" />}>
      <Confirmation params={params} />
    </Suspense>
  );
}
