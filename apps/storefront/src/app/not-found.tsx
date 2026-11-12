import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="shell page">
      <div className="eyebrow">
        <span className="eyebrow-line" />
        404
      </div>
      <h1 className="page-title">Sidan hittades inte</h1>
      <p className="mt-3 text-[15px] text-muted">Länken kan vara gammal, eller så har sidan flyttats.</p>
      <div className="mt-6 flex flex-wrap gap-6">
        <Link href="/" className="text-button">
          Till startsidan <Icon name="arrow" />
        </Link>
        <Link href="/produkter" className="text-button">
          Se våra värmepumpar <Icon name="arrow" />
        </Link>
      </div>
    </div>
  );
}
