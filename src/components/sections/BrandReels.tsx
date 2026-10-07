import { Reveal } from "@/components/ui/Reveal";
import { BRANDS } from "@/lib/data/brands";
import { BrandRail } from "./BrandRail";
import { BrandTile } from "./BrandTile";
import { GenderTiles } from "./GenderTiles";
import styles from "./BrandReels.module.css";

/**
 * 01 — FEATURED BRANDS, straight after the opening: equal tiles side by side
 * (four in view on desktop), each with the brand's artwork; with more brands
 * than fit, the row slides sideways with arrows (BrandRail).
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
        <BrandRail
          title={
            <h2 className={styles.title}>
              Öne çıkan <em>markalar</em>
            </h2>
          }
        >
          <Reveal as="ul" className={styles.grid} stagger={0.1}>
            {BRANDS.map((b) => (
              <li key={b.slug}>
                <BrandTile brand={b} />
              </li>
            ))}
          </Reveal>
        </BrandRail>
        <GenderTiles />
      </section>
    </>
  );
}
