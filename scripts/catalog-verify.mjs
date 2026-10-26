// Checks the database's catalogue against src/lib/data/products.json: every
// watch present and active, in the same order, with the same slug, price,
// currency, photographs and every other field the site shows. Read-only.
//
//   npm run catalog:verify -- --rows <file.json>   rows exported as a JSON array
//                                                   (e.g. from a local test database)
//   npm run catalog:verify -- --supabase            the project in NEXT_PUBLIC_SUPABASE_URL,
//                                                   with the public key (active rows only)
//
// Exits 1 on any difference. Never prints keys or connection details.
// Needs Node 22.18+ (it reads the TypeScript catalogue helpers directly).
import { readFileSync } from "node:fs";

if (!process.features?.typescript) {
  console.error("Node 22.18 veya üstü gerekli (TypeScript dosyalarını doğrudan okuyabilmek için).");
  process.exit(1);
}
const { compareCatalog, fetchCatalogRows } = await import("../src/lib/catalog/rows.ts");
const { BRANDS } = await import("../src/lib/data/brands.ts");

const args = process.argv.slice(2);
const products = JSON.parse(readFileSync(new URL("../src/lib/data/products.json", import.meta.url), "utf8"));
const brandName = (slug) => BRANDS.find((b) => b.slug === slug)?.name ?? `(bilinmeyen marka: ${slug})`;

let rows;
if (args[0] === "--rows" && args[1]) {
  rows = JSON.parse(readFileSync(args[1], "utf8"));
  console.log(`Kaynak: ${args[1]}`);
} else if (args[0] === "--supabase") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY tanımlı olmalı (değerleri yazdırılmaz).");
    process.exit(2);
  }
  rows = await fetchCatalogRows(url, key);
  console.log("Kaynak: Supabase (REST, herkese açık anahtar, yalnızca aktif ürünler)");
} else {
  console.error("Kullanım: catalog-verify --rows <dosya.json> | --supabase");
  process.exit(2);
}
if (!Array.isArray(rows)) {
  console.error("Satırlar bir JSON dizisi olmalı.");
  process.exit(2);
}

const report = compareCatalog(products, rows, brandName);
const show = (v) => (typeof v === "string" ? v : JSON.stringify(v));
console.log(`products.json: ${report.expected} saat · veritabanı: ${report.rows} satır`);
if (report.missing.length) console.log(`Veritabanında yok (${report.missing.length}): ${report.missing.join(", ")}`);
if (report.extra.length) console.log(`Yalnızca veritabanında, aktif (${report.extra.length}): ${report.extra.join(", ")}`);
for (const d of report.differences.slice(0, 50))
  console.log(`Fark · ${d.slug} · ${d.field}: beklenen ${show(d.expected)} · bulunan ${show(d.actual)}`);
if (report.differences.length > 50) console.log(`… ve ${report.differences.length - 50} fark daha`);
console.log(report.ok ? "SONUÇ: Katalog birebir aynı." : `SONUÇ: Uyuşmazlık var (${report.differences.length} fark).`);
process.exit(report.ok ? 0 : 1);
