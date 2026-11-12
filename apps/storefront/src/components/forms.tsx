"use client";

import { useActionState } from "react";
import {
  addToCart,
  placeOrder,
  removeLineItem,
  updateLineItem,
  type ActionState,
} from "@/lib/actions";

const initial: ActionState = {};

function ErrorText({ state }: { state: ActionState }) {
  if (!state.error) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-red-700">
      {state.error}
    </p>
  );
}

const buttonClass =
  "rounded-md bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:cursor-wait disabled:opacity-60";

export function AddToCartForm({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState(addToCart, initial);
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Antal</span>
          <input
            type="number"
            name="quantity"
            min={1}
            max={99}
            defaultValue={1}
            className="w-20 rounded-md border border-slate-300 px-2 py-2"
          />
        </label>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Lägger till…" : "Lägg i varukorg"}
        </button>
      </div>
      {state.ok && !pending && (
        <p role="status" className="mt-2 text-sm text-green-700">
          Produkten har lagts i varukorgen.
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
            className="w-16 rounded-md border border-slate-300 px-2 py-1"
          />
          <button
            type="submit"
            disabled={updating}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
          >
            {updating ? "Uppdaterar…" : "Uppdatera"}
          </button>
        </form>
        <form action={remove}>
          <input type="hidden" name="lineId" value={lineId} />
          <button
            type="submit"
            disabled={removing}
            className="rounded-md px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
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
    <label className="block text-sm">
      <span className="mb-1 block text-slate-700">
        {label}
        {!required && <span className="text-slate-500"> (valfritt)</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-slate-300 px-3 py-2"
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
    <form action={action} className="space-y-8">
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">Kontaktuppgifter</legend>
        <Field name="email" label="E-post" type="email" autoComplete="email" />
        <Field name="phone" label="Telefon" type="tel" autoComplete="tel" required={false} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-semibold">Leveransadress</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="first_name" label="Förnamn" autoComplete="given-name" />
          <Field name="last_name" label="Efternamn" autoComplete="family-name" />
        </div>
        <Field name="address_1" label="Gatuadress" autoComplete="address-line1" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="postal_code" label="Postnummer" autoComplete="postal-code" />
          <Field name="city" label="Ort" autoComplete="address-level2" />
        </div>
        <p className="text-sm text-slate-600">Land: Sverige</p>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-lg font-semibold">Fraktsätt</legend>
        {shippingOptions.length === 0 && (
          <p className="text-sm text-red-700">
            Inga fraktsätt finns tillgängliga. Kontrollera att seed-kommandot har körts.
          </p>
        )}
        {shippingOptions.map((option, index) => (
          <label
            key={option.id}
            className="flex items-center justify-between rounded-md border border-slate-300 px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="shipping_option_id"
                value={option.id}
                defaultChecked={index === 0}
                required
              />
              {option.name}
            </span>
            <span>{option.price}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-lg font-semibold">Betalning</legend>
        {paymentOptions.map((option, index) => (
          <label
            key={option.id}
            className="flex items-start gap-3 rounded-md border border-amber-400 bg-amber-50 px-4 py-3"
          >
            <input
              type="radio"
              name="payment_provider_id"
              value={option.id}
              defaultChecked={index === 0}
              required
              className="mt-1"
            />
            <span>
              <span className="font-medium">{option.label}</span>
              <span className="block text-sm text-amber-900">
                TESTLÄGE: Ingen riktig betalning genomförs och inget belopp debiteras.
                Beställningen registreras i Medusa med en manuell betalning.
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <ErrorText state={state} />
      <button
        type="submit"
        disabled={pending || shippingOptions.length === 0 || paymentOptions.length === 0}
        className={`${buttonClass} w-full py-3 text-lg`}
      >
        {pending ? "Skickar beställning…" : "Slutför beställning (testbetalning)"}
      </button>
    </form>
  );
}
