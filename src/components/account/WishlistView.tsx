"use client";

import { ProductGrid } from "@/components/product/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { findProduct } from "@/lib/services/catalog";
import { useWishlist } from "@/lib/services/wishlist";
import styles from "./AccountViews.module.css";

/** Saved watches. Stored in this browser until accounts exist. */
export function WishlistView() {
  const { slugs } = useWishlist();
  const products = slugs.flatMap((s) => findProduct(s) ?? []);

  if (!products.length)
    return (
      <div className={`container ${styles.empty}`}>
        <p className={styles.emptyTitle}>Henüz favori saatiniz yok.</p>
        <p className={styles.emptyText}>Bir saati kaydetmek için fotoğrafının üzerindeki kalbe dokunun.</p>
        <ButtonLink href="/koleksiyon">Koleksiyonu keşfedin</ButtonLink>
      </div>
    );

  return (
    <div className="container">
      <ProductGrid products={products} />
    </div>
  );
}
