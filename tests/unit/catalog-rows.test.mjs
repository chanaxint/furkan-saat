// The catalogue ↔ database row mapping (src/lib/catalog/rows.ts). Run with `npm test`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BRANDS } from "../../src/lib/data/brands.ts";
import {
  catalogConfigError,
  catalogSourceFrom,
  compareCatalog,
  fetchCatalogRows,
  fetchSlugRedirects,
  slugRedirectMap,
  PRODUCT_COLUMNS,
  productToRow,
  productWriteFields,
  rowToProduct,
} from "../../src/lib/catalog/rows.ts";

const PRODUCTS = JSON.parse(readFileSync(new URL("../../src/lib/data/products.json", import.meta.url), "utf8"));
const brandName = (slug) => BRANDS.find((b) => b.slug === slug).name;
const rowsOf = (list = PRODUCTS) => list.map((p, i) => productToRow(p, i, brandName(p.brand)));
const clone = (v) => structuredClone(v);

test("every watch survives the trip to a row and back unchanged (all 106)", () => {
  assert.equal(PRODUCTS.length, 106);
  PRODUCTS.forEach((p, i) => assert.deepStrictEqual(rowToProduct(productToRow(p, i, brandName(p.brand))), p, p.slug));
});

test("rows keep what orders and the site rely on", () => {
  const rows = rowsOf();
  rows.forEach((r, i) => {
    const p = PRODUCTS[i];
    assert.equal(r.position, i);
    assert.equal(r.slug, p.slug);
    assert.equal(r.price, p.price);
    assert.equal(r.image, p.front ?? p.images[0]);
    assert.equal(r.name, `${brandName(p.brand)} ${p.model}`);
    assert.equal(r.stock, p.availability === "Stokta" ? 1 : 0);
  });
  assert.equal(rows.filter((r) => r.price === null).length, PRODUCTS.filter((p) => p.price === null).length, "price on request stays null");
});

test("values as Supabase and psql return them are read correctly", () => {
  const p = PRODUCTS.find((x) => x.price !== null);
  const row = { ...productToRow(p, 0, brandName(p.brand)) };
  assert.deepStrictEqual(rowToProduct({ ...row, price: String(row.price) }), p, "numeric as a string");
  assert.deepStrictEqual(rowToProduct({ ...row, added_at: `${row.added_at}T00:00:00` }), p, "date with a time part");
  assert.deepStrictEqual(rowToProduct({ ...row, specs: { ...row.specs, caliber: null } }), p, "null spec values are dropped");
});

test("a broken row is an error, not a guess", () => {
  const row = productToRow(PRODUCTS[0], 0, brandName(PRODUCTS[0].brand));
  for (const field of ["slug", "brand_slug", "model", "currency", "description", "added_at", "tone"])
    assert.throws(() => rowToProduct({ ...row, [field]: undefined }), undefined, field);
  assert.throws(() => rowToProduct({ ...row, images: "x.webp" }));
  assert.throws(() => rowToProduct({ ...row, price: "abc" }));
});

test("prices with more than two decimals are refused by the seed mapping", () => {
  assert.throws(() => productToRow({ ...PRODUCTS[0], price: 10.005 }, 0, "Casio"), /iki ondalık/);
});

test("compareCatalog: the seeded catalogue matches", () => {
  const report = compareCatalog(PRODUCTS, rowsOf(), brandName);
  assert.equal(report.ok, true, JSON.stringify(report.differences.slice(0, 3)));
  assert.equal(report.rows, 106);
});

test("compareCatalog: finds every kind of difference", () => {
  const cases = [
    ["price", (rows) => (rows[0].price = (rows[0].price ?? 0) + 1), "price"],
    ["currency", (rows) => (rows[1].currency = "USD"), "currency"],
    ["photo path", (rows) => (rows[2].images = ["/assets/images/watches/baska.webp"]), "images"],
    ["head-on photo", (rows) => (rows[3].front = "/assets/images/watches/front/baska.webp"), "front"],
    ["card picture", (rows) => (rows[4].image = "/x.webp"), "image"],
    ["order", (rows) => ([rows[5].position, rows[6].position] = [rows[6].position, rows[5].position]), "position"],
    ["brand", (rows) => (rows[7].brand_slug = "casio-x"), "brand"],
    ["spec", (rows) => (rows[8].specs = { ...rows[8].specs, strap: "Deri" }), "specs"],
    ["featured", (rows) => (rows[9].featured = !rows[9].featured), "featured"],
    ["collections", (rows) => (rows[10].collections = []), "collections"],
    ["retired", (rows) => (rows[11].is_active = false), "is_active"],
    ["name", (rows) => (rows[12].name = "Başka ad"), "name"],
    ["price on request", (rows) => (rows[rows.findIndex((r) => r.price === null)].price = 0), "price"],
  ];
  for (const [label, change, field] of cases) {
    const rows = clone(rowsOf());
    change(rows);
    const report = compareCatalog(PRODUCTS, rows, brandName);
    assert.equal(report.ok, false, label);
    assert.ok(report.differences.some((d) => d.field === field), `${label}: ${JSON.stringify(report.differences)}`);
  }
});

