import { Footer } from "@/components/layout/Footer";
import { BrandReels } from "@/components/sections/BrandReels";
import { Boutique } from "@/components/sections/Boutique";
import { Collection } from "@/components/sections/collection/Collection";
import { Editorial } from "@/components/sections/Editorial";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Houses } from "@/components/sections/Houses";
import { MostWanted } from "@/components/sections/MostWanted";
import { NewArrival } from "@/components/sections/NewArrival";
import { HeroFilm } from "@/components/sections/hero/HeroFilm";

/**
 * FURKAN SAAT — Homepage
 * One continuous experience, top to bottom:
 *   Hero film (footage + 3D watch: lift-out, turns, copy beats, Rolex → Patek Philippe)
 *   05 New Arrival · 06 Most Wanted · 07 Collection
 *   08 Houses · 09 Editorial · 10 Boutique · 11 Final CTA · 12 Footer
 */
export default function Home() {
  return (
    <main>
      <HeroFilm />
      <BrandReels />
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
