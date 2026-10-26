import "server-only";

import { PRODUCTS } from "@/lib/data/products";
import type { Product } from "@/lib/data/types";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";
import { catalogSourceFrom, fetchCatalogRows, rowToProduct, type CatalogSource } from "./rows";

/**
 * Where the catalogue comes from: CATALOG_SOURCE=json (default) reads
 * src/lib/data/products.json, CATALOG_SOURCE=db reads public.products with the
 * public key (RLS: active watches only).
 *
 * Prepared, not yet in use: the pages still read products.json through
 * lib/services/catalog.ts, and the browser's cart, search and wishlist read it
 * too. Both move over together in the next step, so the site never shows two
 * catalogues at once.
 */

export const catalogSource = (): CatalogSource => catalogSourceFrom(process.env.CATALOG_SOURCE);

export async function loadCatalog(source: CatalogSource = catalogSource()): Promise<Product[]> {
  if (source === "json") return PRODUCTS;
  if (!supabaseConfigured) throw new Error("CATALOG_SOURCE=db, ancak Supabase ayarları eksik.");
  const rows = await fetchCatalogRows(SUPABASE_URL, SUPABASE_KEY);
  return rows.map(rowToProduct);
}