test("compareCatalog: missing and extra rows", () => {
  const rows = clone(rowsOf());
  const removed = rows.splice(3, 1)[0];
  rows.push({ ...clone(rows[0]), slug: "yalnizca-veritabaninda", position: 999 });
  rows.push({ ...clone(rows[0]), slug: "eski-arsivlenmis", position: 998, is_active: false });
  const report = compareCatalog(PRODUCTS, rows, brandName);
  assert.deepStrictEqual(report.missing, [removed.slug]);
  assert.deepStrictEqual(report.extra, ["yalnizca-veritabaninda"], "retired rows are not counted as extra");
  assert.equal(report.ok, false);
});

test("CATALOG_SOURCE: json by default, db on request, typos refused", () => {
  assert.equal(catalogSourceFrom(undefined), "json");
  assert.equal(catalogSourceFrom(""), "json");
  assert.equal(catalogSourceFrom("json"), "json");
  assert.equal(catalogSourceFrom(" DB "), "db");
  for (const bad of ["jsonx", "database", "true", "1"]) assert.throws(() => catalogSourceFrom(bad), /geçersiz/, bad);
});

test("fetchCatalogRows asks for the listed columns, active rows, in catalogue order", async () => {
  let seen;
  const fake = async (url, init) => {
    seen = { url: new URL(url), headers: init.headers };
    return new Response(JSON.stringify(rowsOf().slice(0, 2)), { status: 200 });
  };
  const rows = await fetchCatalogRows("https://example.supabase.co", "pk-test", fake);
  assert.equal(rows.length, 2);
  assert.equal(seen.url.pathname, "/rest/v1/products");
  assert.equal(seen.url.searchParams.get("select"), PRODUCT_COLUMNS.join(","));
  assert.ok(!PRODUCT_COLUMNS.includes("updated_by"), "who edited a row is not read");
  assert.equal(seen.url.searchParams.get("is_active"), "eq.true");
  assert.equal(seen.url.searchParams.get("order"), "position.asc,slug.asc");
  assert.equal(seen.headers.apikey, "pk-test");
});

test("fetchCatalogRows: not cached by default; the site's cache settings are passed through", async () => {
  const inits = [];
  const fake = async (_url, init) => {
    inits.push(init);
    return new Response("[]", { status: 200 });
  };
  await fetchCatalogRows("https://example.supabase.co", "pk-test", fake);
  await fetchCatalogRows("https://example.supabase.co", "pk-test", fake, { next: { tags: ["catalog"], revalidate: 300 } });
  assert.equal(inits[0].cache, "no-store");
  assert.deepStrictEqual(inits[1].next, { tags: ["catalog"], revalidate: 300 });
  assert.equal(inits[1].cache, undefined);
  assert.equal(inits[1].headers.apikey, "pk-test", "the cache settings cannot replace the headers");
});

test("fetchCatalogRows errors never contain the key", async () => {
  const fake = async () => new Response("nope", { status: 401 });
  await assert.rejects(fetchCatalogRows("https://example.supabase.co", "pk-secret-value", fake), (e) => {
    assert.match(e.message, /HTTP 401/);
    assert.doesNotMatch(e.message, /pk-secret-value/);
    return true;
  });
});

test("without Supabase settings the site stays on products.json; db without them is an error", () => {
  // Unset CATALOG_SOURCE never means the database, whatever else is configured.
  assert.equal(catalogSourceFrom(undefined), "json");
  assert.equal(catalogConfigError("json", false), null, "json needs no Supabase");
  assert.equal(catalogConfigError("json", true), null);
  assert.equal(catalogConfigError("db", true), null);
  assert.match(catalogConfigError("db", false), /CATALOG_SOURCE=db/, "db without settings is refused, not quietly json");
});

