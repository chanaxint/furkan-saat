import { NextResponse } from "next/server";
import { InvalidInput, isAdminEnabled } from "./store";

/**
 * Wraps an admin route handler: refuses outside development and turns
 * validation errors into a readable 400 response.
 */
export function adminRoute(handler: (request: Request) => Promise<unknown>) {
  return async (request: Request) => {
    if (!isAdminEnabled())
      return NextResponse.json({ error: "Yönetim yalnızca geliştirme modunda (npm run dev) çalışır." }, { status: 403 });
    try {
      return NextResponse.json({ ok: true, ...((await handler(request)) as object) });
    } catch (e) {
      if (e instanceof InvalidInput) return NextResponse.json({ error: e.message }, { status: 400 });
      throw e;
    }
  };
}
