// A stand-in for the Supabase calls the site makes, for local tests only
// (localhost, fake keys, no real project):
//   GET  /auth/v1/user          — what getClaims() falls back to for HS256 tokens:
//                                 only tokens this server issued are valid, so a
//                                 token with a forged signature is refused
//   POST /rest/v1/rpc/is_admin  — answered from the token's user, as the
//                                 database's public.is_admin() does with auth.uid()
// With `catalog` rows, also the parts of the REST API the catalogue uses, with
// the database's rules (Row Level Security, unique slugs, slug redirects):
//   GET   /rest/v1/products, /rest/v1/product_slug_redirects
//   PATCH /rest/v1/products (update), POST /rest/v1/products (insert)
//   Storage, bucket product-images, with the migration's policies and bucket
//   settings: POST /storage/v1/object/product-images/<name> (admins only, the
//   panel's names under watches/, 15 MB, photo types, no overwrite),
//   DELETE /storage/v1/object/product-images (admins only),
//   GET /storage/v1/object/public/product-images/<name> (anyone)
// It mimics PostgREST closely enough for these tests; it is not Supabase, and
// passing these tests does not show that a real project behaves the same way.
// REST requests must carry the project key in `apikey`. A new-format key
// (sb_publishable_…, sb_secret_…) sent as the Bearer token is refused: stricter
// than @supabase/supabase-js (which sends it for REST), so the tests show the
// site never does. An older JWT-format anon key may be sent as the Bearer token.
import { createServer } from "node:http";
import { randomBytes, randomUUID } from "node:crypto";

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

