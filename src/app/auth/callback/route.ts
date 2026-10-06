import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/redirect";
import { getServerSupabase } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Where links from Supabase land: e-mail confirmation, password reset, and
 * (later) OAuth sign-in such as Google. Two link styles are accepted:
 *   ?token_hash=…&type=…  (recommended e-mail templates; works on any device)
 *   ?code=…               (PKCE: default templates and OAuth providers)
 * On success the session cookie is set and the visitor goes on to `next`.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const recovery = type === "recovery";
  const next = safeNext(url.searchParams.get("next"), recovery ? "/sifre-yenile" : "/hesap");
  const fail = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const supabase = await getServerSupabase();
  if (!supabase) return fail("/giris");

  let ok = false;
  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  if (!ok) return fail(recovery || next === "/sifre-yenile" ? "/sifremi-unuttum?hata=baglanti" : "/giris?hata=baglanti");
  // A confirmed e-mail is welcomed on the account page.
  const welcome = type === "signup" || type === "email" ? `${next}${next.includes("?") ? "&" : "?"}dogrulandi=1` : next;
  return NextResponse.redirect(new URL(welcome, request.url));
}
