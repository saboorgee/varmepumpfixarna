/**
 * Cart identifier handling. The Medusa cart id lives only in an HTTP-only
 * cookie; it is read here (Server Components / Actions) and never exposed to
 * client-side JavaScript.
 */
import { cookies } from "next/headers";
import type { HttpTypes } from "@medusajs/types";
import { getSdk, isNotFound } from "./medusa";

const CART_COOKIE = "vpf_cart_id";
const ORDER_COOKIE = "vpf_last_order_id";

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Set COOKIE_SECURE=true when the storefront is served over HTTPS.
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const CART_FIELDS =
  "*items,+items.total,+items.subtotal,*shipping_address,*shipping_methods";

export async function getCartId(): Promise<string | undefined> {
  return (await cookies()).get(CART_COOKIE)?.value;
}

/** Only callable from Server Actions / Route Handlers. */
export async function setCartId(id: string) {
  (await cookies()).set(CART_COOKIE, id, cookieOptions(60 * 60 * 24 * 30));
}

/** Only callable from Server Actions / Route Handlers. */
export async function clearCartId() {
  (await cookies()).delete(CART_COOKIE);
}

/** Only callable from Server Actions. Remembers the order the visitor just placed. */
export async function setLastOrderId(id: string) {
  (await cookies()).set(ORDER_COOKIE, id, cookieOptions(60 * 60 * 24));
}

export async function getLastOrderId(): Promise<string | undefined> {
  return (await cookies()).get(ORDER_COOKIE)?.value;
}

/**
 * Returns the visitor's active cart, or null if there is none (no cookie,
 * cart deleted, or already completed). Stale cookies are replaced the next
 * time a product is added.
 */
export async function retrieveCart(
  fields: string = CART_FIELDS
): Promise<HttpTypes.StoreCart | null> {
  const id = await getCartId();
  if (!id) {
    return null;
  }
  try {
    const { cart } = await getSdk().store.cart.retrieve(id, { fields });
    if (cart.completed_at) {
      return null;
    }
    return cart;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}
