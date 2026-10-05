import type { Product } from "@/lib/data/types";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

/**
 * Three columns on desktop (four when `dense`), two on tablet, one on phones.
 * Watches named in `marked` carry `markLabel` in gold.
 */
export function ProductGrid({
  products,
  priorityCount = 0,
  marked = [],
  markLabel,
  dense = false,
}: {
  products: Product[];
  priorityCount?: number;
  marked?: string[];
  markLabel?: string;
  dense?: boolean;
}) {
  return (
    <ul className={styles.grid} data-dense={dense || undefined}>
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard
            product={p}
            priority={i < priorityCount}
            mark={markLabel && marked.includes(p.slug) ? markLabel : undefined}
            sizes={dense ? "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw" : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