test("productWriteFields: what the panel writes is the seed's row, on sale, without its place in the list", () => {
  PRODUCTS.forEach((p, i) => {
    const fields = productWriteFields(p, brandName(p.brand));
    const { position, ...row } = productToRow(p, i, brandName(p.brand));
    assert.deepStrictEqual(fields, { ...row, is_active: true }, p.slug);
    assert.ok(!("position" in fields), "editing keeps the watch's place");
    assert.deepStrictEqual(rowToProduct({ ...fields, position }), p, "and it reads back as the same watch");
  });
});

test("slugRedirectMap: only redirects to a watch on sale, at another address", () => {
  const map = slugRedirectMap([
    { old_slug: "eski", products: { slug: "yeni", is_active: true } },
    { old_slug: "arsivlenmis", products: { slug: "kalkan-saat", is_active: false } }, // retired watch
    { old_slug: "kopuk", products: null }, // watch missing or hidden by RLS
    { old_slug: "kendine", products: { slug: "kendine", is_active: true } }, // would loop
    { old_slug: 5, products: { slug: "x", is_active: true } }, // malformed
    { products: { slug: "x", is_active: true } },
    { old_slug: "durum-yok", products: { slug: "x" } }, // is_active not stated: not counted
    null,
  ]);
  assert.deepStrictEqual([...map], [["eski", "yeni"]]);
});

const listResponse = (rows, total = rows.length, status = 200) =>
  new Response(JSON.stringify(rows), { status, headers: { "content-range": rows.length ? `0-${rows.length - 1}/${total}` : `*/${total}` } });

test("fetchSlugRedirects: every redirect in one request, with the row count", async () => {
  const seen = [];
  const fake = async (url, init) => {
    seen.push({ url: new URL(url), init });
    return listResponse([
      { old_slug: "a", products: { slug: "b", is_active: true } },
      { old_slug: "c", products: null },
    ]);
  };
  const map = await fetchSlugRedirects("https://example.supabase.co", "pk-test", fake);
  assert.deepStrictEqual([...map], [["a", "b"]]);
  assert.equal(seen.length, 1, "one request for all of them");
  assert.equal(seen[0].url.pathname, "/rest/v1/product_slug_redirects");
  assert.equal(seen[0].url.searchParams.get("select"), "old_slug,products(slug,is_active)");
  assert.equal(seen[0].url.searchParams.get("old_slug"), null, "not filtered by the address asked for");
  assert.equal(seen[0].init.headers.prefer, "count=exact");
  assert.equal(seen[0].init.cache, "no-store", "not cached unless the caller says so");
  await fetchSlugRedirects("https://example.supabase.co", "pk-test", fake, { next: { tags: ["catalog"], revalidate: 300 } });
  assert.deepStrictEqual(seen[1].init.next, { tags: ["catalog"], revalidate: 300 });
});

test("a list cut short by the REST row limit is an error, not a shorter list", async () => {
  const short = async () => listResponse([{ old_slug: "a", products: { slug: "b", is_active: true } }], 1200);
  await assert.rejects(fetchSlugRedirects("https://example.supabase.co", "pk-test", short), /eksik geldi: 1 \/ 1200/);
  const rows = rowsOf().slice(0, 3);
  await assert.rejects(fetchCatalogRows("https://example.supabase.co", "pk-test", async () => listResponse(rows, 106)), /Ürünler eksik geldi: 3 \/ 106/);
  assert.equal((await fetchCatalogRows("https://example.supabase.co", "pk-test", async () => listResponse(rows))).length, 3);
  assert.equal((await fetchSlugRedirects("https://example.supabase.co", "pk-test", async () => listResponse([], 0))).size, 0, "an empty list is fine");
});

test("redirect read errors are thrown, never read as 'no redirect', and never contain the key", async () => {
  for (const res of [new Response("{}", { status: 500 }), new Response("{}", { status: 503 }), new Response('{"x":1}', { status: 200 })])
    await assert.rejects(fetchSlugRedirects("https://example.supabase.co", "pk-secret-value", async () => res), (e) => {
      assert.match(e.message, /Yönlendirmeler okunamadı/);
      assert.doesNotMatch(e.message, /pk-secret-value/);
      return true;
    });
});
