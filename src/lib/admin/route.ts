import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/supabase/config";
import { checkAdmin } from "./auth";
import { isSameOriginRequest } from "./origin";
import { InvalidInput, isFileEditingEnabled } from "./store";

const refuse = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Wraps an admin route handler. In order: the request must come from this
 * site's own pages (Origin), the visitor must be a signed-in admin (checked
 * with Supabase and the database), and — while the data still lives in the
 * project's files — the site must be running in development. Validation errors
 * become a readable 400 response.
 */
export function adminRoute(handler: (request: Request) => Promise<unknown>) {
  return async (request: Request) => {
    if (!isSameOriginRequest(request.method, request.headers.get("origin"), [new URL(request.url).origin, siteUrl()]))
      return refuse("Bu istek sitenin kendi sayfalarından gelmedi.", 403);

    const admin = await checkAdmin();
    if (!admin.ok)
      return admin.status === 401
        ? refuse("Bu işlem için yönetici olarak giriş yapın.", 401)
        : refuse("Bu işlem için yetkiniz yok.", 403);

    if (!isFileEditingEnabled())
      return refuse("Bu bölüm şimdilik yalnızca geliştirme modunda (npm run dev) kaydeder.", 403);

    try {
      return NextResponse.json({ ok: true, ...((await handler(request)) as object) });
    } catch (e) {
      if (e instanceof InvalidInput) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  };
}
