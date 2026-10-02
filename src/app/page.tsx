import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { BrandReels } from "@/components/sections/BrandReels";
import { CollectionsSection } from "@/components/sections/CollectionsSection";
import { FeaturedWatches } from "@/components/sections/FeaturedWatches";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JournalSection } from "@/components/sections/JournalSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { HeroFilm } from "@/components/sections/hero/HeroFilm";

/**
 * FURKAN SAAT — Homepage
 * Opening film (box → watch → Rolex → Patek Philippe)
 * · 01 Selected watches · 02 Brands · 03 Collections · 04 Trust · 05 Private viewing
 * · 06 Journal · Final CTA · Footer
 */
export default function Home() {
  return (
    <main>
      <HeroFilm />
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
