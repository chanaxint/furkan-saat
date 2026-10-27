import "server-only";

import { randomUUID } from "crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { SUPABASE_URL } from "@/lib/supabase/config";
import {
  checkImageUpload,
  PRODUCT_IMAGES_BUCKET,
  STORAGE_MAX_BYTES,
  STORAGE_OBJECT,
  storageObjectName,
  storagePublicUrl,
} from "./imageUpload";
import { AdminForbidden, InvalidInput, UpstreamFailed } from "./store";

/**
 * Watch photographs in Supabase Storage (CATALOG_SOURCE=db), written as the
 * signed-in admin: the bucket's policies let only admins upload or delete, so
 * no service role key is needed. Callers check the admin first (adminRoute);
 * Storage checks again.
 */

type StorageError = { statusCode?: string | number; status?: number; message?: string } | null;

function fail(error: StorageError, action: string): never {
  // storage-js gives the HTTP status and the body's statusCode; either may carry the reason.
  const codes = [Number(error?.status), Number(error?.statusCode)].filter(Number.isFinite);
  const is = (code: number) => codes.includes(code);
  if (is(401) || is(403) || /row-level security|unauthori[sz]ed/i.test(error?.message ?? "")) throw new AdminForbidden();
  if (is(413)) throw new InvalidInput("Fotoğraf çok büyük.");
  if (is(415)) throw new InvalidInput("Bu dosya türü yüklenemez.");
  // Details stay in the server log (status codes only); the panel gets a plain message.
  console.error(`product images: ${action} failed`, codes.join("/") || "unknown");
  throw new UpstreamFailed(`Fotoğraf ${action === "upload" ? "yüklenemedi" : "silinemedi"}. Lütfen tekrar deneyin.`);
}

async function db() {
  const supabase = await getServerSupabase();
  if (!supabase) throw new UpstreamFailed("Fotoğraf yüklenemedi: Supabase ayarları eksik.");
  return supabase;
}

/** Checks and uploads a photograph; returns its public address and its object name. */
export async function uploadProductImage(file: File, label: string) {
  if (file.size > STORAGE_MAX_BYTES) throw new InvalidInput("Fotoğraf 4 MB'tan büyük olamaz.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImageUpload({ bytes, fileName: file.name, mimeType: file.type, maxBytes: STORAGE_MAX_BYTES });
  if (!check.ok) throw new InvalidInput(check.error);
  const object = storageObjectName(label, check.ext, randomUUID());
  const { error } = await (await db()).storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(object, bytes, { contentType: check.mime, upsert: false, cacheControl: "31536000" });
  if (error) fail(error as StorageError, "upload");
  return { path: storagePublicUrl(SUPABASE_URL, object), object };
}

/**
 * Deletes a photograph uploaded in the panel but not kept (removed before the
 * watch was saved). A photograph any watch uses, retired ones included, is
 * never deleted.
 */
export async function deleteUnusedProductImage(object: string) {
  if (!STORAGE_OBJECT.test(object)) throw new InvalidInput("Fotoğraf adı geçersiz.");
  const supabase = await db();
  const url = storagePublicUrl(SUPABASE_URL, object);
  const [asFront, inImages] = await Promise.all([
    supabase.from("products").select("slug").eq("front", url).limit(1),
    supabase.from("products").select("slug").contains("images", [url]).limit(1),
  ]);
  if (asFront.error || inImages.error) fail(null, "delete");
  if (asFront.data?.length || inImages.data?.length) throw new InvalidInput("Bu fotoğraf bir saatte kullanılıyor; silinmedi.");
  const { data, error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([object]);
  if (error) fail(error as StorageError, "delete");
  // Storage answers an empty list both when the file is not there and when the policies hid it.
  if (!data?.length) throw new InvalidInput("Fotoğraf bulunamadı ya da silinemedi.");
}
