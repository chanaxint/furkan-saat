/**
 * Rules for watch photographs uploaded from the panel, and for the photograph
 * addresses a watch may have. No runtime imports: Node runs it directly in the
 * tests, and both upload paths (Supabase Storage, the project's files) use it.
 *
 * A photograph is accepted only when its first bytes, its file extension and
 * its declared type all name the same format. Only still raster formats are
 * allowed: no SVG (it can carry scripts), no GIF, no HEIC.
 */

export type ImageFormat = "webp" | "jpeg" | "png" | "avif";

export const IMAGE_FORMATS: Record<ImageFormat, { mime: string; exts: string[] }> = {
  webp: { mime: "image/webp", exts: ["webp"] },
  jpeg: { mime: "image/jpeg", exts: ["jpg", "jpeg"] },
  png: { mime: "image/png", exts: ["png"] },
  avif: { mime: "image/avif", exts: ["avif"] },
};

/**
 * Size limits. Uploads to Storage pass through the site's server, whose
 * request body is limited by the host (on Vercel about 4.5 MB), so 4 MB; the
 * development-only upload to the project's files keeps its 15 MB. The largest
 * photograph in the catalogue today is about 0.3 MB.
 */
export const STORAGE_MAX_BYTES = 4 * 1024 * 1024;
export const FILES_MAX_BYTES = 15 * 1024 * 1024;

/** The Supabase Storage bucket for watch photographs (supabase/migrations/20261026120000_admin_catalog.sql). */
export const PRODUCT_IMAGES_BUCKET = "product-images";

const ascii = (bytes: Uint8Array, from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));

/** The format a file's first bytes show, or null. */
export function sniffImage(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return "png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "webp";
  if (bytes.length >= 16 && ascii(bytes, 4, 8) === "ftyp") {
    // ISO-BMFF: the major brand, then the compatible brands up to the end of the ftyp box.
    const boxSize = Math.min(((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0, bytes.length);
    const brands = [ascii(bytes, 8, 12)];
    for (let i = 16; i + 4 <= boxSize; i += 4) brands.push(ascii(bytes, i, i + 4));
    if (brands.includes("avif") || brands.includes("avis")) return "avif";
  }
  return null;
}

const mb = (n: number) => `${Math.round(n / (1024 * 1024))} MB`;

export type ImageCheck = { ok: true; format: ImageFormat; ext: string; mime: string } | { ok: false; error: string };

/** Checks an uploaded file; the error is a message for the panel. */
export function checkImageUpload(input: { bytes: Uint8Array; fileName: string; mimeType: string; maxBytes: number }): ImageCheck {
  const { bytes, fileName, mimeType, maxBytes } = input;
  if (!bytes.length) return { ok: false, error: "Fotoğraf dosyası boş." };
  if (bytes.length > maxBytes) return { ok: false, error: `Fotoğraf ${mb(maxBytes)}'tan büyük olamaz.` };
  const ext = /\.([a-z0-9]+)$/i.exec(fileName.trim())?.[1]?.toLowerCase() ?? "";
  const byExt = (Object.keys(IMAGE_FORMATS) as ImageFormat[]).find((f) => IMAGE_FORMATS[f].exts.includes(ext));
  if (!byExt) return { ok: false, error: "Yalnızca WebP, JPG, PNG ya da AVIF yüklenebilir." };
  if (mimeType !== IMAGE_FORMATS[byExt].mime) return { ok: false, error: "Dosya türü ile uzantısı uyuşmuyor." };
  if (sniffImage(bytes) !== byExt) return { ok: false, error: "Dosyanın içeriği bir WebP, JPG, PNG ya da AVIF fotoğrafı değil." };
  return { ok: true, format: byExt, ext: ext === "jpeg" ? "jpg" : ext, mime: IMAGE_FORMATS[byExt].mime };
}

/** Lower-case letters, digits and single dashes, from any label (Turkish letters folded). */
export function safeLabel(label: string, max = 48): string {
  const folded = label
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
  return folded.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}

/**
 * A Storage object name the site writes: always directly under watches/, from
 * the watch's name (never the uploaded file's name) and a random id, so two
 * uploads never overwrite each other. The bucket's upload policy allows the
 * same names (supabase/migrations/20261027150000_product_images_policy.sql);
 * a unit test keeps the two in step.
 */
export const STORAGE_OBJECT = /^watches\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:webp|jpg|png|avif)$/;

export function storageObjectName(label: string, ext: string, id: string): string {
  const name = `watches/${safeLabel(label) || "saat"}-${safeLabel(id, 64)}.${ext}`;
  if (!STORAGE_OBJECT.test(name)) throw new Error("Geçersiz fotoğraf adı.");
  return name;
}

const publicPrefix = (supabaseUrl: string) => `${new URL(supabaseUrl).origin}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;

/** The public address of a photograph in the bucket. */
export const storagePublicUrl = (supabaseUrl: string, object: string) => `${publicPrefix(supabaseUrl)}${object}`;

/**
 * The object name behind one of this project's public photograph addresses,
 * or null: another host, another bucket, a query, a fragment or a name the
 * site would not have written are all refused.
 */
export function storageObjectFromUrl(value: string, supabaseUrl: string | undefined | null): string | null {
  if (!supabaseUrl || typeof value !== "string") return null;
  let prefix: string;
  try {
    prefix = publicPrefix(supabaseUrl);
  } catch {
    return null;
  }
  if (!value.startsWith(prefix)) return null;
  const object = value.slice(prefix.length);
  return STORAGE_OBJECT.test(object) ? object : null;
}

/** A photograph the site has always used: a file under public/assets/images. */
export const LOCAL_IMAGE = /^\/assets\/images\/[a-z0-9/_.-]+\.(webp|jpe?g|png|avif)$/i;

/** Whether a watch may use this photograph address: a local file, or one in this project's bucket. */
export const isAllowedImageSource = (value: unknown, supabaseUrl: string | undefined | null) =>
  typeof value === "string" && (LOCAL_IMAGE.test(value) || storageObjectFromUrl(value, supabaseUrl) !== null);
