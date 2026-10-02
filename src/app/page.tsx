import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { BrandReels } from "@/components/sections/BrandReels";
import { FeaturedWatches } from "@/components/sections/FeaturedWatches";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { NewArrival } from "@/components/sections/NewArrival";
import { TrustSection } from "@/components/sections/TrustSection";
import { HeroFilm } from "@/components/sections/hero/HeroFilm";

/**
 * FURKAN SAAT — Homepage
 * Opening film (box → watch → Rolex → Patek Philippe) · 01 New arrival (box film)
 * · 02 Selected watches · 03 Brands · 04 Trust · 05 Private viewing · Final CTA · Footer
 */
export default function Home() {
  return (
    <main>
      <HeroFilm />
      <NewArrival />
      <FeaturedWatches />
      <BrandReels />
      <TrustSection />
      <Boutique />
      <FinalCTA />
      <Footer />
    </main>
  );
}
