import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { BRANDS } from "@/lib/data/brands";
import styles from "./BrandReels.module.css";

/**
 * BRANDS — one equal tile per house: a photograph of one of its watches and
 * the name beneath. Hovering eases the photograph closer; a click opens the brand.
 */
export function BrandReels() {
  return (
    <section className={`green-sheen ${styles.section}`} id="markalar" data-nav-theme="dark" aria-label="Markalar">
      <header className={styles.header}>
        <SectionMarker index="02" label="Markalar" className={styles.marker} />
        <h2 className={styles.title}>
          Butiğimizdeki <em>markalar</em>
        </h2>
      </header>
      <Reveal as="ul" className={styles.grid} stagger={0.1}>
        {BRANDS.map((b) => (
          <li key={b.slug}>
            <Link href={`/markalar/${b.slug}`} prefetch={false} className={styles.tile}>
              <span className={styles.frame}>
                <Image src={b.cover} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className={styles.image} />
              </span>
              <span className={styles.caption}>
                <span className={styles.brand}>{b.name}</span>
                <span className={styles.cta}>
                  Markayı keşfedin <span aria-hidden>→</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
