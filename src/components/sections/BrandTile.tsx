import Image from "next/image";
import Link from "next/link";
import type { Brand } from "@/lib/data/types";
import styles from "./BrandReels.module.css";

/** One brand tile: the brand's logo on a quiet green field; clicking opens the brand page. */
export function BrandTile({ brand }: { brand: Brand }) {
  return (
    <Link href={`/markalar/${brand.slug}`} prefetch={false} className={styles.tile} data-theme={brand.theme}>
      <span className={styles.frame} data-art={brand.tile ? "" : undefined}>
        {brand.tile ? (
          <Image src={brand.tile} alt={`${brand.name} logosu`} fill sizes="(max-width: 1024px) 50vw, 25vw" className={styles.art} />
        ) : (
          <span className={styles.logo}>
            <Image src={brand.logo} alt={`${brand.name} logosu`} fill sizes="(max-width: 1024px) 30vw, 15vw" />
          </span>
        )}
      </span>
      <span className={styles.caption}>
        <span className={styles.brand}>{brand.name}</span>
        <span className={styles.cta}>
          Markayı keşfedin <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}
