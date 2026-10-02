"use client";

import Image from "next/image";
import Link from "next/link";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ButtonLink } from "@/components/ui/Button";
import { brandName } from "@/lib/services/catalog";
import { useCart } from "@/lib/services/cart";
import { orderEnquiry } from "@/lib/services/enquiries";
import styles from "./AccountViews.module.css";

/**
 * The cart page. Online payment is not connected yet: the purchase request
 * goes to an advisor, who confirms the piece and arranges payment and delivery.
 */
export function CartView() {
  const cart = useCart();

  if (!cart.items.length)
    return (
      <div className={`container ${styles.empty}`}>
        <p className={styles.emptyTitle}>Sepetiniz boş.</p>
        <ButtonLink href="/koleksiyon">Koleksiyonu keşfedin</ButtonLink>
      </div>
    );

  return (
    <div className={`container ${styles.cart}`}>
      <ul className={styles.lines}>
        {cart.items.map(({ product: p, quantity }) => (
          <li key={p.slug} className={styles.line}>
            <Link href={`/saat/${p.slug}`} className={styles.thumb}>
              <Image src={p.images[0]} alt={`${brandName(p.brand)} ${p.model}`} fill sizes="160px" />
            </Link>
            <div className={styles.lineText}>
              <p className={styles.brand}>{brandName(p.brand)}</p>
              <Link href={`/saat/${p.slug}`} className={styles.model}>
                {p.model}
              </Link>
              <p className={styles.muted}>Ref. {p.reference}</p>
              <p className={styles.muted}>Adet: {quantity}</p>
              <button className={styles.remove} onClick={() => cart.remove(p.slug)}>
                Kaldır
              </button>
            </div>
            <PriceDisplay price={p.price} currency={p.currency} className={styles.price} />
          </li>
        ))}
      </ul>

      <aside className={styles.summary} aria-label="Sipariş özeti">
        <p className={styles.label}>Sipariş özeti</p>
        <dl>
          <div>
            <dt>Ara toplam</dt>
            <dd>
              <PriceDisplay price={cart.subtotal} currency={cart.currency} />
            </dd>
          </div>
          <div>
            <dt>Teslimat</dt>
            <dd>Sigortalı, ücretsiz</dd>
          </div>
        </dl>
        <ButtonLink href={orderEnquiry(cart.items.map((i) => i.product))} external variant="solid" className={styles.wide}>
          Satın alma talebi gönder
        </ButtonLink>
        <p className={styles.note}>
          Talebiniz bir danışmana iletilir; saatin durumunu teyit edip ödeme ve teslimatı sizinle birlikte planlar.
        </p>
      </aside>
    </div>
  );
}
