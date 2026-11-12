import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { HttpTypes } from "@medusajs/types";
import { retrieveCart } from "@/lib/cart";
import { formatSek, getSdk } from "@/lib/medusa";
import {
  CheckoutForm,
  type PaymentChoice,
  type ShippingChoice,
} from "@/components/forms";
import { Loading, StoreError } from "@/components/store-ui";

export const metadata: Metadata = { title: "Kassa" };

const PAYMENT_LABELS: Record<string, string> = {
  pp_system_default: "Testbetalning (manuell)",
};

type CheckoutData = {
  cart: HttpTypes.StoreCart | null;
  shippingOptions: ShippingChoice[];
  paymentOptions: PaymentChoice[];
};

async function loadCheckout(): Promise<CheckoutData> {
  const cart = await retrieveCart();
  if (!cart?.items?.length) {
    return { cart: null, shippingOptions: [], paymentOptions: [] };
  }
  const sdk = getSdk();
  const [{ shipping_options }, { payment_providers }] = await Promise.all([
    sdk.store.fulfillment.listCartOptions({ cart_id: cart.id }),
    sdk.store.payment.listPaymentProviders({ region_id: cart.region_id! }),
  ]);
  return {
    cart,
    shippingOptions: shipping_options.map((o) => ({
      id: o.id,
      name: o.name,
      price: formatSek(o.calculated_price?.calculated_amount ?? o.amount),
    })),
    // Only the clearly labelled manual test payment is offered.
    paymentOptions: payment_providers
      .filter((p) => p.id in PAYMENT_LABELS)
      .map((p) => ({ id: p.id, label: PAYMENT_LABELS[p.id] })),
  };
}

async function Checkout() {
  let data: CheckoutData;
  try {
    data = await loadCheckout();
  } catch (error) {
    return <StoreError error={error} />;
  }
  const { cart, shippingOptions, paymentOptions } = data;

  if (!cart?.items?.length) {
    return (
      <p>
        Varukorgen är tom.{" "}
        <Link href="/" className="text-sky-700 hover:underline">
          Till produkterna
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_18rem]">
      <CheckoutForm shippingOptions={shippingOptions} paymentOptions={paymentOptions} />
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Din beställning</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantity} × {item.product_title ?? item.title}
              </span>
              <span>{formatSek(item.total)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-slate-200 pt-3 font-medium">
          <span>Varor</span>
          <span>{formatSek(cart.item_total)}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">Frakt tillkommer enligt valt fraktsätt.</p>
      </aside>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Kassa</h1>
      <Suspense fallback={<Loading label="Förbereder kassan…" />}>
        <Checkout />
      </Suspense>
    </>
  );
}
