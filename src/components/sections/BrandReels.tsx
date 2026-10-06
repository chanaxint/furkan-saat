import { PinFoot } from "@/components/ui/PinFoot";
import { Reveal } from "@/components/ui/Reveal";
import { BRANDS } from "@/lib/data/brands";
import { BrandTile } from "./BrandTile";
import styles from "./BrandReels.module.css";

/**
 * 01 — FEATURED BRANDS, straight after the opening: four equal tiles side by
 * side, each with the brand's logo (`logo` in lib/data/brands.ts).
 */
export function BrandReels() {
  return (
    <>
      {/*
       * The link target sits in the normal flow: the section itself is sticky,
       * so its on-screen position (what scrolling to it would measure) is where
       * it is pinned, not where it starts.
       */}
      <span id="markalar" className={styles.anchor} aria-hidden />
      <section
        className={styles.section}
        data-nav-theme="light"
        aria-label="Öne çıkan markalar"
      >
        <header className={styles.header}>
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
        <PinFoot />
      </section>
    </>
  );
}
