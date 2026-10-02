"use client";

import { createLocalStore } from "./localStore";

/** Saved watches, by slug. Works without an account (stored in the browser). */
const store = createLocalStore<string[]>("furkan-saat:wishlist", []);

export function useWishlist() {
  const slugs = store.useStore();
  return {
    slugs,
    has: (slug: string) => slugs.includes(slug),
    toggle: (slug: string) => {
      const cur = store.get();
      store.set(cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]);
    },
    remove: (slug: string) => store.set(store.get().filter((s) => s !== slug)),
  };
}
