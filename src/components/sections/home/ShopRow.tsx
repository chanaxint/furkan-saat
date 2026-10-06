import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { WishlistButton } from "@/components/product/WishlistButton";
import type { Product } from "@/lib/data/types";
import { brandName } from "@/lib/services/catalog";
import styles from "./ShopRow.module.css";

/**
 * A row of watches, shop-window style.
 *  - `edge`: title on the left, five tiles edge to edge across the page
 *  - `centred`: a centred collection title, four tiles within the margins
 * Each tile: second photograph on hover, "Sepete ekle" over the photo, a
 * heart for favourites. On phones the row scrolls sideways.
 */
export function ShopRow({
  title,
  products,
  variant = "edge",
  href,
  linkLabel = "Tümünü görün",
}: {
  title: string;
  products: Product[];
  variant?: "edge" | "centred";
  href?: string;
  linkLabel?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section className={styles.section} data-variant={variant} data-nav-theme="light" aria-label={title}>
      <header className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {href && (
          <Link href={href} className={styles.all}>
            {linkLabel} <span aria-hidden>→</span>
          </Link>
        )}
      </header>
      <ul className={styles.row}>
        {products.map((p) => (
          <li key={p.slug}>
            <ShopCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShopCard({ product }: { product: Product }) {
  const [cover, alt] = product.front ? [product.front, product.images[0]] : product.images;
  const brand = brandName(product.brand);
  const sizes = "(max-width: 767px) 72vw, (max-width: 1100px) 33vw, 20vw";
  return (
    <article className={styles.card}>
      <Link href={`/saat/${product.slug}`} className={styles.link}>
        <div className={styles.media} data-front={product.front ? "" : undefined}>
          {cover && (
            <Image
              src={cover}
              alt={`${brand} ${product.model}`}
              fill
              sizes={sizes}
              className={`${styles.image} ${product.front ? styles.front : ""}`}
            />
          )}
          {alt && <Image src={alt} alt="" fill sizes={sizes} className={`${styles.image} ${styles.alt}`} />}
        </div>
        <p className={styles.name}>
          {brand} {product.model}
        </p>
        <PriceDisplay price={product.price} currency={product.currency} className={styles.price} />
      </Link>
      <WishlistButton slug={product.slug} className={styles.wish} />
      <AddToCartButton product={product} className={styles.add} />
    </article>
  );
}
