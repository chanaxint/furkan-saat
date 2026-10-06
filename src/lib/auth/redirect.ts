/**
 * Where to send the visitor after signing in. Only paths on this site are
 * accepted ("/hesap/adresler"), never another host ("//evil.com", "https://…"),
 * so the ?next= parameter cannot be used as an open redirect.
 */
export function safeNext(value: string | null | undefined, fallback = "/hesap") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  try {
    const url = new URL(value, "https://furkansaat.local");
    if (url.host !== "furkansaat.local") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** The sign-in page, remembering where the visitor wanted to go. */
export const loginPath = (next?: string, extra?: Record<string, string>) => {
  const params = new URLSearchParams(extra);
  if (next && next !== "/hesap") params.set("next", next);
  const q = params.toString();
  return q ? `/giris?${q}` : "/giris";
};
