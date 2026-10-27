// End-to-end checks of the admin guard: the real Next.js server (dev, or a
// production build with ADMIN_HTTP_MODE=prod) against a local stand-in for
// Supabase. Four kinds of request for every admin page and API route: signed
// out, a customer, a foreign Origin, and an admin. Nothing is written: admin
// requests carry invalid data, so they stop at validation (400) — and the data
// files are compared before and after.
//   npm run test:admin-http        (dev)
//   npm run test:admin-http:prod   (next build + next start)
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { startMockSupabase } from "./mock-supabase.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MODE = process.env.ADMIN_HTTP_MODE === "prod" ? "prod" : "dev";
const NEXT = path.join(ROOT, "node_modules/next/dist/bin/next");

const freePort = () =>
  new Promise((resolve) => {
    const s = createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

/** Fingerprint of the editable data files, to prove the tests changed nothing. */
const dataFingerprint = () => {
  const dir = path.join(ROOT, "src/lib/data");
  const h = createHash("sha256");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) h.update(f).update(readFileSync(path.join(dir, f)));
  return h.digest("hex");
};

let mock, base, server, cookieName, users, before_;
const log = [];

before(async () => {
  before_ = dataFingerprint();
  mock = await startMockSupabase();
  const supabaseUrl = `http://localhost:${mock.port}`;
  cookieName = "sb-localhost-auth-token";
  users = {
    admin: mock.addUser({ id: "cccccccc-0000-0000-0000-000000000003", email: "ayse@example.com", admin: true }),
    customer: mock.addUser({ id: "dddddddd-0000-0000-0000-000000000004", email: "can@example.com" }),
    // A customer who wrote "admin" into their own user_metadata.
    metaAdmin: mock.addUser({ id: "eeeeeeee-0000-0000-0000-000000000005", email: "eda@example.com", userMetadata: { role: "admin" } }),
    // The admin's user id in a token Supabase never issued (forged signature).
    forged: mock.addUser({ id: "cccccccc-0000-0000-0000-000000000003", email: "ayse@example.com", register: false }),
  };

  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  // Fake, public test values only; no real project, no service role key.
  const env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    NEXT_PUBLIC_SITE_URL: base,
    NEXT_TELEMETRY_DISABLED: "1",
    NO_PROXY: "localhost,127.0.0.1",
    no_proxy: "localhost,127.0.0.1",
  };
  delete env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete env.SUPABASE_SERVICE_ROLE_KEY;

  if (MODE === "prod") {
    const build = spawnSync(process.execPath, [NEXT, "build"], { cwd: ROOT, env: { ...env, NODE_ENV: "production" }, encoding: "utf8" });
    if (build.status !== 0) throw new Error(`next build failed:\n${build.stdout}\n${build.stderr}`);
  }
  const args = MODE === "prod" ? ["start", "-H", "127.0.0.1", "-p", String(port)] : ["dev", "-H", "127.0.0.1", "-p", String(port)];
  server = spawn(process.execPath, [NEXT, ...args], {
    cwd: ROOT,
    env: { ...env, NODE_ENV: MODE === "prod" ? "production" : "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });
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
  assert.equal(dataFingerprint(), before_, "the data files (src/lib/data/*.json) were not changed by the tests");
});

/** A request as `who` (signed out when null), from `origin` (the site itself by default; null = no Origin header). */
function call(method, pathname, { who = null, origin = base, body, rsc = false } = {}) {
  const headers = {};
  if (who) headers.cookie = `${cookieName}=${users[who].cookie}`;
  if (origin) headers.origin = origin;
  if (rsc) headers.rsc = "1";
  if (body !== undefined && !(body instanceof FormData)) headers["content-type"] = "application/json";
  return fetch(`${base}${pathname}`, {
    method,
    headers,
    redirect: "manual",
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });
}

/** Where a redirect leads, as path + query (the proxy sends absolute URLs, pages relative ones). */
const target = (res) => {
  const url = new URL(res.headers.get("location"), base);
  assert.equal(url.origin, new URL(base).origin, "redirects stay on this site");
  return url.pathname + url.search;
};

/**
 * Text only the panel shows: its page titles, the stock page's note, a bank field.
 * (Product slugs are not a sign: the public catalogue is on every page, for the cart and search.)
 */
const PANEL_DATA = /Saatler ve stok|İletişim ve banka|3D dönüşler|Yeni saat|burada hemen kaydedilir|"iban"/;

/** A client-side move inside the panel: an RSC request, following Next's ?_rsc= redirect like the browser does. */
async function rsc(page, who) {
  let res = await call("GET", page, { who, rsc: true });
  if (res.status === 307 && target(res).startsWith(`${page}?_rsc`)) res = await call("GET", target(res), { who, rsc: true });
  return res;
}

const form = () => {
  const f = new FormData();
  f.append("name", "test"); // no file: validation refuses it before anything is saved
  return f;
};

/** Every admin API route, each with a body its validation rejects. */
const ROUTES = [
  { method: "PUT", path: "/api/yonetim/urunler", body: () => ({ product: {} }) },
  { method: "DELETE", path: "/api/yonetim/urunler", body: () => undefined }, // no ?slug=
  { method: "POST", path: "/api/yonetim/gorsel", body: form },
  { method: "DELETE", path: "/api/yonetim/gorsel", body: () => undefined }, // products.json mode: nothing to delete
  { method: "PUT", path: "/api/yonetim/ayarlar", body: () => ({}) },
  { method: "PUT", path: "/api/yonetim/donusler", body: () => ({ slug: "x", motion: {} }) },
];

const ADMIN_PAGES = ["/yonetim", "/yonetim/ayarlar", "/yonetim/donusler", "/yonetim/urunler/yeni"];

describe(`admin API (${MODE})`, () => {
  for (const r of ROUTES) {
    const name = `${r.method} ${r.path}`;
    test(`${name}: signed out → 401`, async () => {
      const res = await call(r.method, r.path, { body: r.body() });
      assert.equal(res.status, 401);
    });
    test(`${name}: customer → 403`, async () => {
      const res = await call(r.method, r.path, { who: "customer", body: r.body() });
      assert.equal(res.status, 403);
      assert.match((await res.json()).error, /yetkiniz yok/);
    });
    test(`${name}: customer with role "admin" in user_metadata → 403`, async () => {
      assert.equal((await call(r.method, r.path, { who: "metaAdmin", body: r.body() })).status, 403);
    });
    test(`${name}: forged admin token → 401`, async () => {
      assert.equal((await call(r.method, r.path, { who: "forged", body: r.body() })).status, 401);
    });
    test(`${name}: admin from another site → 403`, async () => {
      const res = await call(r.method, r.path, { who: "admin", origin: "https://evil.example", body: r.body() });
      assert.equal(res.status, 403);
      assert.match((await res.json()).error, /kendi sayfalarından/);
    });
    test(`${name}: admin without Origin → 403`, async () => {
      assert.equal((await call(r.method, r.path, { who: "admin", origin: null, body: r.body() })).status, 403);
    });
    test(`${name}: customer from another site → 403 (refused before the session is looked at)`, async () => {
      assert.equal((await call(r.method, r.path, { who: "customer", origin: "https://evil.example", body: r.body() })).status, 403);
    });
    if (MODE === "dev")
      test(`${name}: admin → passes the guard (stops at validation, 400)`, async () => {
        const res = await call(r.method, r.path, { who: "admin", body: r.body() });
        assert.equal(res.status, 400, await res.text());
      });
    else
      test(`${name}: admin → 403, the files cannot be edited on a production build`, async () => {
        const res = await call(r.method, r.path, { who: "admin", body: r.body() });
        assert.equal(res.status, 403);
        assert.match((await res.json()).error, /geliştirme modunda/);
      });
  }

  test("is_admin is asked with the visitor's own token, never another key", () => {
    const rpc = mock.calls.filter((c) => c.path === "/rest/v1/rpc/is_admin");
    assert.ok(rpc.length > 0);
    const issued = new Set(Object.values(users).map((u) => u.token));
    for (const c of rpc) assert.ok(issued.has(c.token), "rpc called with a user's access token");
  });
});

if (MODE === "dev")
  describe("watch photographs, products.json mode (dev)", () => {
    // As before Storage: in development the panel saves photographs to the project's files.
    const photo = (data, fileName, type) => {
      const f = new FormData();
      f.append("name", "Test HTTP Görsel");
      f.append("file", new Blob([data], { type }), fileName);
      return f;
    };
    const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(512, 1)]);
    test("an admin uploads to public/assets/images/watches; no Storage request", async () => {
      const storage = () => mock.calls.filter((c) => c.path.startsWith("/storage/")).length;
      const before = storage();
      const res = await call("POST", "/api/yonetim/gorsel", { who: "admin", body: photo(PNG, "../../x.png", "image/png") });
      assert.equal(res.status, 200, await res.clone().text());
      const { path: src, object } = await res.json();
      try {
        assert.match(src, /^\/assets\/images\/watches\/test-http-gorsel-[a-z0-9]+\.png$/);
        assert.equal(object, undefined);
        assert.ok(readFileSync(path.join(ROOT, "public", src)).equals(PNG));
        assert.equal(storage(), before);
      } finally {
        rmSync(path.join(ROOT, "public", src), { force: true });
      }
    });
    test("SVG and disguised files are refused", async () => {
      const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
      for (const [data, name, type] of [[svg, "a.svg", "image/svg+xml"], [svg, "a.png", "image/png"], [PNG, "a.jpg", "image/jpeg"]]) {
        const res = await call("POST", "/api/yonetim/gorsel", { who: "admin", body: photo(data, name, type) });
        assert.equal(res.status, 400, name);
      }
    });
  });

describe(`admin pages (${MODE})`, () => {
  for (const page of ADMIN_PAGES) {
    test(`${page}: signed out → to the sign-in page, and back afterwards`, async () => {
      const res = await call("GET", page);
      assert.equal(res.status, 307);
      assert.equal(target(res), `/giris?next=${encodeURIComponent(page)}`);
    });
    test(`${page}: customer → 404`, async () => {
      const res = await call("GET", page, { who: "customer" });
      assert.equal(res.status, 404);
    });
    test(`${page}: customer with role "admin" in user_metadata → 404`, async () => {
      assert.equal((await call("GET", page, { who: "metaAdmin" })).status, 404);
    });
    test(`${page}: customer moving inside the panel (RSC request) → not-found payload, no panel data`, async () => {
      const res = await rsc(page, "customer");
      // An RSC response carries notFound() in its payload (HTTP 200 or 404), not always as a 404 status.
      assert.ok([200, 404].includes(res.status), `status ${res.status}`);
      const text = await res.text();
      assert.match(text, /NEXT_HTTP_ERROR_FALLBACK;404/);
      assert.doesNotMatch(text, PANEL_DATA);
    });
    if (MODE === "dev")
      test(`${page}: admin moving inside the panel (RSC request) → the panel (control for the check above)`, async () => {
        const res = await rsc(page, "admin");
        const text = await res.text();
        assert.doesNotMatch(text, /NEXT_HTTP_ERROR_FALLBACK;404/);
        assert.match(text, PANEL_DATA);
      });
    if (MODE === "dev")
      test(`${page}: admin → 200`, async () => {
        const res = await call("GET", page, { who: "admin" });
        assert.equal(res.status, 200);
        assert.match(await res.text(), /Furkan <em>Saat<\/em> · Yönetim|Yönetim/);
      });
    else
      test(`${page}: admin → 404 on a production build (files not editable)`, async () => {
        assert.equal((await call("GET", page, { who: "admin" })).status, 404);
      });
  }
});

if (MODE === "prod")
  describe("browser bundle (prod)", () => {
    // The browser gets the catalogue from the server (CatalogProvider), never from a bundled
    // products.json: otherwise, once the database is the source, the cart and search would
    // show an outdated catalogue.
    test("no catalogue data in the browser's JavaScript", () => {
      const products = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/products.json"), "utf8"));
      const marks = [products[0].description, products[products.length - 1].description, products[1].slug];
      const files = [];
      const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true }))
          e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".js") && files.push(path.join(dir, e.name));
      };
      walk(path.join(ROOT, ".next/static"));
      assert.ok(files.length > 0);
      for (const f of files) {
        const js = readFileSync(f, "utf8");
        for (const m of marks) assert.ok(!js.includes(m), `${path.relative(ROOT, f)} contains catalogue data`);
      }
    });
    test("the pages still carry the catalogue for the cart and search", async () => {
      const products = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/products.json"), "utf8"));
      const html = await (await call("GET", "/hakkimizda")).text();
      assert.ok(html.includes(products[products.length - 1].slug), "the last watch is in the page's catalogue");
    });
  });

