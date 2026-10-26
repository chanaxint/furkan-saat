// Cross-site check for the admin API (src/lib/admin/origin.ts).
// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import assert from "node:assert/strict";
import { test } from "node:test";
import { isSameOriginRequest, originOf } from "../../src/lib/admin/origin.ts";

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
