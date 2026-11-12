"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  addToCart,
  placeOrder,
  removeLineItem,
  updateLineItem,
  type ActionState,
} from "@/lib/actions";

const initial: ActionState = {};

const inputClass =
  "h-11 rounded-[4px] border border-[#dce1d7] bg-[#fdfefb] px-3 text-[14px] text-ink outline-offset-2";
const labelClass = "mb-1.5 block text-[11px] font-[650]";
const legendClass = "mb-3 font-heading text-[19px] font-semibold tracking-[-0.4px]";

function ErrorText({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="mt-3 rounded-[4px] bg-danger-bg p-2.5 text-[13px] text-danger">
      {state.error}
    </p>
  );
}

export function AddToCartForm({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState(addToCart, initial);
  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex items-end gap-3">
        <label>
          <span className={labelClass}>Antal</span>
          <input
            type="number"
            name="quantity"
            min={1}
            max={99}
            defaultValue={1}
            className={`${inputClass} h-[52px] w-20`}
          />
        </label>
        <button type="submit" disabled={pending} className="button button-orange flex-1">
          {pending ? "Lägger till…" : "Lägg i varukorg"}
        </button>
      </div>
      {state.ok && !pending && (
        <p role="status" className="mt-3 text-[13px] font-semibold text-olive">
          Produkten har lagts i varukorgen.{" "}
          <Link href="/varukorg" className="underline underline-offset-2">
            Till varukorgen
          </Link>
        </p>
      )}
      <ErrorText state={state} />
    </form>
  );
}

export function LineItemControls({
  lineId,
  quantity,
}: {
  lineId: string;
  quantity: number;
}) {
  const [updateState, update, updating] = useActionState(updateLineItem, initial);
  const [removeState, remove, removing] = useActionState(removeLineItem, initial);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <form action={update} className="flex items-center gap-2">
          <input type="hidden" name="lineId" value={lineId} />
          <label className="sr-only" htmlFor={`qty-${lineId}`}>
            Antal
          </label>
          <input
            id={`qty-${lineId}`}
            type="number"
            name="quantity"
            min={0}
            max={99}
            defaultValue={quantity}
            key={quantity}
            className={`${inputClass} h-10 w-16`}
          />
          <button
            type="submit"
            disabled={updating}
            className="h-10 rounded-[4px] border border-line px-3 text-[12px] font-[650] hover:bg-mist disabled:opacity-60"
          >
            {updating ? "Uppdaterar…" : "Uppdatera"}
          </button>
        </form>
        <form action={remove}>
          <input type="hidden" name="lineId" value={lineId} />
          <button
            type="submit"
            disabled={removing}
            className="h-10 rounded-[4px] px-3 text-[12px] font-[650] text-danger hover:bg-danger-bg disabled:opacity-60"
          >
            {removing ? "Tar bort…" : "Ta bort"}
          </button>
        </form>
      </div>
      <ErrorText state={updateState.error ? updateState : removeState} />
    </div>
  );
}

export type ShippingChoice = { id: string; name: string; price: string };
export type PaymentChoice = { id: string; label: string };

function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required = true,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>
        {label}
        {!required && <span className="font-normal text-muted"> (valfritt)</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className={`${inputClass} w-full`}
      />
    </label>
  );
}

export function CheckoutForm({
  shippingOptions,
  paymentOptions,
}: {
  shippingOptions: ShippingChoice[];
  paymentOptions: PaymentChoice[];
}) {
  const [state, action, pending] = useActionState(placeOrder, initial);
  return (
    <form action={action} className="space-y-9">
      <fieldset className="space-y-4">
        <legend className={legendClass}>Kontaktuppgifter</legend>
        <Field name="email" label="E-post" type="email" autoComplete="email" />
        <Field name="phone" label="Telefon" type="tel" autoComplete="tel" required={false} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className={legendClass}>Leveransadress</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="first_name" label="Förnamn" autoComplete="given-name" />
          <Field name="last_name" label="Efternamn" autoComplete="family-name" />
        </div>
        <Field name="address_1" label="Gatuadress" autoComplete="address-line1" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="postal_code" label="Postnummer" autoComplete="postal-code" />
          <Field name="city" label="Ort" autoComplete="address-level2" />
        </div>
        <p className="text-[13px] text-muted">Land: Sverige</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={legendClass}>Fraktsätt</legend>
        {shippingOptions.length === 0 && (
          <p className="text-[13px] text-danger">Inga fraktsätt finns tillgängliga just nu.</p>
        )}
        {shippingOptions.map((option, index) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center justify-between rounded-[5px] border border-line bg-white px-4 py-3.5 text-[14px] has-[:checked]:border-ink"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping_option_id"
                value={option.id}
                defaultChecked={index === 0}
                required
                className="accent-ink"
              />
              {option.name}
            </span>
            <span className="font-semibold">{option.price}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={legendClass}>Betalning</legend>
        {paymentOptions.map((option, index) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-start gap-3 rounded-[5px] border border-[#cfd79a] bg-[#f4f6dc] px-4 py-3.5 text-[14px]"
          >
            <input
              type="radio"
              name="payment_provider_id"
              value={option.id}
              defaultChecked={index === 0}
              required
              className="mt-1 accent-ink"
            />
            <span>
              <span className="font-semibold">{option.label}</span>
              {/* TODO(config): replace the manual test payment with a real provider (e.g. Klarna/Stripe/Swish) in Medusa. */}
              <span className="block text-[12px] text-muted">
                TESTLÄGE: Ingen riktig betalning genomförs och inget belopp debiteras. Beställningen
                registreras med en manuell betalning.
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <ErrorText state={state} />
      <button
        type="submit"
        disabled={pending || shippingOptions.length === 0 || paymentOptions.length === 0}
        className="button button-dark w-full"
      >
        {pending ? "Skickar beställning…" : "Slutför beställning (testbetalning)"}
      </button>
    </form>
  );
}
