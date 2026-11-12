"use client";

import { useState, type ReactNode } from "react";

/**
 * Navigation + hamburger toggle (the nav collapses below 880 px, as in the
 * mockup). `actions` (cart, quote button) render between nav and toggle.
 */
export function MobileMenu({ children, actions }: { children: ReactNode; actions: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav
        id="navigation"
        className={`navigation${open ? " open" : ""}`}
        aria-label="Huvudmeny"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        {children}
      </nav>
      {actions}
      <button
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="navigation"
        aria-label={open ? "Stäng meny" : "Öppna meny"}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
    </>
  );
}
