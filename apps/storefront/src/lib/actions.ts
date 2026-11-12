"use server";

/**
 * Server Actions for cart and checkout. All commerce validation (stock,
 * prices, addresses, shipping eligibility, payment) happens in Medusa; these
 * actions only forward input and surface Medusa's error messages.
 */
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearCartId,
  retrieveCart,
  setCartId,
  setLastOrderId,
} from "./cart";
import { COUNTRY_CODE, errorMessage, getRegion, getSdk } from "./medusa";

export type ActionState = { error?: string; ok?: boolean };

const MANUAL_PAYMENT_PROVIDER = "pp_system_default";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function getOrCreateCartId(): Promise<string> {
  const existing = await retrieveCart("id");
  if (existing) {
    return existing.id;
  }
  const region = await getRegion();
  const { cart } = await getSdk().store.cart.create(
    {
      region_id: region.id,
      // Country is fixed to Sweden so shipping options resolve before checkout.
      shipping_address: { country_code: COUNTRY_CODE },
    },
    { fields: "id" }
  );
  await setCartId(cart.id);
  return cart.id;
}

export async function addToCart(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const variantId = text(formData, "variantId");
  const quantity = Number(text(formData, "quantity") || "1");
  if (!variantId) {
    return { error: "Ingen produktvariant vald." };
  }
  try {
    const cartId = await getOrCreateCartId();
    await getSdk().store.cart.createLineItem(
      cartId,
      { variant_id: variantId, quantity },
      { fields: "id" }
    );
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  return { ok: true };
}

export async function updateLineItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const lineId = text(formData, "lineId");
  const quantity = Number(text(formData, "quantity"));
  try {
    const cart = await retrieveCart("id");
    if (!cart) {
      return { error: "Varukorgen hittades inte." };
    }
    if (quantity <= 0) {
      await getSdk().store.cart.deleteLineItem(cart.id, lineId, { fields: "id" });
    } else {
      await getSdk().store.cart.updateLineItem(
        cart.id,
        lineId,
        { quantity },
        { fields: "id" }
      );
    }
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  return { ok: true };
}

export async function removeLineItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const lineId = text(formData, "lineId");
  try {
    const cart = await retrieveCart("id");
    if (!cart) {
      return { error: "Varukorgen hittades inte." };
    }
    await getSdk().store.cart.deleteLineItem(cart.id, lineId, { fields: "id" });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  refresh();
  return { ok: true };
}

/**
 * Guest checkout in one submit: contact + shipping address → shipping method
 * → manual (test) payment session → complete cart → order.
 */
export async function placeOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sdk = getSdk();
  let orderId: string;

  try {
    const cart = await retrieveCart("id,*items");
    if (!cart || !cart.items?.length) {
      return { error: "Varukorgen är tom." };
    }

    const address = {
      first_name: text(formData, "first_name"),
      last_name: text(formData, "last_name"),
      address_1: text(formData, "address_1"),
      postal_code: text(formData, "postal_code"),
      city: text(formData, "city"),
      phone: text(formData, "phone") || undefined,
      country_code: COUNTRY_CODE,
    };

    await sdk.store.cart.update(
      cart.id,
      {
        email: text(formData, "email"),
        shipping_address: address,
        billing_address: address,
      },
      { fields: "id" }
    );

    const optionId = text(formData, "shipping_option_id");
    if (!optionId) {
      return { error: "Välj ett fraktsätt." };
    }
    await sdk.store.cart.addShippingMethod(
      cart.id,
      { option_id: optionId },
      { fields: "id" }
    );

    if (text(formData, "payment_provider_id") !== MANUAL_PAYMENT_PROVIDER) {
      return { error: "Välj betalningssätt." };
    }
    // Re-read the cart so an existing payment collection is reused.
    const { cart: payableCart } = await sdk.store.cart.retrieve(cart.id, {
      fields: "id,region_id,currency_code,total,*payment_collection",
    });
    await sdk.store.payment.initiatePaymentSession(payableCart, {
      provider_id: MANUAL_PAYMENT_PROVIDER,
    });

    const result = await sdk.store.cart.complete(cart.id, { fields: "id" });
    if (result.type !== "order") {
      return {
        error: `Beställningen kunde inte slutföras: ${result.error?.message ?? "okänt fel"}`,
      };
    }
    orderId = result.order.id;
  } catch (error) {
    return { error: errorMessage(error) };
  }

  await clearCartId();
  await setLastOrderId(orderId);
  // redirect() throws, so it must stay outside the try/catch above.
  redirect(`/order/${orderId}`);
}
