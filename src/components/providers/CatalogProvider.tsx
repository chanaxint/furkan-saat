"use client";

import { createContext, useContext, useMemo } from "react";
import type { Product } from "@/lib/data/types";

/**
 * The catalogue in the browser, for the cart, search and wishlist. The root
 * layout reads it on the server (lib/services/products) and hands it down, so
 * the browser always sees the same catalogue as the pages, whichever source
 * (products.json or the database) the server reads from. No catalogue data is
 * bundled into the browser's JavaScript.
 */

type Catalog = { products: Product[]; find: (slug: string) => Product | null };

const CatalogContext = createContext<Catalog | null>(null);

export function CatalogProvider({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const value = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return { products, find: (slug: string) => bySlug.get(slug) ?? null };
  }, [products]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside CatalogProvider.");
  return catalog;
}
