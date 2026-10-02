import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { BrandReels } from "@/components/sections/BrandReels";
import { CollectionsSection } from "@/components/sections/CollectionsSection";
import { FeaturedWatches } from "@/components/sections/FeaturedWatches";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JournalSection } from "@/components/sections/JournalSection";
import { NewArrival } from "@/components/sections/NewArrival";
import { TrustSection } from "@/components/sections/TrustSection";
import { HeroFilm } from "@/components/sections/hero/HeroFilm";

/**
 * FURKAN SAAT — Homepage
 * Opening film (box → watch → Rolex → Patek Philippe) · 01 New arrival (box film)
 * · 02 Selected watches · 03 Brands · 04 Collections · 05 Trust · 06 Private viewing
 * · 07 Journal · Final CTA · Footer
 */
export default function Home() {
  return (
    <main>
      <HeroFilm />
      <NewArrival />
      <FeaturedWatches />
      <BrandReels />
      <CollectionsSection />
      <TrustSection />
      <Boutique />
      <JournalSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
