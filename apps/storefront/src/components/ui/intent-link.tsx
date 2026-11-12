"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { quoteHref, type QuoteIntent, type QuoteKind } from "@/lib/site";

export const QUOTE_INTENT_EVENT = "vpf:quote-intent";

export type QuoteIntentDetail = { intent: QuoteIntent; kind?: QuoteKind };

/**
 * Opens the quote form with a tab / product type preselected.
 * On the homepage (where the form exists) it updates the form in place and
 * scrolls to it; elsewhere it navigates to `/?flik=…&typ=…#offert`.
 */
export function IntentLink({
  intent,
  kind,
  className,
  children,
}: {
  intent: QuoteIntent;
  kind?: QuoteKind;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={quoteHref({ intent, kind })}
      className={className}
      onClick={(event) => {
        const form = document.getElementById("offert");
        if (!form) return;
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent<QuoteIntentDetail>(QUOTE_INTENT_EVENT, { detail: { intent, kind } })
        );
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }}
    >
      {children}
    </Link>
  );
}
