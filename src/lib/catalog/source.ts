import "server-only";

import { cache } from "react";
import { PRODUCTS } from "@/lib/data/products";
import type { Product } from "@/lib/data/types";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";
import {
  catalogConfigError,
  catalogSourceFrom,
  fetchCatalogRows,
  fetchSlugRedirects,
  rowToProduct,
  type CatalogSource,
} from "./rows";

/**
 * Where the catalogue comes from: CATALOG_SOURCE=json (default, also when the
 * variable is unset) reads src/lib/data/products.json, CATALOG_SOURCE=db reads
 * public.products with the public key (RLS: active watches only). db without
 * the Supabase settings is an error, never a quiet fall back to the JSON file.
 * Every page, and the browser's cart, search and wishlist (through
 * CatalogProvider), read the catalogue from here.
 *
 * Caching in db mode: the REST requests (the catalogue, and the slug
 * redirects as one list) are cached by Next with the tag
 * `catalog`. A successful change in the admin panel calls
 * revalidateTag(CATALOG_TAG, { expire: 0 }) (api/yonetim/urunler), so the next
 * visitor sees it; a change made elsewhere (SQL editor, seed) shows within
 * CATALOG_REVALIDATE seconds. Within one request, the catalogue is read once.
 */

export const CATALOG_TAG = "catalog";
export const CATALOG_REVALIDATE = 300;

const CACHED = { next: { tags: [CATALOG_TAG], revalidate: CATALOG_REVALIDATE } };

export function catalogSource(): CatalogSource {
  const source = catalogSourceFrom(process.env.CATALOG_SOURCE);
  const problem = catalogConfigError(source, supabaseConfigured);
  if (problem) throw new Error(problem);
  return source;
}

async function readCatalog(source: CatalogSource): Promise<Product[]> {
  if (source === "json") return PRODUCTS;
  const rows = await fetchCatalogRows(SUPABASE_URL, SUPABASE_KEY, fetch, CACHED);
  return rows.map(rowToProduct);
}

/** The whole catalogue, in catalogue order. */
export const loadCatalog = cache((): Promise<Product[]> => readCatalog(catalogSource()));

/** All slug redirects, read once and cached with the catalogue (same tag, same expiry). */
const loadRedirects = cache(() => fetchSlugRedirects(SUPABASE_URL, SUPABASE_KEY, fetch, CACHED));

/**
 * The current address of a watch that has moved (its slug was changed in the
 * panel), or null. Only the database keeps these; products.json has none. A
 * database error is thrown (the page fails), never reported as "not moved".
 */
export const findMovedProduct = cache(async (oldSlug: string): Promise<string | null> => {
  if (catalogSource() === "json") return null;
  const to = (await loadRedirects()).get(oldSlug);
  // Only to a watch the site shows; otherwise the old address is simply a 404.
  return to && (await loadCatalog()).some((p) => p.slug === to) ? to : null;
});
