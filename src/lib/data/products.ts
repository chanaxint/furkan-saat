import data from "./products.json";
import type { Product } from "./types";

/**
 * The catalogue — the single source for every watch on the site, stored in
 * products.json and edited from the /yonetim panel (or by hand). A watch added
 * there appears in the collection, search, brand pages and at /saat/[slug].
 * Photographs live in /public/assets/images/watches.
 *
 * Sample stock: references, specifications and prices are placeholders until
 * the real inventory is entered. `price: null` shows "Fiyat için bilgi alın".
 */
export const PRODUCTS = data as Product[];
