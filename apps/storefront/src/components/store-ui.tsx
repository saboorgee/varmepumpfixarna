import { errorMessage } from "@/lib/medusa";

export function Loading({ label = "Laddar…" }: { label?: string }) {
  return (
    <p className="text-slate-500" aria-live="polite">
      {label}
    </p>
  );
}

export function StoreError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
      <p className="font-semibold">Butiken kunde inte hämta data från Medusa.</p>
      <p className="mt-1 text-sm">{errorMessage(error)}</p>
    </div>
  );
}

export function ProductImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-200 text-slate-500">
        Ingen bild
      </div>
    );
  }
  // Images are served by Medusa's file provider at its browser-reachable URL.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-lg object-cover" />;
}
