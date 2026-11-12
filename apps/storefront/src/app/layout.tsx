import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { retrieveCart } from "@/lib/cart";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Värmepumpfixarna",
    template: "%s | Värmepumpfixarna",
  },
  description: "Värmepumpar för svenska hem – testbutik.",
};

async function CartCount() {
  let count = 0;
  try {
    const cart = await retrieveCart("id,*items");
    count = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  } catch {
    // The header must render even if Medusa is unavailable.
  }
  return <>{count > 0 ? ` (${count})` : ""}</>;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <div className="bg-amber-100 px-4 py-1 text-center text-sm text-amber-900">
          Testbutik – fiktiva produkter, inga riktiga betalningar.
        </div>
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-bold text-sky-800">
              Värmepumpfixarna
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-sky-700">
                Produkter
              </Link>
              <Link href="/varukorg" className="hover:text-sky-700">
                Varukorg
                <Suspense fallback={null}>
                  <CartCount />
                </Suspense>
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          Värmepumpfixarna · Alla priser i SEK inkl. moms
        </footer>
      </body>
    </html>
  );
}
