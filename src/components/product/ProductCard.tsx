import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data/types";
import { brandName } from "@/lib/services/catalog";
import { PriceDisplay } from "./PriceDisplay";
import { WishlistButton } from "./WishlistButton";
import styles from "./ProductCard.module.css";

/**
 * A watch in a grid: a large photograph and four quiet lines of type.
 * On hover the second photograph fades in and the image eases closer.
 */
export function ProductCard({ product, priority = false, sizes }: { product: Product; priority?: boolean; sizes?: string }) {
  const [cover, alt] = product.images;
  const name = `${brandName(product.brand)} ${product.model}`;
  const imgSizes = sizes ?? "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw";
  return (
    <article className={styles.card}>
      <Link href={`/saat/${product.slug}`} className={styles.link}>
        <div className={styles.media} data-tone={product.tone}>
          {cover && (
            <Image src={cover} alt={name} fill sizes={imgSizes} priority={priority} className={styles.image} />
          )}
          {alt && <Image src={alt} alt="" fill sizes={imgSizes} className={`${styles.image} ${styles.alt}`} />}
        </div>
        <div className={styles.info}>
          <p className={styles.brand}>{brandName(product.brand)}</p>
          <h3 className={styles.model}>{product.model}</h3>
          <p className={styles.meta}>
            <span>Ref. {product.reference}</span>
            <PriceDisplay price={product.price} currency={product.currency} className={styles.price} />
          </p>
        </div>
      </Link>
      <WishlistButton slug={product.slug} className={styles.wish} />
    </article>
  );
}
