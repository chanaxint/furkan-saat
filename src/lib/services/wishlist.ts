"use client";

import { getSupabase } from "@/lib/supabase/client";
import { createLocalStore } from "./localStore";

/**
 * Saved watches, by slug. A guest's list is kept in this browser. Once signed
 * in, the list lives in the account (table `favorites`, RLS: own rows only):
 * the guest's picks are added to it, and every change is written there too.
 * Signing out clears the list from the browser.
 */
const store = createLocalStore<string[]>("furkan-saat:wishlist", []);

let userId: string | null = null;
/** slug → products.id, read from the public product list. */
const ids = new Map<string, string>();

async function productIds(slugs: string[]) {
  const supabase = getSupabase();
  const missing = slugs.filter((s) => !ids.has(s));
  if (supabase && missing.length) {
    const { data } = await supabase.from("products").select("id, slug").in("slug", missing);
    data?.forEach((p: { id: string; slug: string }) => ids.set(p.slug, p.id));
  }
  return slugs.map((s) => ids.get(s)).filter((id): id is string => Boolean(id));
}

/** Called by the AuthProvider whenever the signed-in user changes. */
export async function setFavoritesUser(next: string | null) {
  if (next === userId) return;
  const previous = userId;
  userId = next;
  const supabase = getSupabase();
  if (!next || !supabase) {
    if (previous) store.set([]);
    return;
  }
  // Bring the guest's picks into the account, then show the account's list.
  const local = store.get();
  const localIds = await productIds(local);
  if (localIds.length) {
    await supabase.from("favorites").upsert(
      localIds.map((product_id) => ({ product_id, user_id: next })),
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
  }
  const { data, error } = await supabase.from("favorites").select("products(slug)").order("created_at");
  if (error || userId !== next) return;
  const saved = (data as unknown as { products: { slug: string } | null }[])
    .map((r) => r.products?.slug)
    .filter((s): s is string => Boolean(s));
  store.set([...new Set([...saved, ...local])]);
}

async function persist(slug: string, saved: boolean) {
  const supabase = getSupabase();
  if (!userId || !supabase) return;
  const [productId] = await productIds([slug]);
  if (!productId) return;
  if (saved) {
    await supabase.from("favorites").upsert({ product_id: productId, user_id: userId }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
  } else {
    await supabase.from("favorites").delete().eq("product_id", productId);
  }
}

export function useWishlist() {
  const slugs = store.useStore();
  return {
    slugs,
    has: (slug: string) => slugs.includes(slug),
    toggle: (slug: string) => {
      const cur = store.get();
      const saved = !cur.includes(slug);
      store.set(saved ? [...cur, slug] : cur.filter((s) => s !== slug));
      void persist(slug, saved);
    },
    remove: (slug: string) => {
      store.set(store.get().filter((s) => s !== slug));
      void persist(slug, false);
    },
  };
}