export function startMockSupabase({ catalog = null, publishableKey = "test-publishable-key", port = 0 } = {}) {
  const users = new Map(); // token → { user, admin }
  const calls = []; // { method, path, token }
  const products = catalog ? catalog.map((r) => ({ id: randomUUID(), ...structuredClone(r) })) : [];
  const redirects = new Map(); // old slug → product id
  const objects = new Map(); // Storage object name → { bytes, type }
  // Reads to fail on purpose ("products", "redirects"): a database or network error.
  const failing = new Set();
  // A truncated list, as with the REST API's row limit: [table, max rows].
  let rowLimit = null;

  // Like the policies: everyone sees active watches, admins see all.
  const visible = (role) => products.filter((p) => role === "admin" || p.is_active);

  function query(rows, params) {
    let out = rows;
    for (const [key, value] of params) {
      if (["select", "order", "limit", "columns"].includes(key)) continue;
      const cs = /^cs\.\{(.*)\}$/.exec(value);
      if (cs) {
        // An array column containing every listed value (postgrest-js .contains(col, [..])).
        const wanted = cs[1].split(",").map((v) => v.replace(/^"|"$/g, ""));
        out = out.filter((r) => Array.isArray(r[key]) && wanted.every((v) => r[key].includes(v)));
        continue;
      }
      const m = /^eq\.(.*)$/.exec(value);
      if (!m) throw new Error(`mock: unsupported filter ${key}=${value}`);
      out = out.filter((r) => String(r[key]) === m[1]);
    }
    const order = params.get("order");
    if (order)
      out = [...out].sort((a, b) => {
        for (const part of order.split(",")) {
          const [col, dir] = part.split(".");
          const cmp = a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0;
          if (cmp) return dir === "desc" ? -cmp : cmp;
        }
        return 0;
      });
    if (params.get("limit")) out = out.slice(0, Number(params.get("limit")));
    return out;
  }
  const project = (rows, params) => {
    const select = params.get("select");
    if (!select || select === "*") return rows;
    const cols = select.split(",");
    return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
  };

  const server = createServer((req, res) => {
    const token = (req.headers.authorization ?? "").replace(/^Bearer /, "");
    const known = users.get(token);
    const url = new URL(req.url, "http://mock");
    const path = url.pathname;
    calls.push({ method: req.method, path, token, anon: !known });
    const send = (status, body, total) => {
      const headers = { "content-type": "application/json" };
      // As PostgREST with Prefer: count=exact.
      if (total !== undefined) headers["content-range"] = total ? `0-${body.length - 1}/${total}` : "*/0";
      res.writeHead(status, headers);
      res.end(JSON.stringify(body));
    };
    const list = (table, rows) => {
      const limited = rowLimit?.[0] === table ? rows.slice(0, rowLimit[1]) : rows;
      return send(200, limited, /count=exact/.test(req.headers.prefer ?? "") ? rows.length : undefined);
    };
    const chunks = [];
    req.on("data", (d) => chunks.push(d));
    req.on("end", () => {
      const rawBytes = Buffer.concat(chunks);
      const raw = rawBytes.toString("utf8");
      const BUCKET = "/storage/v1/object/product-images";
      if (path.startsWith("/storage/v1/object/public/product-images/") && req.method === "GET") {
        const o = objects.get(decodeURIComponent(path.slice("/storage/v1/object/public/product-images/".length)));
        if (!o) return send(400, { statusCode: "404", error: "not_found", message: "Object not found" });
        res.writeHead(200, { "content-type": o.type });
        return res.end(o.bytes);
      }
      if (path === BUCKET || path.startsWith(`${BUCKET}/`)) {
        if (req.headers.apikey !== publishableKey) return send(401, { message: "Invalid API key" });
        // An internal error whose details must not reach the panel.
        if (failing.has("storage")) return send(500, { statusCode: "500", error: "internal", message: "db host 10.0.0.7 timeout (secret detail)" });
        const admin = known?.admin === true;
        if (req.method === "POST") {
          const name = decodeURIComponent(path.slice(BUCKET.length + 1));
          // The insert policy (20261027150000_product_images_policy.sql): admins, the panel's names only.
          if (!admin || !/^watches\/[a-z0-9]+(-[a-z0-9]+)*\.(webp|jpg|png|avif)$/.test(name))
            return send(400, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" });
          // The bucket's settings: 15 MB, photo types.
          if (rawBytes.length > 15 * 1024 * 1024) return send(413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
          if (!["image/webp", "image/jpeg", "image/png", "image/avif"].includes(req.headers["content-type"]))
            return send(415, { statusCode: "415", error: "invalid_mime_type", message: "mime type not supported" });
          if (objects.has(name) && req.headers["x-upsert"] !== "true") return send(409, { statusCode: "409", error: "Duplicate", message: "The resource already exists" });
          objects.set(name, { bytes: rawBytes, type: req.headers["content-type"] });
          return send(200, { Key: `product-images/${name}`, Id: randomUUID() });
        }
        if (req.method === "DELETE" && path === BUCKET) {
          // Policies hide other users' objects: a non-admin deletes nothing, without an error.
          const removed = (JSON.parse(raw || "{}").prefixes ?? []).filter((n) => admin && objects.delete(n));
          return send(200, removed.map((name) => ({ name, bucket_id: "product-images" })));
        }
        return send(404, { message: "not mocked" });
      }
      if (req.method === "GET" && path === "/auth/v1/user") {
        return known ? send(200, known.user) : send(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
      }
      if (req.method === "POST" && path === "/rest/v1/rpc/is_admin") {
        // Like PostgREST: without a user's token the call runs as anon, which may not execute is_admin.
        if (!known) return send(401, { code: "42501", message: "permission denied for function is_admin" });
        return send(200, known.admin);
      }
      if (!catalog) return send(404, { message: "not mocked" });

      if (req.headers.apikey !== publishableKey) return send(401, { message: "Invalid API key" });
      if (/^sb_(publishable|secret)_/.test(token)) return send(401, { code: "PGRST301", message: "Expected a JWT as the Bearer token" });
      // A user's token, or anonymous: no Authorization, or an older JWT-format anon key.
      if (!known && token && token !== publishableKey) return send(401, { code: "PGRST301", message: "JWT invalid" });
      const role = known?.admin ? "admin" : known ? "authenticated" : "anon";
      const params = url.searchParams;
      const body = raw ? JSON.parse(raw) : null;

      if (path === "/rest/v1/products" && req.method === "GET") {
        if (failing.has("products")) return send(503, { message: "upstream unavailable" });
        return list("products", project(query(visible(role), params), params));
      }

      if (path === "/rest/v1/product_slug_redirects" && req.method === "GET") {
        if (failing.has("redirects")) return send(503, { message: "upstream unavailable" });
        // The embedded product, as RLS lets this role see it (null when hidden or missing).
        const rows = [...redirects].map(([old_slug, id]) => {
          const p = visible(role).find((x) => x.id === id);
          return { old_slug, products: p ? { slug: p.slug, is_active: p.is_active } : null };
        });
        const old = /^eq\.(.*)$/.exec(params.get("old_slug") ?? "")?.[1];
        return list("product_slug_redirects", old === undefined ? rows : rows.filter((r) => r.old_slug === old));
      }

      if (path === "/rest/v1/products" && req.method === "PATCH") {
        if (role !== "admin") return send(200, []); // RLS: no row is visible for update
        const targets = query(products, params);
        if (body.slug !== undefined && products.some((p) => p.slug === body.slug && !targets.includes(p)))
          return send(409, { code: "23505", message: "duplicate key value violates unique constraint" });
        for (const p of targets) {
          if (body.slug !== undefined && body.slug !== p.slug) redirects.set(p.slug, p.id);
          Object.assign(p, body);
          redirects.delete(p.slug);
        }
        return send(200, project(targets, params));
      }

      if (path === "/rest/v1/products" && req.method === "POST") {
        if (role !== "admin") return send(403, { code: "42501", message: "new row violates row-level security policy" });
        const rows = Array.isArray(body) ? body : [body];
        if (rows.some((r) => products.some((p) => p.slug === r.slug)))
          return send(409, { code: "23505", message: "duplicate key value violates unique constraint" });
        const added = rows.map((r) => ({ id: randomUUID(), is_active: true, stock: 0, ...r }));
        products.push(...added);
        added.forEach((p) => redirects.delete(p.slug));
        return send(201, project(added, params));
      }

      send(404, { message: "not mocked" });
    });
  });

  /** A signed-in user: their access token and the session cookie value @supabase/ssr reads. */
  function addUser({ id, email, admin = false, userMetadata = {}, register = true }) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const claims = { sub: id, email, role: "authenticated", aud: "authenticated", exp, user_metadata: userMetadata };
    const token = `${b64url({ alg: "HS256", typ: "JWT" })}.${b64url(claims)}.${randomBytes(32).toString("base64url")}`;
    const user = { id, email, aud: "authenticated", role: "authenticated", user_metadata: userMetadata, app_metadata: {} };
    if (register) users.set(token, { user, admin });
    const session = { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "test-refresh", user };
    return { token, cookie: `base64-${b64url(session)}` };
  }

  /** How many times the site read the public catalogue (anonymous reads of the products list). */
  const catalogReads = () => calls.filter((c) => c.method === "GET" && c.path === "/rest/v1/products" && c.anon).length;
  /** How many times the site read the slug redirects. */
  const redirectReads = () => calls.filter((c) => c.method === "GET" && c.path === "/rest/v1/product_slug_redirects").length;

  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () =>
      resolve({
        port: server.address().port,
        addUser,
        calls,
        products,
        redirects,
        objects,
        failing,
        limitRows: (table, max) => (rowLimit = table ? [table, max] : null),
        catalogReads,
        redirectReads,
        close: () => new Promise((r) => server.close(r)),
      }),
    ),
  );
}
