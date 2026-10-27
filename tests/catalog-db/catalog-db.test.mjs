// The catalogue from the database (CATALOG_SOURCE=db) on a production build
// (next build + next start), against a local stand-in for Supabase seeded with
// products.json. Shows that:
//   - the pages show the same watches as with products.json
//   - only a successful write from the panel expires the cached catalogue;
//     refused, invalid or failed requests leave it alone
//   - a watch added after the build opens at /saat/<slug> without a new build,
//     its old address redirects after a slug change, and it is gone once retired
//   - in db mode the panel manages watches on the live site, while the pages
//     that write the project's files stay development-only
// No real Supabase project is involved: passing here does not show that a real
// project answers the same way (see docs/supabase-kurulum.md for what to check).
//   npm run test:catalog-db
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { productToRow } from "../../src/lib/catalog/rows.ts";
import { BRANDS } from "../../src/lib/data/brands.ts";
import { startMockSupabase } from "../admin-http/mock-supabase.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const NEXT = path.join(ROOT, "node_modules/next/dist/bin/next");
const PRODUCTS = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/products.json"), "utf8"));
const brandName = (slug) => BRANDS.find((b) => b.slug === slug).name;

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

const KEY = "sb_publishable_test_only_fake";
let mock, base, server, users;
const log = [];

before(async () => {
  // A fake key in the new format (sb_publishable_…): the stand-in refuses it as a Bearer token,
  // so every catalogue and redirect read must send it in apikey only.
  mock = await startMockSupabase({ catalog: PRODUCTS.map((p, i) => productToRow(p, i, brandName(p.brand))), publishableKey: KEY });
  // Redirects already in the database: to a watch on sale, to a retired watch, and to no watch.
  const retired = { ...productToRow({ ...PRODUCTS[2], slug: "arsiv-saat" }, 500, brandName(PRODUCTS[2].brand)), id: randomUUID(), is_active: false };
  mock.products.push(retired);
  mock.redirects.set("eski-adres-0", mock.products.find((p) => p.slug === PRODUCTS[0].slug).id);
  mock.redirects.set("arsiv-eski", retired.id);
  mock.redirects.set("kopuk-eski", randomUUID());
  users = {
    admin: mock.addUser({ id: "cccccccc-0000-0000-0000-000000000003", email: "ayse@example.com", admin: true }),
    customer: mock.addUser({ id: "dddddddd-0000-0000-0000-000000000004", email: "can@example.com" }),
  };
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  // Fake, public test values only; no real project, no service role key.
  const env = {
    ...process.env,
    CATALOG_SOURCE: "db",
    NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${mock.port}`,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: KEY,
    // The public address differs from the one the tests use, as on a real site behind a
    // domain: the panel's Origin check must accept the address the browser actually used.
    NEXT_PUBLIC_SITE_URL: "https://furkansaat.example",
    NEXT_TELEMETRY_DISABLED: "1",
    NO_PROXY: "localhost,127.0.0.1",
    no_proxy: "localhost,127.0.0.1",
    NODE_ENV: "production",
  };
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete env.SUPABASE_SERVICE_ROLE_KEY;

  // Not spawnSync: the build reads the catalogue from the stand-in, which runs in this process.
  const buildLog = [];
  const code = await new Promise((resolve) => {
    const build = spawn(process.execPath, [NEXT, "build"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
    build.stdout.on("data", (d) => buildLog.push(String(d)));
    build.stderr.on("data", (d) => buildLog.push(String(d)));
    build.on("close", resolve);
  });
  if (code !== 0) throw new Error(`next build failed:\n${buildLog.join("")}`);
  server = spawn(process.execPath, [NEXT, "start", "-H", "127.0.0.1", "-p", String(port)], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (d) => log.push(String(d)));
  server.stderr.on("data", (d) => log.push(String(d)));
  for (let i = 0; i < 240; i++) {
    try {
      await fetch(`${base}/robots.txt`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Next did not start:\n${log.join("")}`);
});

after(async () => {
  server?.kill("SIGTERM");
  await mock?.close();
});

function call(method, pathname, { who = null, origin = base, body } = {}) {
  const headers = {};
  if (who) headers.cookie = `sb-localhost-auth-token=${users[who].cookie}`;
  if (origin) headers.origin = origin;
  if (body !== undefined) headers["content-type"] = "application/json";
  return fetch(`${base}${pathname}`, { method, headers, redirect: "manual", body: body === undefined ? undefined : JSON.stringify(body) });
}
const status = async (pathname, opts) => (await call("GET", pathname, opts)).status;
/** Pages a visitor might open, so that a pending catalogue refresh would happen. */
const browse = async () => {
  for (const p of ["/", `/saat/${PRODUCTS[0].slug}`, "/kadin", "/sitemap.xml"]) await call("GET", p);
};

