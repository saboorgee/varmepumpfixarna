import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { retrieveCart } from "@/lib/cart";
import { formatSek } from "@/lib/medusa";
import { LineItemControls } from "@/components/forms";
import { Icon } from "@/components/ui/icons";
import { Card, Loading, Page, StoreError } from "@/components/store-ui";

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
      <Card>
        <p className="text-[15px]">Varukorgen är tom.</p>
        <Link href="/produkter" className="text-button mt-2">
          Se våra värmepumpar <Icon name="arrow" />
        </Link>
      </Card>
    );
  }

  const items = [...cart.items].sort((a, b) =>
    String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="divide-y divide-line rounded-[9px] border border-line bg-white">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <Link
                href={`/produkter/${item.product_handle}`}
                className="font-heading text-[17px] font-semibold tracking-[-0.3px] hover:text-copper"
              >
                {item.product_title ?? item.title}
              </Link>
              <p className="text-[13px] text-muted">{formatSek(item.unit_price)} / st</p>
            </div>
            <div className="flex items-center gap-6">
              <LineItemControls lineId={item.id} quantity={item.quantity} />
              <p className="w-28 text-right font-semibold">{formatSek(item.total)}</p>
            </div>
          </li>
        ))}
      </ul>

      <Card>
        <dl className="space-y-2 text-[14px]">
          <div className="flex justify-between font-semibold">
            <dt>Delsumma</dt>
            <dd>{formatSek(cart.item_total)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>varav moms</dt>
            <dd>{formatSek(cart.item_tax_total)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Frakt</dt>
            <dd>Beräknas i kassan</dd>
          </div>
        </dl>
        <Link href="/kassa" className="button button-dark mt-5 w-full justify-between">
          Gå till kassan <Icon name="arrow" />
        </Link>
      </Card>
    </div>
  );
}

export default function CartPage() {
  return (
    <Page eyebrow="Din beställning" title="Varukorg">
      <Suspense fallback={<Loading label="Hämtar varukorg…" />}>
        <CartContents />
      </Suspense>
    </Page>
  );
}
