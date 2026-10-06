"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, supabaseConfigured } from "./config";

let client: SupabaseClient | null = null;

/**
 * The browser's Supabase client (one per tab). The session is kept in cookies,
 * so the server and the proxy see the same sign-in, and it survives reloads;
 * the client refreshes the access token on its own.
 */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
