// Cross-site check for the admin API (src/lib/admin/origin.ts).
// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOriginRequest, originOf, requestOrigins } from "../../src/lib/admin/origin.ts";

const SITE = ["http://localhost:3000", "https://furkansaat.com"];

test("originOf keeps scheme, host and port only", () => {
  assert.equal(originOf("https://furkansaat.com/yonetim?x=1"), "https://furkansaat.com");
  assert.equal(originOf("http://localhost:3000"), "http://localhost:3000");
  assert.equal(originOf("javascript:alert(1)"), null);
  assert.equal(originOf("not a url"), null);
  assert.equal(originOf(""), null);
  assert.equal(originOf(null), null);
});

test("requests from the site's own pages are allowed", () => {
  for (const method of ["PUT", "POST", "DELETE", "PATCH", "put"])
    assert.equal(isSameOriginRequest(method, "https://furkansaat.com", SITE), true, method);
  assert.equal(isSameOriginRequest("PUT", "http://localhost:3000", SITE), true);
});

test("requests from other sites are refused", () => {
  for (const origin of [
    "https://evil.example",
    "https://furkansaat.com.evil.example",
    "https://evil.furkansaat.com",
    "http://furkansaat.com", // other scheme
    "https://furkansaat.com:8443", // other port
    "http://localhost:3001",
    "null", // sandboxed iframe, file://
  ])
    assert.equal(isSameOriginRequest("PUT", origin, SITE), false, origin);
});

test("a changing request without Origin is refused", () => {
  assert.equal(isSameOriginRequest("POST", null, SITE), false);
  assert.equal(isSameOriginRequest("DELETE", "", SITE), false);
});

test("safe methods are not blocked", () => {
  for (const method of ["GET", "HEAD", "OPTIONS"]) assert.equal(isSameOriginRequest(method, null, SITE), true, method);
});

test("unset allowed origins never match", () => {
  assert.equal(isSameOriginRequest("PUT", "https://furkansaat.com", [undefined, null, ""]), false);
});

const headers = (h) => ({ get: (name) => h[name.toLowerCase()] ?? null });

test("requestOrigins: the address the browser used, from Host or X-Forwarded-Host", () => {
  // next start: the request URL names the server, the Host header the site.
  assert.deepStrictEqual(requestOrigins("http://localhost:3000/api/x", headers({ host: "127.0.0.1:3000" })), [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  // Behind a proxy or on a host such as Vercel: the forwarded host and scheme.
  assert.deepStrictEqual(
    requestOrigins("http://localhost:3000/api/x", headers({ host: "internal:3000", "x-forwarded-host": "www.furkansaat.com", "x-forwarded-proto": "https" })),
    ["http://localhost:3000", "https://www.furkansaat.com"],
  );
  assert.deepStrictEqual(
    requestOrigins("http://localhost:3000/api/x", headers({ "x-forwarded-host": "furkansaat.com, proxy.internal", "x-forwarded-proto": "https,http" })),
    ["http://localhost:3000", "https://furkansaat.com"],
    "the first (client-facing) value of a forwarded list",
  );
});

test("requestOrigins ignores malformed host and scheme values", () => {
  for (const h of [{ host: "evil.example/path" }, { host: "a b" }, { host: "x.com", "x-forwarded-proto": "javascript" }, {}])
    assert.deepStrictEqual(requestOrigins("http://localhost:3000/api/x", headers(h)), ["http://localhost:3000"], JSON.stringify(h));
});

test("a page on another site is still refused when the Host is this site's", () => {
  const allowed = requestOrigins("http://localhost:3000/api/x", headers({ host: "furkansaat.com", "x-forwarded-proto": "https" }));
  assert.equal(isSameOriginRequest("PUT", "https://furkansaat.com", allowed), true);
  assert.equal(isSameOriginRequest("PUT", "https://www.furkansaat.com", allowed), false, "www is another origin unless the request went there");
  assert.equal(isSameOriginRequest("PUT", "https://evil.example", allowed), false);
  assert.equal(isSameOriginRequest("PUT", null, allowed), false);
});
