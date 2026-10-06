"use client";

import Image from "next/image";
import Link from "next/link";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { Drawer } from "@/components/ui/Drawer";
import { brandName } from "@/lib/services/catalog";
import { useCart, useCartDrawer } from "@/lib/services/cart";
import { refLabel } from "@/lib/format";
import styles from "./CartDrawer.module.css";

/** The cart as a side panel, opened from the bag icon or after "Satın al". */
export function CartDrawer() {
  const { open, setOpen } = useCartDrawer();
  const cart = useCart();
  const close = () => setOpen(false);

  return (
    <Drawer
      open={open}
      onClose={close}
      label="Sepet"
      title={`Sepet${cart.count ? ` · ${cart.count}` : ""}`}
      footer={
        cart.items.length > 0 && (
          <div className={styles.footer}>
            <p className={styles.total}>
              <span>Ara toplam</span>
              <PriceDisplay price={cart.subtotal} currency={cart.currency} />
            </p>
            <Link href="/odeme" onClick={close} className={`${styles.wide} ${styles.checkout}`}>
              Ödemeye geçin
            </Link>
            <Link href="/sepet" onClick={close} className={styles.view}>
              Sepeti görüntüle
            </Link>
          </div>
        )
      }
    >
      {cart.items.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Sepetiniz boş.</p>
          <Link href="/#koleksiyon" onClick={close} className={styles.view}>
            Koleksiyonu keşfedin
          </Link>
        </div>
      ) : (
        <ul className={styles.lines}>
          {cart.items.map(({ product: p }) => (
            <li key={p.slug} className={styles.line}>
              <Link href={`/saat/${p.slug}`} onClick={close} className={styles.thumb}>
                <Image src={p.images[0]} alt="" fill sizes="96px" />
              </Link>
              <div className={styles.text}>
                <p className={styles.brand} lang="en">{brandName(p.brand)}</p>
                <p className={styles.model}>{p.model}</p>
                {p.reference && <p className={styles.ref}>{refLabel(p.reference)}</p>}
                <button className={styles.remove} onClick={() => cart.remove(p.slug)}>
                  Kaldır
                </button>
              </div>
              <PriceDisplay price={p.price} currency={p.currency} className={styles.price} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
