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
 * The addresses a request was sent to, as the browser saw them: the host it
 * asked for (X-Forwarded-Host behind a proxy, else Host) with the scheme it
 * used, and the request URL itself. On `next start` the request URL names the
 * server (localhost), not the site, so the Host header is what tells us which
 * address the visitor's page is on. A page on another site cannot change it:
 * the browser sets Host to this site, and a cross-site request with a header
 * of its own needs a CORS preflight this site never grants.
 */
export function requestOrigins(url: string, headers: { get(name: string): string | null }): string[] {
  const own = new URL(url);
  const host = headers.get("x-forwarded-host")?.split(",")[0].trim() || headers.get("host");
  const proto = headers.get("x-forwarded-proto")?.split(",")[0].trim() || own.protocol.replace(":", "");
  const list = [own.origin];
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host) && (proto === "http" || proto === "https")) list.push(`${proto}://${host}`);
  return list;
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
