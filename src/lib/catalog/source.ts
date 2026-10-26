import "server-only";

import { cache } from "react";
import { PRODUCTS } from "@/lib/data/products";
import type { Product } from "@/lib/data/types";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";
import { catalogSourceFrom, fetchCatalogRows, rowToProduct, type CatalogSource } from "./rows";

/**
 * Where the catalogue comes from: CATALOG_SOURCE=json (default) reads
 * src/lib/data/products.json, CATALOG_SOURCE=db reads public.products with the
 * public key (RLS: active watches only). Every page, and the browser's cart,
 * search and wishlist (through CatalogProvider), read the catalogue from here.
 *
 * Caching in db mode: the REST request is cached by Next with the tag
 * `catalog`. A change made in the admin panel calls
 * revalidateTag(CATALOG_TAG, { expire: 0 }), so the next visitor sees it; a
 * change made elsewhere (SQL editor, seed) shows within CATALOG_REVALIDATE
 * seconds. Within one request, the catalogue is read once (React cache).
 */

export const CATALOG_TAG = "catalog";
export const CATALOG_REVALIDATE = 300;

export const catalogSource = (): CatalogSource => catalogSourceFrom(process.env.CATALOG_SOURCE);

async function readCatalog(source: CatalogSource): Promise<Product[]> {
  if (source === "json") return PRODUCTS;
  if (!supabaseConfigured) throw new Error("CATALOG_SOURCE=db, ancak Supabase ayarları eksik.");
  const rows = await fetchCatalogRows(SUPABASE_URL, SUPABASE_KEY, fetch, {
    next: { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE },
  });
  return rows.map(rowToProduct);
}

/** The whole catalogue, in catalogue order. */
export const loadCatalog = cache((): Promise<Product[]> => readCatalog(catalogSource()));
