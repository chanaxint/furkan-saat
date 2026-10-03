import { CollectionList } from "@/components/content/CollectionList";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { getCollections, getProducts } from "@/lib/services/catalog";
import styles from "./CollectionsSection.module.css";

/** 03 — CURATED COLLECTIONS. The catalogue by character rather than by brand. */
export async function CollectionsSection() {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  const shown = collections.filter((c) => products.some((p) => p.collections.includes(c.slug))).slice(0, 5);
  return (
    <section className={styles.section} data-nav-theme="light" aria-label="Koleksiyonlar">
      <div className="container">
        <header className={styles.header}>
          <SectionMarker index="02" label="Koleksiyonlar" />
          <SplitText text={"Karakterine göre\n*seçilmiş*"} className={`t-display ${styles.heading}`} />
        </header>
        <CollectionList collections={shown} products={products} />
        <div className={styles.footer}>
          <ArrowLink href="/koleksiyonlar">Tüm koleksiyonlar</ArrowLink>
        </div>
      </div>
    </section>
  );
}
