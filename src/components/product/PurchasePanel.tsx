"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/data/types";
import { useCart, useCartDrawer } from "@/lib/services/cart";
import { useCompare } from "@/lib/services/compare";
import { productEnquiry } from "@/lib/services/enquiries";
import { WishlistButton } from "./WishlistButton";
import styles from "./PurchasePanel.module.css";

/**
 * Actions on the watch page. A priced, available watch can be added to the
 * cart; every watch can be enquired about by e-mail or WhatsApp.
 */
export function PurchasePanel({ product }: { product: Product }) {
  const cart = useCart();
  const drawer = useCartDrawer();
  const enquiry = productEnquiry(product);
  const purchasable = product.price !== null && product.availability !== "Rezerve";
  const inCart = cart.has(product.slug);
  const compare = useCompare();
  const comparing = compare.has(product.slug);

  return (
    <div className={styles.panel}>
      {purchasable && (
        <Button
          variant="solid"
          className={styles.wide}
          onClick={() => {
            if (!inCart) cart.add(product.slug);
            drawer.setOpen(true);
          }}
        >
          {inCart ? "Sepette — görüntüle" : "Sepete ekle"}
        </Button>
      )}
      <ButtonLink href={enquiry.email} variant={purchasable ? "frame" : "solid"} className={styles.wide}>
        Bilgi al
      </ButtonLink>
      <div className={styles.links}>
        <ButtonLink href={enquiry.whatsapp} variant="line" external>
          WhatsApp ile iletişime geçin
        </ButtonLink>
        <ButtonLink href={`/ozel-gosterim?saat=${product.slug}`} variant="line">
          Butikte görün
        </ButtonLink>
        {comparing ? (
          <ButtonLink href="/karsilastir" variant="line">
            Karşılaştırmada — görüntüle
          </ButtonLink>
        ) : (
          !compare.full && (
            <Button variant="line" onClick={() => compare.toggle(product.slug)}>
              Karşılaştırmaya ekle
            </Button>
          )
        )}
      </div>
      <WishlistButton slug={product.slug} labelled className={styles.wish} />
    </div>
  );
}
