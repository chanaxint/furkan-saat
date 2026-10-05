import { Footer } from "@/components/layout/Footer";
import { BrandReels } from "@/components/sections/BrandReels";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { CampaignHero } from "@/components/sections/home/CampaignHero";
import { Marquee } from "@/components/sections/home/Marquee";
import { CollectionSection } from "@/components/sections/home/CollectionSection";
import { ShopRow } from "@/components/sections/home/ShopRow";
import { HeroIntro } from "@/components/sections/intro/HeroIntro";
import { getFeatured, getProducts, getProductsInCollection } from "@/lib/services/catalog";

/**
 * FURKAN SAAT — Homepage
 * Opening film (plays on the first scroll → "İstediğiniz her saat" → "Furkan Saat"
 * → black-to-green blend) · 01 Featured brands · campaign photograph · name band
 * · Yeni Gelenler · the whole collection, with filters · Final CTA · Footer
 */
export default async function Home() {
  const [featured, arrivals, all] = await Promise.all([getFeatured(), getProductsInCollection("yeni-gelenler"), getProducts()]);
  // The week's pieces (the first three marked "featured" in the shop's data) lead the collection.
  const weekly = featured.slice(0, 3);
  const collection = [...weekly, ...all.filter((p) => !weekly.includes(p))];
  return (
    <main>
      <HeroIntro />
      <BrandReels />
      <CampaignHero />
      <Marquee />
      <ShopRow title="Yeni Gelenler" products={arrivals} href="/#koleksiyon" />
      <CollectionSection products={collection} weekly={weekly.map((p) => p.slug)} />
      <FinalCTA />
      <Footer />
    </main>
  );
}
