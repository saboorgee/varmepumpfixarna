import Link from "next/link";
import { SITE } from "@/lib/site";
import { BrandMark } from "./icons";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link className={`brand ${className}`} href="/" aria-label={`${SITE.brand} ${SITE.byline}, startsida`}>
      <span className="brand-mark">
        <BrandMark />
      </span>
      <span>
        <strong>{SITE.brand.toUpperCase()}</strong>
        <span className="brand-byline">{SITE.byline}</span>
      </span>
    </Link>
  );
}
