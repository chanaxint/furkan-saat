"use client";

import { Button, ButtonLink } from "@/components/ui/Button";
import type { Product } from "@/lib/data/types";
import { useCart, useCartDrawer } from "@/lib/services/cart";
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
          {inCart ? "Sepette — görüntüle" : "Satın al"}
        </Button>
      )}
      <ButtonLink href={enquiry.email} variant={purchasable ? "frame" : "solid"} className={styles.wide}>
        Bilgi al
      </ButtonLink>
      <ButtonLink href={enquiry.whatsapp} variant="line" external className={styles.whatsapp}>
        WhatsApp ile iletişime geçin
      </ButtonLink>
      <WishlistButton slug={product.slug} labelled className={styles.wish} />
    </div>
  );
}
