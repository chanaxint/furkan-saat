/**
 * Supabase connection settings. Only the project URL and the publishable
 * (anon) key are read here: both are public by design, and Row Level Security
 * in the database decides what each request may touch. The service role key is
 * never read by this app's browser or proxy code.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False until the environment variables are set: membership screens then say so instead of failing. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Where e-mail links lead back to: the site's own address (falls back to the current origin in the browser). */
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return typeof window === "undefined" ? "" : window.location.origin;
}
