import type { Product, ProductSpecs } from "../data/types";

/**
 * The catalogue as rows of public.products, and back. One module for the site,
 * the seed generator (scripts/products-seed.mjs), the checker
 * (scripts/catalog-verify.mjs) and the tests, so all of them agree on what a
 * watch looks like in the database. No runtime imports: Node runs it directly.
 *
 * The guarantee the rest relies on: rowToProduct(productToRow(p, i, name))
 * equals p, field for field, for every watch in products.json.
 */

/** Where the site reads its catalogue: the JSON file (default) or the database. */
export type CatalogSource = "json" | "db";

/** CATALOG_SOURCE → "json" | "db". Unset means "json"; anything else is a configuration error. */
export function catalogSourceFrom(value: string | undefined | null): CatalogSource {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "" || v === "json") return "json";
  if (v === "db") return "db";
  throw new Error(`CATALOG_SOURCE "${value}" geçersiz: "json" ya da "db" olmalı.`);
}

/** A watch as stored in public.products (the columns the catalogue uses). */
export type ProductRow = {
  slug: string;
  /** "<brand name> <model>": what orders and favourites show. */
  name: string;
  /** The brand's display name (create_order copies it into orders). */
  brand: string;
  brand_slug: string;
  model: string;
  reference: string;
  description: string;
  price: number | null;
  currency: string;
  /** The card picture: `front`, else the first photograph. */
  image: string | null;
  images: string[];
  front: string | null;
  specs: Partial<Record<keyof ProductSpecs, string>>;
  condition: string;
  availability: string;
  full_set: boolean;
  collections: string[];
  featured: boolean;
  added_at: string;
  tone: string;
  /** Place in the catalogue (products.json order). */
  position: number;
  stock: number;
  is_active: boolean;
};

/**
 * The columns read back, listed rather than `*`: nothing beyond the catalogue
 * (such as who last edited a row) is asked for.
 */
export const PRODUCT_COLUMNS = [
  "slug", "name", "brand", "brand_slug", "model", "reference", "description", "price", "currency", "image",
  "images", "front", "specs", "condition", "availability", "full_set", "collections", "featured", "added_at",
  "tone", "position", "stock", "is_active",
] as const;

export const SPEC_KEYS = [
  "movement", "caliber", "powerReserve", "caseDiameter", "caseMaterial", "crystal", "waterResistance", "strap", "year",
] as const satisfies readonly (keyof ProductSpecs)[];

/** A watch from products.json as a row; `position` is its index there. */
export function productToRow(p: Product, position: number, brandName: string): ProductRow {
  if (p.price !== null && (!Number.isFinite(p.price) || Math.round(p.price * 100) !== p.price * 100))
    throw new Error(`${p.slug}: fiyat en fazla iki ondalık basamaklı olmalı (${p.price}).`);
  const specs: ProductRow["specs"] = {};
  for (const k of SPEC_KEYS) if (typeof p.specs[k] === "string") specs[k] = p.specs[k];
  return {
    slug: p.slug,
    name: `${brandName} ${p.model}`,
    brand: brandName,
    brand_slug: p.brand,
    model: p.model,
    reference: p.reference ?? "",
    description: p.description,
    price: p.price,
    currency: p.currency,
    image: p.front ?? p.images[0] ?? null,
    images: [...p.images],
    front: p.front ?? null,
    specs,
    condition: p.condition,
    availability: p.availability,
    full_set: p.fullSet,
    collections: [...p.collections],
    featured: p.featured === true,
    added_at: p.addedAt,
    tone: p.tone,
    position,
    // As before: a piece in stock counts as one, anything else as none.
    stock: p.availability === "Stokta" ? 1 : 0,
    is_active: true,
  };
}

const text = (v: unknown, field: string, slug: string) => {
  if (typeof v !== "string") throw new Error(`${slug}: ${field} eksik ya da hatalı.`);
  return v;
};
const list = (v: unknown, field: string, slug: string) => {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new Error(`${slug}: ${field} bir metin listesi olmalı.`);
  return [...v] as string[];
};

/**
 * A row read from the database as the site's Product. Accepts what Supabase's
 * REST API and psql's json_agg return (numeric as a number or a string, dates as
 * "YYYY-MM-DD"); a row missing a required field is an error, not a guess.
 */
