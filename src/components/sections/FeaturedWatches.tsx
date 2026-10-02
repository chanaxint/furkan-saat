import { ProductGrid } from "@/components/product/ProductGrid";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { getFeatured } from "@/lib/services/catalog";
import styles from "./FeaturedWatches.module.css";

/** 01 — THE COLLECTION. A short selection after the opening, never the whole shop. */
export async function FeaturedWatches() {
  const products = (await getFeatured()).slice(0, 6);
  return (
    <section className={styles.section} id="koleksiyon" data-nav-theme="light" aria-label="Koleksiyon">
      <header className={`container ${styles.header}`}>
        <SectionMarker index="01" label="Koleksiyon" />
        <SplitText text={"Seçilmiş\n*saatler*"} className={`t-display ${styles.heading}`} />
        <p className={`t-lead ${styles.lede}`}>
          Her biri orijinalliği doğrulanmış, atölyemizde incelenmiş ve belgeleriyle teslim edilen saatler.
        </p>
      </header>
      <div className="container">
        <ProductGrid products={products} />
        <div className={styles.footer}>
          <ArrowLink href="/koleksiyon" variant="frame">
            Koleksiyonu keşfedin
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
