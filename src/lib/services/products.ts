import "server-only";

import { loadCatalog } from "@/lib/catalog/source";
import { forGender, relatedTo } from "./catalog";
import type { Product } from "@/lib/data/types";

/**
 * The watches, for pages and other server code. Everything reads through
 * loadCatalog() (lib/catalog/source), which decides between products.json and
 * the database (CATALOG_SOURCE) and caches the database read.
 */

export const getProducts = (): Promise<Product[]> => loadCatalog();
export const getProduct = async (slug: string) => (await loadCatalog()).find((p) => p.slug === slug) ?? null;
export const getFeatured = async () => (await loadCatalog()).filter((p) => p.featured);
export const getProductsByBrand = async (brand: string) => (await loadCatalog()).filter((p) => p.brand === brand);
export const getProductsInCollection = async (slug: string) => (await loadCatalog()).filter((p) => p.collections.includes(slug));
export const getProductsBySlugs = async (slugs: string[]) => {
  const products = await loadCatalog();
  return slugs.flatMap((s) => products.find((p) => p.slug === s) ?? []);
};
export const getRelated = async (product: Product, limit = 3) => relatedTo(await loadCatalog(), product, limit);
export const getProductsByGender = async (g: "kadin" | "erkek") => forGender(await loadCatalog(), g);
