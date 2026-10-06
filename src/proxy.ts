import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { loginPath, safeNext } from "@/lib/auth/redirect";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/config";

/**
 * Runs before the account pages: refreshes the Supabase session cookies and
 * keeps the doors right —
 *   /hesap/*        only signed in (else to /giris?next=…, back here afterwards)
 *   /giris          signed-in visitors go straight on to their account
 *   /sifre-yenile   only with the session a password-reset link opens
 * The pages check again on the server; the database's RLS is the final word.
 */
export async function proxy(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Verifies the token (and refreshes it when it has expired).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  const redirect = (path: string) => {
    const to = NextResponse.redirect(new URL(path, request.url));
    // Keep any refreshed session cookies.
    response.cookies.getAll().forEach((c) => to.cookies.set(c));
    return to;
  };

  if (pathname.startsWith("/hesap") && !signedIn) return redirect(loginPath(pathname + search));
  if (pathname === "/giris" && signedIn) return redirect(safeNext(request.nextUrl.searchParams.get("next")));
  if (pathname === "/sifre-yenile" && !signedIn) return redirect("/sifremi-unuttum?hata=baglanti");

  return response;
}

export const config = {
  matcher: ["/hesap", "/hesap/:path*", "/giris", "/sifre-yenile"],
};
