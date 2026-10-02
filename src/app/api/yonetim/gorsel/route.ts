import { adminRoute } from "@/lib/admin/route";
import { InvalidInput, saveImage } from "@/lib/admin/store";

/** Upload a photograph (multipart: file, name). Returns its public path. */
export const POST = adminRoute(async (request) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new InvalidInput("Fotoğraf seçilmedi.");
  return { path: await saveImage(file, String(form.get("name") ?? "saat")) };
});
