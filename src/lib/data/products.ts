import data from "./products.json";
import type { Product } from "./types";

/**
 * The catalogue as stored in products.json, edited from the /yonetim panel (or
 * by hand). Read only through lib/catalog/source (CATALOG_SOURCE=json, the
 * default): a watch added here appears in the collection, search, brand pages
 * and at /saat/[slug]. It is also the source of the database seed.
 * Photographs live in /public/assets/images/watches.
 *
 * Sample stock: references, specifications and prices are placeholders until
 * the real inventory is entered. `price: null` shows "Fiyat için bilgi alın".
 */
export const PRODUCTS = data as Product[];