describe(`customer pages still work (${MODE})`, () => {
  test("/hesap signed out → to the sign-in page", async () => {
    const res = await call("GET", "/hesap");
    assert.equal(res.status, 307);
    assert.equal(target(res), "/giris");
  });
  test("/hesap as a customer → 200", async () => {
    assert.equal((await call("GET", "/hesap", { who: "customer" })).status, 200);
  });
  test("/giris signed out → 200", async () => {
    assert.equal((await call("GET", "/giris")).status, 200);
  });
  test("/giris?next=/yonetim as the admin → straight back to the panel", async () => {
    const res = await call("GET", "/giris?next=%2Fyonetim", { who: "admin" });
    assert.equal(res.status, 307);
    assert.equal(target(res), "/yonetim");
  });
  test("an unknown watch address → 404, without asking the database (products.json mode)", async () => {
    const rest = () => mock.calls.filter((c) => c.path.startsWith("/rest/v1/") && c.path !== "/rest/v1/rpc/is_admin").length;
    const before = rest();
    for (const slug of ["yok-boyle-bir-saat", "baska-bir-yok-saat"]) assert.equal((await call("GET", `/saat/${slug}`)).status, 404, slug);
    assert.equal(rest(), before, "no REST request for the catalogue or redirects");
  });
  test("home page and a watch page → 200", async () => {
    assert.equal((await call("GET", "/")).status, 200);
    const slug = JSON.parse(readFileSync(path.join(ROOT, "src/lib/data/products.json"), "utf8"))[0].slug;
    assert.equal((await call("GET", `/saat/${slug}`)).status, 200);
  });
});
