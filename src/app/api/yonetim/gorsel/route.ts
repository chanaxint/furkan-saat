import { deleteUnusedProductImage, uploadProductImage } from "@/lib/admin/imageStore";
import { FILES_MAX_BYTES, STORAGE_MAX_BYTES } from "@/lib/admin/imageUpload";
import { adminRoute } from "@/lib/admin/route";
import { InvalidInput, saveImage } from "@/lib/admin/store";
import { catalogSource } from "@/lib/catalog/source";

/**
 * Watch photographs from the panel. With CATALOG_SOURCE=db they go to the
 * Supabase Storage bucket (also on the live site); with json, to the project's
 * files (development only, as before).
 */
const options = { files: () => catalogSource() === "json" };

/** Upload a photograph (multipart: file, name). Returns its address, and its Storage object name in db mode. */
export const POST = adminRoute(async (request) => {
  const storage = catalogSource() === "db";
  // Refuse an oversized body before reading it (the form adds a little to the file).
  const limit = (storage ? STORAGE_MAX_BYTES : FILES_MAX_BYTES) + 64 * 1024;
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new InvalidInput(`Fotoğraf ${storage ? 4 : 15} MB'tan büyük olamaz.`);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new InvalidInput("Fotoğraf seçilmedi.");
  const label = String(form.get("name") ?? "saat");
  return storage ? await uploadProductImage(file, label) : { path: await saveImage(file, label) };
}, options);

/** Delete a photograph uploaded in this session but not kept (db mode only; never one a watch uses). */
export const DELETE = adminRoute(async (request) => {
  if (catalogSource() !== "db") throw new InvalidInput("Bu modda fotoğraflar proje dosyalarında kalır.");
  await deleteUnusedProductImage(new URL(request.url).searchParams.get("object") ?? "");
  return {};
}, options);
