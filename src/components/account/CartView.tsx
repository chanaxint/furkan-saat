"use client";

import Image from "next/image";
import Link from "next/link";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { ButtonLink } from "@/components/ui/Button";
import { brandName } from "@/lib/services/catalog";
import { useCart } from "@/lib/services/cart";
import { refLabel } from "@/lib/format";
import styles from "./AccountViews.module.css";

/**
 * The cart page: the pieces, the total and the way to checkout.
 */
export function CartView() {
  const cart = useCart();

  if (!cart.items.length)
    return (
      <div className={`container ${styles.empty}`}>
        <p className={styles.emptyTitle}>Sepetiniz boş.</p>
        <ButtonLink href="/#koleksiyon">Koleksiyonu keşfedin</ButtonLink>
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
              <p className={styles.brand} lang="en">{brandName(p.brand)}</p>
              <Link href={`/saat/${p.slug}`} className={styles.model}>
                {p.model}
              </Link>
              {p.reference && <p className={styles.muted}>{refLabel(p.reference)}</p>}
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
        <ButtonLink href="/odeme" variant="solid" className={styles.wide}>
          Ödemeye geçin
        </ButtonLink>
        <p className={styles.note}>
          Ödeme adımında banka havalesi ya da danışmanla ödeme seçebilirsiniz. Saat, ödeme süresince sizin için ayrılır.
        </p>
      </aside>
    </div>
  );
}