const NEW = "test-yeni-saat";
let unknownCount = 0;
/** A fresh address that is not a watch: its page has not been rendered (or cached) yet. */
const unknownSlug = () => `bilinmeyen-${process.pid}-${++unknownCount}`;
const newWatch = (slug = NEW) => ({ ...structuredClone(PRODUCTS.find((p) => p.price !== null)), slug, model: "Test Yeni Saat", reference: "TST-1" });

describe("catalogue from the database (prod build)", () => {
  // First, while the redirects have not been read (nor cached) yet.
  test("a database error is an error, not a 404", async () => {
    const slug = unknownSlug();
    const reads = mock.redirectReads();
    mock.failing.add("redirects");
    try {
      const res = await call("GET", `/saat/${slug}`);
      assert.equal(res.status, 500, "a failed redirect lookup is not reported as 'no such watch'");
      assert.doesNotMatch(await res.text(), /Bu sayfa.*bulunamad/s);
      assert.ok(mock.redirectReads() > reads, "the lookup was attempted");
    } finally {
      mock.failing.delete("redirects");
    }
    assert.equal(await status(`/saat/${slug}`), 404, "once the database answers, the same address is a plain 404");
  });

  test("redirects: to a watch on sale only; retired or missing targets are a 404", async () => {
    const moved = await call("GET", "/saat/eski-adres-0");
    assert.equal(moved.status, 308);
    assert.ok(moved.headers.get("location").split(", ").every((l) => new URL(l, base).pathname === `/saat/${PRODUCTS[0].slug}`));
    assert.equal(await status("/saat/arsiv-eski"), 404, "the watch it led to is retired");
    assert.equal(await status("/saat/kopuk-eski"), 404, "the watch it led to does not exist");
    assert.equal(await status("/saat/arsiv-saat"), 404, "a retired watch's own address");
  });

  test("unknown addresses do not each query the database", async (t) => {
    const products = mock.catalogReads();
    const redirects = mock.redirectReads();
    const slugs = Array.from({ length: 10 }, unknownSlug);
    for (const slug of slugs) assert.equal(await status(`/saat/${slug}`), 404, slug);
    const firstPass = mock.redirectReads() - redirects;
    assert.ok(firstPass <= 1, `10 different unknown addresses read the redirects ${firstPass} times (at most once, to fill the cache)`);
    for (const slug of slugs) assert.equal(await status(`/saat/${slug}`), 404, slug);
    assert.equal(mock.redirectReads() - redirects, firstPass, "asking again reads nothing");
    assert.equal(mock.catalogReads(), products, "the catalogue is not read for them at all");
    t.diagnostic(`20 requests to 10 unknown addresses: redirect reads ${firstPass} (first pass) + 0 (repeat), catalogue reads 0`);
  });

  test("the pages show the database's catalogue, as with products.json", async () => {
    for (const p of [PRODUCTS[0], PRODUCTS[50], PRODUCTS[PRODUCTS.length - 1]]) {
      const res = await call("GET", `/saat/${p.slug}`);
      assert.equal(res.status, 200, p.slug);
      const html = await res.text();
      assert.ok(html.includes(p.model.replaceAll("&", "&amp;")), `${p.slug}: model shown`);
    }
    assert.equal(await status("/saat/yok-boyle-bir-saat"), 404, "an unknown address is still a 404");
    assert.equal(await status(`/saat/${NEW}`), 404, "the new watch does not exist yet");
  });

  test("refused, invalid and failed writes do not expire the cached catalogue", async () => {
    await browse();
    const reads = mock.catalogReads();
    // Signed out, a customer, another site, invalid data, a slug that is taken.
    assert.equal((await call("PUT", "/api/yonetim/urunler", { body: { product: newWatch() } })).status, 401);
    assert.equal((await call("PUT", "/api/yonetim/urunler", { who: "customer", body: { product: newWatch() } })).status, 403);
    assert.equal((await call("DELETE", `/api/yonetim/urunler?slug=${PRODUCTS[0].slug}`, { who: "customer" })).status, 403);
    assert.equal((await call("PUT", "/api/yonetim/urunler", { who: "admin", origin: "https://evil.example", body: { product: newWatch() } })).status, 403);
    assert.equal((await call("PUT", "/api/yonetim/urunler", { who: "admin", body: { product: { ...newWatch(), price: -5 } } })).status, 400);
    const taken = await call("PUT", "/api/yonetim/urunler", { who: "admin", body: { product: newWatch(PRODUCTS[1].slug), previous: PRODUCTS[0].slug } });
    assert.equal(taken.status, 400, "renaming onto a slug in use is refused by the database");
    assert.match((await taken.json()).error, /başka bir saat/);
    assert.equal((await call("DELETE", "/api/yonetim/urunler?slug=yok-boyle-bir-saat", { who: "admin" })).status, 400);
    await browse();
    const redirects = mock.redirectReads();
    assert.equal(await status(`/saat/${unknownSlug()}`), 404);
    assert.equal(mock.catalogReads(), reads, "no catalogue refresh after any of them");
    assert.equal(mock.redirectReads(), redirects, "and the cached redirects were not expired either");
    assert.equal(await status(`/saat/${NEW}`), 404);
    assert.equal(mock.products.find((p) => p.slug === PRODUCTS[0].slug).is_active, true, "nothing was retired");
  });

  test("an admin adds a watch: the cache is expired and the page opens without a new build", async () => {
    const reads = mock.catalogReads();
    const res = await call("PUT", "/api/yonetim/urunler", { who: "admin", body: { product: newWatch() } });
    assert.equal(res.status, 200, await res.text());
    const row = mock.products.find((p) => p.slug === NEW);
    assert.ok(row, "written to the database");
    assert.ok(row.position < 0, "a new watch goes to the top of the list");
    const page = await call("GET", `/saat/${NEW}`);
    assert.equal(page.status, 200);
    assert.ok((await page.text()).includes("Test Yeni Saat"));
    assert.ok(mock.catalogReads() > reads, "the catalogue was read again");
    const redirects = mock.redirectReads();
    assert.equal(await status(`/saat/${unknownSlug()}`), 404);
    assert.equal(mock.redirectReads(), redirects + 1, "the redirects were expired with it and read once again");
    assert.ok((await (await call("GET", "/sitemap.xml")).text()).includes(`/saat/${NEW}`), "and the sitemap lists it");
  });

  test("a slug change keeps the old address working", async () => {
    const res = await call("PUT", "/api/yonetim/urunler", { who: "admin", body: { product: newWatch(`${NEW}-2`), previous: NEW } });
    assert.equal(res.status, 200, await res.text());
    const old = await call("GET", `/saat/${NEW}`);
    assert.equal(old.status, 308);
    // Next sends the same Location twice when it first renders a redirect (fetch joins them
    // with ", "); every value must lead to the new address.
    const targets = old.headers.get("location").split(", ").map((l) => new URL(l, base).pathname);
    assert.ok(targets.length >= 1 && targets.every((t) => t === `/saat/${NEW}-2`), targets.join(" | "));
    assert.equal(new URL((await call("GET", `/saat/${NEW}`)).headers.get("location"), base).pathname, `/saat/${NEW}-2`, "and once cached, a single Location");
    assert.equal(await status(`/saat/${NEW}-2`), 200);
  });

  test("deleting retires the watch: its page is gone, the row stays", async () => {
    const res = await call("DELETE", `/api/yonetim/urunler?slug=${NEW}-2`, { who: "admin" });
    assert.equal(res.status, 200, await res.text());
    assert.equal(mock.products.find((p) => p.slug === `${NEW}-2`).is_active, false, "retired, not deleted");
    assert.equal(await status(`/saat/${NEW}-2`), 404);
    assert.equal(await status(`/saat/${NEW}`), 404, "the old address no longer leads to a retired watch");
  });

  test("the panel manages watches on the live site; file-editing pages stay development-only", async () => {
    assert.equal(await status("/yonetim", { who: "admin" }), 200);
    assert.equal(await status(`/yonetim/urunler/${PRODUCTS[0].slug}`, { who: "admin" }), 200);
    assert.equal(await status("/yonetim/urunler/yeni", { who: "admin" }), 200);
    assert.equal(await status("/yonetim/ayarlar", { who: "admin" }), 404);
    assert.equal(await status("/yonetim/donusler", { who: "admin" }), 404);
    assert.equal(await status("/yonetim", { who: "customer" }), 404);
    const upload = await call("PUT", "/api/yonetim/ayarlar", { who: "admin", body: {} });
    assert.equal(upload.status, 403, "settings are still saved only in development");
  });
});
