import type { Product } from "@/lib/data/types";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

/**
 * Three columns on desktop (four when `dense`), two on tablet, one on phones.
 * Watches named in `marked` carry `markLabel` in gold. With `bands`, every
 * four watches sit on a full-width band of their own (colours from the page:
 * --band-a / --band-b, alternating).
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  marked = [],
  markLabel,
  dense = false,
  bands = false,
}: {
  products: Product[];
  priorityCount?: number;
  marked?: string[];
  markLabel?: string;
  dense?: boolean;
  bands?: boolean;
}) {
  const card = (p: Product, i: number) => (
    <li key={p.slug}>
      <ProductCard
        product={p}
        priority={i < priorityCount}
        mark={markLabel && marked.includes(p.slug) ? markLabel : undefined}
        sizes={dense || bands ? "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" : undefined}
      />
    </li>
  );
  if (bands) {
    const rows: Product[][] = [];
    for (let i = 0; i < products.length; i += 4) rows.push(products.slice(i, i + 4));
    return (
      <div className={styles.bands}>
        {rows.map((row, r) => (
          <div key={r} className={styles.band}>
            <ul className={`${styles.grid} ${styles.bandGrid}`}>{row.map((p, i) => card(p, r * 4 + i))}</ul>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul className={styles.grid} data-dense={dense || undefined}>
      {products.map(card)}
    </ul>
  );
}
