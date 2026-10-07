import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data/types";
import { brandName } from "@/lib/services/catalog";
import { refLabel } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";
import { PriceDisplay } from "./PriceDisplay";
import { WishlistButton } from "./WishlistButton";
import styles from "./ProductCard.module.css";
import { HoverCard } from "./HoverCard";

/**
 * A watch in a grid: a large photograph and four quiet lines of type.
 * On hover the second photograph fades in, the image eases closer and a
 * "Sepete ekle" bar rises over its foot; the heart saves it to favourites.
 */
export function ProductCard({
  product,
  priority = false,
  sizes,
  mark,
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
  /** A gold mark over the photograph (e.g. "Haftanın saati"). */
  mark?: string;
}) {
  // A front shot leads, the photograph in hand comes in on hover.
  const [cover, alt] = product.front ? [product.front, product.images[0]] : product.images;
  const name = `${brandName(product.brand)} ${product.model}`;
  const imgSizes = sizes ?? "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw";
  return (
    <HoverCard className={styles.card} data-marked={mark ? "" : undefined}>
      <Link href={`/saat/${product.slug}`} className={styles.link}>
        <div className={styles.media} data-tone={product.tone} data-front={product.front ? "" : undefined}>
          {cover && (
            <Image
              src={cover}
              alt={name}
              fill
              sizes={imgSizes}
              priority={priority}
              className={`${styles.image} ${product.front ? styles.front : ""}`}
            />
          )}
          {alt && <Image src={alt} alt="" fill sizes={imgSizes} className={`${styles.image} ${styles.alt}`} />}
          {mark && <span className={styles.mark}>{mark}</span>}
        </div>
        <div className={styles.info}>
          <p className={styles.brand} lang="en">
            {brandName(product.brand)}
          </p>
          <h3 className={styles.model}>{product.model}</h3>
          <p className={styles.meta}>
            <span>{refLabel(product.reference)}</span>
            <PriceDisplay price={product.price} currency={product.currency} className={styles.price} />
          </p>
        </div>
      </Link>
      <WishlistButton slug={product.slug} className={styles.wish} />
      <AddToCartButton product={product} className={styles.add} />
    </HoverCard>
  );
}
