import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { Collection } from "@/components/sections/collection/Collection";
import { Editorial } from "@/components/sections/Editorial";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Houses } from "@/components/sections/Houses";
import { MostWanted } from "@/components/sections/MostWanted";
import { NewArrival } from "@/components/sections/NewArrival";
import { WatchDetails } from "@/components/sections/details/WatchDetails";
import { WatchShowcase } from "@/components/sections/showcase/WatchShowcase";
import { BoxIntro } from "@/components/sections/intro/BoxIntro";

/**
 * FURKAN SAAT — Homepage
 * One continuous experience, top to bottom:
 *   Intro (box opens, watch lifts out, spins away — one GSAP timeline)
 *   Showcase (real GLB, scroll-turned) · Details (macro close-ups)
 *   04 Exploded View · 05 New Arrival · 06 Most Wanted · 07 Collection
 *   08 Houses · 09 Editorial · 10 Boutique · 11 Final CTA · 12 Footer
 */
export default function Home() {
  return (
    <main>
      {/* Intro ends exactly on SHOWCASE_ENTRY_POSE; the Showcase continues from there. */}
      <BoxIntro />
      <WatchShowcase />
      {/* Exploded view is parked (components/sections/ExplodedView) — macro details stand in. */}
      <WatchDetails />
      <NewArrival />
      <MostWanted />
      <Collection />
      <Houses />
      <Editorial />
      <Boutique />
      <FinalCTA />
      <Footer />
    </main>
  );
}
