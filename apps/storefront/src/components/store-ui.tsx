import type { ReactNode } from "react";
import { errorMessage } from "@/lib/medusa";

export function Loading({ label = "Laddar…" }: { label?: string }) {
  return (
    <p className="text-sm text-muted" aria-live="polite">
      {label}
    </p>
  );
}

export function StoreError({ error }: { error: unknown }) {
  return (
    <div role="alert" className="rounded-md border border-danger/30 bg-danger-bg p-4 text-danger">
      <p className="font-semibold">Butiken kunde inte hämta data just nu.</p>
      <p className="mt-1 text-sm">{errorMessage(error)}</p>
    </div>
  );
}

export function ProductImage({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div
        className={`flex aspect-[4/3] items-center justify-center rounded-[7px] bg-cream text-sm text-muted ${className}`}
      >
        Ingen bild
      </div>
    );
  }
  // Images are served by Medusa's file provider at its browser-reachable URL.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`block aspect-[4/3] w-full rounded-[7px] object-cover ${className}`} />;
}

/** Page wrapper for shop and content pages: container, eyebrow and title. */
export function Page({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell page">
      {eyebrow && (
        <div className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </div>
      )}
      <h1 className="page-title">{title}</h1>
      {intro && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{intro}</p>}
      <div className="mt-9">{children}</div>
    </div>
  );
}

/** White card used on cart, checkout and order pages. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[9px] border border-line bg-white p-5 sm:p-6 ${className}`}>{children}</div>;
}
