"use client";

import { findProduct } from "./catalog";
import { createLocalStore } from "./localStore";

export type CartLine = { slug: string; quantity: number };

/** Each watch is a single piece, so a line's quantity is capped at 1 by default. */
const MAX_QUANTITY = 1;

const store = createLocalStore<CartLine[]>("furkan-saat:cart", []);
const drawer = createLocalStore<boolean>(null, false);

export function useCart() {
  const lines = store.useStore();
  // Only priced, existing pieces count — the catalogue may have changed since.
  const items = lines.flatMap((l) => {
    const product = findProduct(l.slug);
    return product && product.price !== null ? [{ ...l, product }] : [];
  });
  const subtotal = items.reduce((sum, i) => sum + (i.product.price ?? 0) * i.quantity, 0);
  return {
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal,
    currency: items[0]?.product.currency ?? "EUR",
    has: (slug: string) => lines.some((l) => l.slug === slug),
    add: (slug: string) => {
      const cur = store.get();
      const line = cur.find((l) => l.slug === slug);
      store.set(
        line
          ? cur.map((l) => (l.slug === slug ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + 1) } : l))
          : [...cur, { slug, quantity: 1 }],
      );
    },
    remove: (slug: string) => store.set(store.get().filter((l) => l.slug !== slug)),
  };
}

/** The cart drawer's open state, shared by the nav, the drawer and "add to cart". */
export function useCartDrawer() {
  const open = drawer.useStore();
  return { open, setOpen: (v: boolean) => drawer.set(v) };
}
