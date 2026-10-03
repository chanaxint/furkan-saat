"use client";

import type { Product } from "@/lib/data/types";
import { useCart, useCartDrawer } from "@/lib/services/cart";
import { BagIcon } from "./icons";

/**
 * "Sepete ekle" for a watch card. Adds the piece (each watch is a single
 * piece) and opens the cart drawer; once in the cart it reads "Sepette".
 * Cards are links, so the click never navigates.
 */
export function AddToCartButton({ product, className }: { product: Product; className?: string }) {
  const cart = useCart();
  const drawer = useCartDrawer();
  const inCart = cart.has(product.slug);
  if (product.price === null || product.availability === "Rezerve") return null;
  return (
    <button
      type="button"
      className={className}
      data-in-cart={inCart || undefined}
      aria-label={inCart ? "Sepette — sepeti aç" : `Sepete ekle`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!inCart) cart.add(product.slug);
        drawer.setOpen(true);
      }}
    >
      <BagIcon />
      <span>{inCart ? "Sepette" : "Sepete ekle"}</span>
    </button>
  );
}
