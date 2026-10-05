import { BRANDS } from "@/lib/data/brands";
import { COLLECTIONS } from "@/lib/data/collections";
import { PRODUCTS } from "@/lib/data/products";
import { ARTICLES } from "@/lib/data/journal";
import type { Article, Brand, CollectionDef, Product } from "@/lib/data/types";
import { normalize } from "@/lib/format";

/**
 * Catalogue access. Pages read products only through these functions, so the
 * static data can later be swapped for an API or CMS without touching the UI.
 */

export const getProducts = async (): Promise<Product[]> => PRODUCTS;
export const getProduct = async (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? null;
export const getFeatured = async () => PRODUCTS.filter((p) => p.featured);
export const getProductsByBrand = async (brand: string) => PRODUCTS.filter((p) => p.brand === brand);
export const getBrands = async (): Promise<Brand[]> => BRANDS;
export const getBrand = async (slug: string) => BRANDS.find((b) => b.slug === slug) ?? null;

export const getCollections = async (): Promise<CollectionDef[]> => COLLECTIONS;
export const getCollection = async (slug: string) => COLLECTIONS.find((c) => c.slug === slug) ?? null;
export const getProductsInCollection = async (slug: string) => PRODUCTS.filter((p) => p.collections.includes(slug));

/** Journal articles, newest first. */
export const getArticles = async (): Promise<Article[]> => [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date));
export const getArticle = async (slug: string) => ARTICLES.find((a) => a.slug === slug) ?? null;
export const getArticlesByBrand = async (brand: string) => (await getArticles()).filter((a) => a.brands.includes(brand));
export const getProductsBySlugs = async (slugs: string[]) => slugs.flatMap((s) => PRODUCTS.find((p) => p.slug === s) ?? []);

/** Other pieces to show under a watch: same brand first, then the rest. */
export const getRelated = async (product: Product, limit = 3) =>
  [...PRODUCTS.filter((p) => p.brand === product.brand), ...PRODUCTS.filter((p) => p.brand !== product.brand)]
    .filter((p) => p.slug !== product.slug)
    .slice(0, limit);

/** Synchronous lookups for client components (search, wishlist, cart). */
export const brandName = (slug: string) => BRANDS.find((b) => b.slug === slug)?.name ?? slug;
export const findProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? null;

/* ---------------------------------------------------------------- filters */

export type FacetKey = "brand" | "gender" | "color" | "type";
export type Filters = Partial<Record<FacetKey, string[]>>;
export type SortKey = "featured" | "newest" | "price-asc" | "price-desc";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Öne çıkanlar" },
  { key: "newest", label: "En yeniler" },
  { key: "price-asc", label: "Fiyat: düşükten yükseğe" },
  { key: "price-desc", label: "Fiyat: yüksekten düşüğe" },
];

/** Who a watch is for: the women's collection; digital classics for anyone; the rest men's. */
const gender = (p: Product) => (p.collections.includes("kadin") ? "kadin" : p.collections.includes("dijital") ? "unisex" : "erkek");
const GENDERS = [
  { value: "kadin", label: "Kadın" },
  { value: "erkek", label: "Erkek" },
  { value: "unisex", label: "Unisex" },
];

/** Colour of the watch (its dial / case tone). */
const COLORS = [
  { value: "champagne", label: "Altın" },
  { value: "stone", label: "Gümüş" },
  { value: "green", label: "Yeşil" },
  { value: "ivory", label: "Beyaz · Sedef" },
  { value: "deep", label: "Siyah" },
  { value: "wine", label: "Kırmızı" },
];

/** Kind of watch, from its collections. */
const TYPES = [
  { value: "klasik", label: "Klasik" },
  { value: "spor", label: "Spor" },
  { value: "kronograf", label: "Kronograf" },
  { value: "dijital", label: "Dijital" },
  { value: "tasli", label: "Taşlı" },
];

type Facet = {
  key: FacetKey;
  label: string;
  /** The values a product has for this facet. */
  values: (p: Product) => string[];
  /** Fixed options, in this order; otherwise derived from the products. */
  options?: { value: string; label: string }[];
  optionLabel?: (value: string) => string;
};

export const FACETS: Facet[] = [
  { key: "brand", label: "Marka", values: (p) => [p.brand], optionLabel: brandName },
  { key: "gender", label: "Cinsiyet", values: (p) => [gender(p)], options: GENDERS },
  { key: "color", label: "Renk", values: (p) => [p.tone], options: COLORS },
  { key: "type", label: "Tür", values: (p) => p.collections, options: TYPES },
];

/** Options per facet, limited to values that occur in the given products. */
export function facetOptions(products: Product[]) {
  return FACETS.map((f) => {
    const present = new Set(products.flatMap(f.values));
    const options = f.options
      ? f.options.filter((o) => present.has(o.value))
      : [...present]
          .map((v) => ({ value: v, label: f.optionLabel?.(v) ?? v }))
          .sort((a, b) => a.label.localeCompare(b.label, "tr"));
    return { key: f.key, label: f.label, options };
  }).filter((f) => f.options.length > 1);
}

export function applyFilters(products: Product[], filters: Filters) {
  return products.filter((p) =>
    FACETS.every((f) => {
      const chosen = filters[f.key];
      return !chosen?.length || f.values(p).some((v) => chosen.includes(v));
    }),
  );
}

export function sortProducts(products: Product[], sort: SortKey) {
  const list = [...products];
  // Price on request sorts after priced pieces in both directions.
  const price = (p: Product, fallback: number) => p.price ?? fallback;
  if (sort === "newest") list.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  if (sort === "price-asc") list.sort((a, b) => price(a, Infinity) - price(b, Infinity));
  if (sort === "price-desc") list.sort((a, b) => price(b, -Infinity) - price(a, -Infinity));
  return list;
}

/* ----------------------------------------------------------------- search */

export type SearchResults = { watches: Product[]; brands: Brand[]; articles: Article[] };

/** Every word must match somewhere: brand, model, reference, caliber, collection — or an article. */
export function search(query: string): SearchResults {
  const words = normalize(query).split(" ").filter(Boolean);
  if (!words.length) return { watches: [], brands: [], articles: [] };
  const hit = (text: string) => {
    const t = normalize(text);
    const compact = t.replace(/ /g, "");
    return words.every((w) => t.includes(w) || compact.includes(w));
  };
  const watches = PRODUCTS.filter((p) =>
    hit(
      [
        brandName(p.brand),
        p.model,
        p.reference,
        p.specs.caliber ?? "",
        p.specs.caseMaterial,
        p.specs.movement,
        ...p.collections.map((c) => COLLECTIONS.find((x) => x.slug === c)?.name ?? ""),
      ].join(" "),
    ),
  );
  const brands = BRANDS.filter((b) => hit(b.name));
  const articles = ARTICLES.filter((a) => hit([a.title, a.category, a.excerpt, ...a.brands.map(brandName)].join(" ")));
  return { watches, brands, articles };
}
