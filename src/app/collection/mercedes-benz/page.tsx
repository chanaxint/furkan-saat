import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { BrandFilmIntro } from "@/components/sections/brand/BrandFilmIntro";
import { ProductCard } from "@/components/sections/collection/ProductCard";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { MERCEDES_WATCHES } from "@/lib/data/mercedes";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Mercedes-Benz Saatleri — Furkan Saat",
  description: "Mercedes-Benz saat koleksiyonu, Furkan Saat İstanbul.",
};

/** Mercedes-Benz brand page: scroll film intro, then the watches. */
export default function MercedesBenzPage() {
  return (
    <main>
      <BrandFilmIntro dir="/assets/video/mercedes" count={240} brand="Mercedes-Benz" title="Mercedes-Benz" accent="Saatleri" />

      <section className={styles.products} data-nav-theme="light" aria-label="Mercedes-Benz saatleri">
        <header className={styles.header}>
          <SectionMarker index="01" label="Koleksiyon" />
          <h2 className={styles.heading}>
            Yoldan <em>bileğe</em>
          </h2>
          <p className={styles.lede}>
            Mercedes-Benz&apos;in tasarım dilini taşıyan saatler. Stok ve fiyat bilgisi için danışmanlarımıza ulaşın.
          </p>
        </header>
        <ul className={styles.grid}>
          {MERCEDES_WATCHES.map((w, i) => (
            <li key={w.id} id={w.id.replace("mercedes-", "")}>
              <ProductCard watch={w} index={i} />
            </li>
          ))}
        </ul>
      </section>

      <Footer />
    </main>
  );
}
