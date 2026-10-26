import "server-only";

import { notFound, redirect } from "next/navigation";
import { loginPath } from "@/lib/auth/redirect";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * Who may use the management panel. The visitor's session is verified with
 * Supabase (getClaims checks the token), then the database decides with
 * public.is_admin(), which looks only at the verified user id and the
 * admin_users table — never at user_metadata or anything the browser sends.
 * No service role key is involved.
 */

export type AdminCheck = { ok: true; userId: string } | { ok: false; status: 401 | 403 };

export async function checkAdmin(): Promise<AdminCheck> {
  const supabase = await getServerSupabase();
  // Without Supabase there is no way to verify anyone: nobody is an admin.
  if (!supabase) return { ok: false, status: 401 };
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (error || !userId) return { ok: false, status: 401 };
  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) return { ok: false, status: 403 };
  return { ok: true, userId };
}

/**
 * For the panel's layout and pages: signed-out visitors go to the sign-in page
 * (and come back afterwards); signed-in non-admins get a plain 404, so the panel
 * does not reveal itself. Called in every page, not only the layout, because a
 * layout is not re-run when moving between pages inside it.
 */
export async function requireAdmin(path = "/yonetim") {
  const check = await checkAdmin();
  if (check.ok) return check.userId;
  if (check.status === 401) redirect(loginPath(path));
  notFound();
}
