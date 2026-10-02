import { adminRoute } from "@/lib/admin/route";
import { saveSettings, validateSettings } from "@/lib/admin/store";

export const PUT = adminRoute(async (request) => {
  await saveSettings(validateSettings((await request.json()) as Record<string, unknown>));
  return {};
});
