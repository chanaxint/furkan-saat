"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { useWishlist } from "@/lib/services/wishlist";
import styles from "./AccountViews.module.css";

/** Saved watches. Stored in this browser until accounts exist. */
/** `contained` = inside a page container already (account pages). */
export function WishlistView({ contained = false }: { contained?: boolean }) {
  const wrap = contained ? "" : "container";
  const { slugs } = useWishlist();
  const { find } = useCatalog();
  const products = slugs.flatMap((s) => find(s) ?? []);

  if (!products.length)
    return (
      <div className={`${wrap} ${styles.empty}`}>
        <p className={styles.emptyTitle}>Henüz favori saatiniz yok.</p>
        <p className={styles.emptyText}>Bir saati kaydetmek için fotoğrafının üzerindeki kalbe dokunun.</p>
        <ButtonLink href="/#koleksiyon">Koleksiyonu keşfedin</ButtonLink>
      </div>
    );

  return (
    <div className={wrap}>
      <ProductGrid products={products} />
    </div>
  );
}