export function rowToProduct(input: unknown): Product {
  const r = (input ?? {}) as Record<string, unknown>;
  const slug = text(r.slug, "slug", "?");
  const price = r.price === null || r.price === undefined ? null : Number(r.price);
  if (price !== null && !Number.isFinite(price)) throw new Error(`${slug}: fiyat hatalı.`);
  const rawSpecs = (r.specs ?? {}) as Record<string, unknown>;
  const specs = {} as ProductSpecs;
  for (const k of SPEC_KEYS) if (typeof rawSpecs[k] === "string") (specs as Record<string, string>)[k] = rawSpecs[k] as string;
  const addedAt = text(r.added_at, "added_at", slug).slice(0, 10);
  return {
    slug,
    brand: text(r.brand_slug, "brand_slug", slug),
    model: text(r.model, "model", slug),
    reference: typeof r.reference === "string" ? r.reference : "",
    price,
    currency: text(r.currency, "currency", slug) as Product["currency"],
    images: list(r.images, "images", slug),
    ...(typeof r.front === "string" && r.front ? { front: r.front } : {}),
    description: text(r.description, "description", slug),
    specs,
    condition: text(r.condition, "condition", slug) as Product["condition"],
    availability: text(r.availability, "availability", slug) as Product["availability"],
    fullSet: r.full_set === true,
    collections: list(r.collections, "collections", slug),
    ...(r.featured === true ? { featured: true } : {}),
    addedAt,
    tone: text(r.tone, "tone", slug) as Product["tone"],
  };
}

/* ---------------------------------------------------------------- compare */

export type CatalogDifference = { slug: string; field: string; expected: unknown; actual: unknown };
export type CatalogReport = {
  /** Watches in products.json. */
  expected: number;
  /** Rows read from the database. */
  rows: number;
  /** In products.json, not in the database. */
  missing: string[];
  /** In the database (active), not in products.json. */
  extra: string[];
  differences: CatalogDifference[];
  ok: boolean;
};

/** Key-order-independent equality for JSON values. */
const canon = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canon).join(",")}]`
    : v && typeof v === "object"
      ? `{${Object.keys(v as object)
          .sort()
          .filter((k) => (v as Record<string, unknown>)[k] !== undefined)
          .map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`)
          .join(",")}}`
      : JSON.stringify(v);

/**
 * Checks the database against products.json: every watch present and active,
 * at the same place, with the same slug, price, currency, photographs and every
 * other field the site shows. `brandName` gives a brand slug's display name.
 */
export function compareCatalog(products: Product[], rows: unknown[], brandName: (slug: string) => string): CatalogReport {
  const bySlug = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    if (typeof r?.slug === "string") bySlug.set(r.slug, r);
  }
  const known = new Set(products.map((p) => p.slug));
  const differences: CatalogDifference[] = [];
  const missing: string[] = [];
  const diff = (slug: string, field: string, expected: unknown, actual: unknown) => {
    if (canon(expected) !== canon(actual)) differences.push({ slug, field, expected, actual });
  };

  products.forEach((p, i) => {
    const r = bySlug.get(p.slug);
    if (!r) return void missing.push(p.slug);
    let back: Product;
    try {
      back = rowToProduct(r);
    } catch (e) {
      return void differences.push({ slug: p.slug, field: "(satır)", expected: "okunabilir satır", actual: (e as Error).message });
    }
    for (const k of Object.keys({ ...p, ...back }) as (keyof Product)[]) diff(p.slug, k, p[k], back[k]);
    const want = productToRow(p, i, brandName(p.brand));
    for (const k of ["position", "name", "brand", "image", "is_active"] as const) diff(p.slug, k, want[k], k === "position" ? Number(r[k]) : r[k]);
  });

  const extra = [...bySlug.values()].filter((r) => !known.has(r.slug as string) && r.is_active !== false).map((r) => r.slug as string);
  return {
    expected: products.length,
    rows: rows.length,
    missing,
    extra,
    differences,
    ok: missing.length === 0 && extra.length === 0 && differences.length === 0,
  };
}

/* ------------------------------------------------------------- REST read */

/**
 * The active catalogue from Supabase's REST API with the public (publishable)
 * key, in catalogue order. Errors never include the key. `cacheInit` sets how
 * the request is cached (the site passes Next's `next: { tags, revalidate }`);
 * by default it is not cached at all.
 */
export async function fetchCatalogRows(
  supabaseUrl: string,
  publishableKey: string,
  fetchImpl: typeof fetch = fetch,
  cacheInit: Record<string, unknown> = { cache: "no-store" },
) {
  const url = new URL("/rest/v1/products", supabaseUrl);
  url.searchParams.set("select", PRODUCT_COLUMNS.join(","));
  url.searchParams.set("is_active", "eq.true");
  url.searchParams.set("order", "position.asc,slug.asc");
  const res = await fetchImpl(url, {
    ...cacheInit,
    headers: { apikey: publishableKey, authorization: `Bearer ${publishableKey}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Ürünler okunamadı (HTTP ${res.status}).`);
  const rows = (await res.json()) as unknown;
  if (!Array.isArray(rows)) throw new Error("Ürünler okunamadı (beklenmeyen yanıt).");
  return rows as Record<string, unknown>[];
}
