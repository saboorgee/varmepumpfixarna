import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { getLastOrderId } from "@/lib/cart";
import { formatSek, getSdk, isNotFound } from "@/lib/medusa";
import { Icon } from "@/components/ui/icons";
import { Card, Loading, StoreError } from "@/components/store-ui";

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
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="text-center">
        <span className="result-icon">
          <Icon name="check" />
        </span>
        <h1 className="page-title">Tack för din beställning!</h1>
        <p className="mt-3 text-[15px] text-muted">
          Ordernummer <strong className="text-ink">#{order.display_id}</strong>. En bekräftelse skulle skickas
          till {order.email} (e-post skickas inte i testmiljön).
        </p>
        {/* TODO(config): send order confirmation emails (Medusa notification provider) once email is set up. */}
        <p className="mx-auto mt-3 inline-block rounded-[4px] bg-[#f4f6dc] px-3 py-1.5 text-[12px] font-semibold">
          Betalning: Testbetalning (manuell) – inget belopp har debiterats.
        </p>
      </div>

      <Card>
        <h2 className="mb-3 font-heading text-[19px] font-semibold tracking-[-0.4px]">Artiklar</h2>
        <ul className="space-y-2 text-[14px]">
          {order.items?.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantity} × {item.product_title ?? item.title}
              </span>
              <span>{formatSek(item.total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-[14px]">
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
          <div className="flex justify-between text-muted">
            <dt>varav moms</dt>
            <dd>{formatSek(order.tax_total)}</dd>
          </div>
        </dl>
      </Card>

      {address && (
        <Card className="text-[14px]">
          <h2 className="mb-2 font-heading text-[19px] font-semibold tracking-[-0.4px]">Leveransadress</h2>
          <p className="leading-relaxed">
            {address.first_name} {address.last_name}
            <br />
            {address.address_1}
            <br />
            {address.postal_code} {address.city}
          </p>
        </Card>
      )}

      <Link href="/produkter" className="text-button">
        ← Fortsätt handla
      </Link>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <div className="shell page">
      <Suspense fallback={<Loading label="Hämtar order…" />}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}
