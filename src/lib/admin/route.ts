import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/supabase/config";
import { checkAdmin } from "./auth";
import { isSameOriginRequest, requestOrigins } from "./origin";
import { AdminForbidden, InvalidInput, isFileEditingEnabled } from "./store";

const refuse = (error: string, status: number) => NextResponse.json({ error }, { status });

type Options = {
  /**
   * Whether the route writes the project's data files, which only works while
   * running `npm run dev` (default true). A function is asked on each request.
   */
  files?: boolean | (() => boolean);
};

/**
 * Wraps an admin route handler. In order: the request must come from this
 * site's own pages (Origin), the visitor must be a signed-in admin (checked
 * with Supabase and the database), and a route that writes the project's files
 * needs the site running in development. Validation errors become a readable
 * 400 response, a write the database refuses a 403.
 */
export function adminRoute(handler: (request: Request) => Promise<unknown>, options: Options = {}) {
  return async (request: Request) => {
    const allowed = [...requestOrigins(request.url, request.headers), siteUrl()];
    if (!isSameOriginRequest(request.method, request.headers.get("origin"), allowed))
      return refuse("Bu istek sitenin kendi sayfalarından gelmedi.", 403);

    const admin = await checkAdmin();
    if (!admin.ok)
      return admin.status === 401
        ? refuse("Bu işlem için yönetici olarak giriş yapın.", 401)
        : refuse("Bu işlem için yetkiniz yok.", 403);

    const files = typeof options.files === "function" ? options.files() : (options.files ?? true);
    if (files && !isFileEditingEnabled())
      return refuse("Bu bölüm şimdilik yalnızca geliştirme modunda (npm run dev) kaydeder.", 403);

    try {
      return NextResponse.json({ ok: true, ...((await handler(request)) as object) });
    } catch (e) {
      if (e instanceof InvalidInput) return NextResponse.json({ error: e.message }, { status: 400 });
      if (e instanceof AdminForbidden) return refuse("Bu işlem için yetkiniz yok.", 403);
      throw e;
    }
  };
}
