import { adminRoute } from "@/lib/admin/route";
import { saveStage, validateStage } from "@/lib/admin/store";

export const PUT = adminRoute(async (request) => {
  const body = (await request.json()) as { slug?: string; motion?: Record<string, unknown> };
  await saveStage(String(body.slug ?? ""), validateStage(body.motion ?? {}));
  return {};
});
