import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { SITE } from "@/lib/site";
import "./globals.css";

// Self-hosted at build time by next/font: browsers make no requests to Google.
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: `${SITE.brand} – värmepumpar med installation i ${SITE.serviceArea}`,
    template: `%s | ${SITE.brand}`,
  },
  description:
    "Luft/luft och luft/vatten med installation, byte av bergvärmepump och service i Borås och omnejd. Få en kostnadsfri offert – eller låt oss jämföra en offert du redan fått.",
  applicationName: SITE.brand,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" className={`${manrope.variable} ${dmSans.variable}`}>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
