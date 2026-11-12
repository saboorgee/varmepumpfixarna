import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Sidan hittades inte</h1>
      <Link href="/" className="text-sky-700 hover:underline">
        Till startsidan
      </Link>
    </div>
  );
}
