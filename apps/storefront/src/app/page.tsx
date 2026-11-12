import {
  Brands,
  Closing,
  ComparePanel,
  Faq,
  Hero,
  Local,
  Process,
  Solutions,
} from "@/components/home/sections";
import { MobileAction } from "@/components/home/mobile-action";

// Quote-first homepage (Häglared mockup). Needs no Medusa data, so it renders
// even when the backend is unavailable; products live under /produkter.
export default function Home() {
  return (
    <>
      <Hero />
      <Brands />
      <Solutions />
      <ComparePanel />
      <Local />
      <Process />
      <Faq />
      <Closing />
      <MobileAction />
    </>
  );
}
