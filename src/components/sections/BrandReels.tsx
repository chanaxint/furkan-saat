import { BRANDS } from "@/lib/data/brands";
import { BrandTile } from "./BrandTile";
import { GenderTiles } from "./GenderTiles";
import styles from "./BrandReels.module.css";

/**
 * FEATURED BRANDS, after the campaign photograph: equal tiles on a belt that
 * drifts slowly and endlessly to the right (two copies of the row, so the
 * first brand follows the last without a seam); it pauses under the pointer.
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
        {/* A belt that never stops: the brands drift slowly to the right, and the first follows the last. */}
        <div className={styles.belt}>
          <ul className={styles.track} style={{ "--n": BRANDS.length } as React.CSSProperties}>
            {[0, 1].map((copy) =>
              BRANDS.map((b) => (
                <li key={`${copy}-${b.slug}`} aria-hidden={copy === 1 || undefined} inert={copy === 1 || undefined}>
                  <BrandTile brand={b} />
                </li>
              )),
            )}
          </ul>
        </div>
        <GenderTiles />
      </section>
    </>
  );
}
