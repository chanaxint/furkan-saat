import { Footer } from "@/components/layout/Footer";
import { Boutique } from "@/components/sections/Boutique";
import { BrandReels } from "@/components/sections/BrandReels";
import { CollectionsSection } from "@/components/sections/CollectionsSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JournalSection } from "@/components/sections/JournalSection";
import { TrustSection } from "@/components/sections/TrustSection";
import { CampaignHero } from "@/components/sections/home/CampaignHero";
import { Marquee } from "@/components/sections/home/Marquee";
import { ShopRow } from "@/components/sections/home/ShopRow";
import { HeroIntro } from "@/components/sections/intro/HeroIntro";
import { getFeatured, getProductsInCollection } from "@/lib/services/catalog";

/**
 * FURKAN SAAT — Homepage
 * Opening film (plays on the first scroll → "İstediğiniz her saat" → "Furkan Saat"
 * → black-to-green blend) · 01 Featured brands · campaign photograph · name band
 * · Haftanın Saatleri · Yeni Gelenler · 02 Collections · 03 Trust · 04 Private
 * viewing · 05 Journal · Final CTA · Footer
 */
export default async function Home() {
  const [featured, arrivals] = await Promise.all([getFeatured(), getProductsInCollection("yeni-gelenler")]);
  return (
    <main>
      <HeroIntro />
      <BrandReels />
      <CampaignHero />
      <Marquee />
      <ShopRow title="Haftanın Saatleri" products={featured.slice(0, 5)} href="/koleksiyon" />
      <ShopRow
        title="Yeni Gelenler — 2026"
        products={arrivals.slice(0, 4)}
        variant="centred"
        href="/koleksiyonlar/yeni-gelenler"
      />
      <CollectionsSection />
      <TrustSection />
      <Boutique />
      <JournalSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
