import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { BRANDS } from "@/lib/data/brands";
import { BrandTile } from "./BrandTile";
import styles from "./BrandReels.module.css";

/**
 * 01 — FEATURED BRANDS, straight after the opening: four equal tiles side by
 * side. Each takes a short clip (`reel` in lib/data/brands.ts) that plays on
 * hover; until a clip is added the tile shows the brand's photograph.
 */
export function BrandReels() {
  return (
    <section className={styles.section} id="markalar" data-nav-theme="dark" aria-label="Öne çıkan markalar">
      <header className={styles.header}>
        <SectionMarker index="01" label="Markalar" className={styles.marker} />
        <h2 className={styles.title}>
          Öne çıkan <em>markalar</em>
        </h2>
      </header>
      <Reveal as="ul" className={styles.grid} stagger={0.1}>
        {BRANDS.map((b) => (
          <li key={b.slug}>
            <BrandTile brand={b} />
          </li>
        ))}
      </Reveal>
    </section>
  );
}
