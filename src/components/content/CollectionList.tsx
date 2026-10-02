import Image from "next/image";
import Link from "next/link";
import type { CollectionDef, Product } from "@/lib/data/types";
import styles from "./CollectionList.module.css";

/** Collections as an index set in type; a few photographs of each surface on hover. */
export function CollectionList({ collections, products }: { collections: CollectionDef[]; products: Product[] }) {
  return (
    <ol className={styles.list}>
      {collections.map((c, i) => {
        const pieces = products.filter((p) => p.collections.includes(c.slug));
        return (
          <li key={c.slug}>
            <Link href={`/koleksiyonlar/${c.slug}`} className={styles.row}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.name}>{c.name}</span>
              <span className={styles.description}>{c.description}</span>
              <span className={styles.thumbs} aria-hidden>
                {pieces.slice(0, 3).map((p) => (
                  <span key={p.slug} className={styles.thumb}>
                    <Image src={p.images[0]} alt="" fill sizes="64px" />
                  </span>
                ))}
              </span>
              <span className={styles.count}>{pieces.length} saat</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
