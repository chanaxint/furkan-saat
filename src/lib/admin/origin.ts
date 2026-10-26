/**
 * Cross-site request check for the admin API. The panel signs in with cookies,
 * so a page on another site could make the browser send them along; a request
 * that changes something must therefore come from this site's own pages.
 * Browsers always set `Origin` on such requests (fetch with PUT, POST, DELETE).
 *
 * Plain functions with no imports, so `node --test` can check them directly.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** "https://furkansaat.com/x" → "https://furkansaat.com"; anything unparsable → null. */
export function originOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * True when a request may go on: safe methods always; otherwise only with an
 * `Origin` header equal to one of the allowed origins (the request's own, and
 * the configured site address). A missing or "null" Origin is refused.
 */
export function isSameOriginRequest(method: string, origin: string | null, allowed: (string | null | undefined)[]) {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  const from = origin === "null" ? null : originOf(origin);
  if (!from) return false;
  return allowed.some((a) => originOf(a) === from);
}
