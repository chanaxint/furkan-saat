import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { Collection } from "@/components/sections/collection/Collection";
import { Editorial } from "@/components/sections/Editorial";
import { ExplodedView } from "@/components/sections/ExplodedView";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Houses } from "@/components/sections/Houses";
import { MostWanted } from "@/components/sections/MostWanted";
import { NewArrival } from "@/components/sections/NewArrival";
import { WatchStory } from "@/components/sections/story/WatchStory";

/**
 * FURKAN SAAT — Homepage
 * One continuous experience, top to bottom:
 *   01 Opening · 02 Reveal · 03 Features  (one sticky 3D stage)
 *   04 Exploded View · 05 New Arrival · 06 Most Wanted · 07 Collection
 *   08 Houses · 09 Editorial · 10 Boutique · 11 Final CTA · 12 Footer
 */
export default function Home() {
  return (
    <main>
      <WatchStory />
      <ExplodedView />
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
