import { CatalogView } from "@/components/catalog/CatalogView";
import type { Product } from "@/lib/data/types";
import styles from "./CollectionSection.module.css";

/**
 * KOLEKSİYON — every watch in the shop on the home page, with filters. The
 * week's pieces come first, marked in gold. (/koleksiyon leads here.)
 */
export function CollectionSection({ products, weekly }: { products: Product[]; weekly: string[] }) {
  return (
    <section id="koleksiyon" className={styles.section} data-nav-theme="dark" aria-labelledby="koleksiyon-baslik">
      <header className={`container ${styles.head}`}>
        <h2 id="koleksiyon-baslik" className={styles.title}>
          Koleksiyon
        </h2>
        <p className={styles.lede}>Butiğimizdeki saatlerin tamamı: orijinal, faturalı ve garantili.</p>
      </header>
      <CatalogView products={products} marked={weekly} />
    </section>
  );
}
