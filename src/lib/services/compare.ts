"use client";

import { createLocalStore } from "./localStore";

/** Watches chosen for side-by-side comparison (up to four), kept in the browser. */
export const MAX_COMPARE = 4;
const store = createLocalStore<string[]>("furkan-saat:compare", []);

export function useCompare() {
  const slugs = store.useStore();
  return {
    slugs,
    has: (slug: string) => slugs.includes(slug),
    full: slugs.length >= MAX_COMPARE,
    toggle: (slug: string) => {
      const cur = store.get();
      if (cur.includes(slug)) store.set(cur.filter((s) => s !== slug));
      else if (cur.length < MAX_COMPARE) store.set([...cur, slug]);
    },
    remove: (slug: string) => store.set(store.get().filter((s) => s !== slug)),
  };
}
