import { Footer } from "@/components/layout/Footer";
import { BrandReels } from "@/components/sections/BrandReels";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { CampaignHero } from "@/components/sections/home/CampaignHero";
import { Marquee } from "@/components/sections/home/Marquee";
import { CollectionSection } from "@/components/sections/home/CollectionSection";
import { ShopRow } from "@/components/sections/home/ShopRow";
import { HeroIntro } from "@/components/sections/intro/HeroIntro";
import styles from "./page.module.css";
import { getFeatured, getProducts, getProductsInCollection } from "@/lib/services/products";

/**
 * FURKAN SAAT — Homepage
 * Opening film (plays on the first scroll → "İstediğiniz her saat" → "Furkan Saat")
 * · campaign photograph, rising over it · featured brands · name band
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
      {/* Everything after the opening is one layer: it rises over the opening's last screen, which holds still beneath it. */}
      <div className={styles.layer}>
        <CampaignHero />
        <BrandReels />
        <Marquee />
        <ShopRow title="Yeni Gelenler" products={arrivals.slice(0, 4)} variant="centred" href="/#koleksiyon" />
        <CollectionSection products={collection} weekly={weekly.map((p) => p.slug)} />
        <FinalCTA />
        <Footer />
      </div>
    </main>
  );
}
