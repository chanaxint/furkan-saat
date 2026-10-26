// The catalogue ↔ database row mapping (src/lib/catalog/rows.ts). Run with `npm test`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BRANDS } from "../../src/lib/data/brands.ts";
import {
  catalogSourceFrom,
  compareCatalog,
  fetchCatalogRows,
  PRODUCT_COLUMNS,
  productToRow,
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

test("fetchCatalogRows errors never contain the key", async () => {
  const fake = async () => new Response("nope", { status: 401 });
  await assert.rejects(fetchCatalogRows("https://example.supabase.co", "pk-secret-value", fake), (e) => {
    assert.match(e.message, /HTTP 401/);
    assert.doesNotMatch(e.message, /pk-secret-value/);
    return true;
  });
});
