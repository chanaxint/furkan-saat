import { Footer } from "@/components/layout/Footer";
import { BrandReels } from "@/components/sections/BrandReels";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { JournalSection } from "@/components/sections/JournalSection";
import { CampaignHero } from "@/components/sections/home/CampaignHero";
import { Marquee } from "@/components/sections/home/Marquee";
import { ShopRow } from "@/components/sections/home/ShopRow";
import { HeroIntro } from "@/components/sections/intro/HeroIntro";
import { getFeatured, getProducts, getProductsInCollection } from "@/lib/services/catalog";

/**
 * FURKAN SAAT — Homepage
 * Opening film (plays on the first scroll → "İstediğiniz her saat" → "Furkan Saat"
 * → black-to-green blend) · 01 Featured brands · campaign photograph · name band
 * · Haftanın Saatleri · Yeni Gelenler · Journal · Final CTA · Footer
 */
export default async function Home() {
  const [featured, arrivals, all] = await Promise.all([getFeatured(), getProductsInCollection("yeni-gelenler"), getProducts()]);
  // The week's pieces first, then more of the shop to scroll on to.
  const weekly = [...featured, ...all.filter((p) => !p.featured)].slice(0, 15);
  return (
    <main>
      <HeroIntro />
      <BrandReels />
      <CampaignHero />
      <Marquee />
      <ShopRow title="Haftanın Saatleri" products={weekly} href="/koleksiyon" />
      <ShopRow
        title="Yeni Gelenler — 2026"
        products={arrivals.slice(0, 4)}
        variant="centred"
        href="/koleksiyonlar/yeni-gelenler"
      />
      <JournalSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
