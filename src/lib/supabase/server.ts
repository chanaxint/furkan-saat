import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

/** A Supabase client for Server Components and Route Handlers, acting as the signed-in visitor. */
export async function getServerSupabase() {
  // Read the request's cookies first, so pages using this always render per request.
  const store = await cookies();
  if (!supabaseConfigured) return null;
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, where cookies are read-only; the proxy refreshes them.
        }
      },
    },
  });
}

/** The verified id of the signed-in visitor (JWT checked), or null. */
export async function getUserId() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
}
