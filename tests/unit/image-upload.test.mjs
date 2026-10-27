// Rules for uploaded watch photographs and photograph addresses (src/lib/admin/imageUpload.ts).
// Run with `npm test` (node --test; Node strips the TypeScript types itself).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  checkImageUpload,
  isAllowedImageSource,
  sniffImage,
  STORAGE_MAX_BYTES,
  STORAGE_OBJECT,
  storageObjectFromUrl,
  storageObjectName,
  storagePublicUrl,
} from "../../src/lib/admin/imageUpload.ts";

const ROOT = path.resolve(import.meta.dirname, "../..");
const bytes = (...parts) => new Uint8Array(Buffer.concat(parts.map((p) => (typeof p === "string" ? Buffer.from(p, "latin1") : Buffer.from(p)))));
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0], "rest of a jpeg");
const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "rest of a png");
const WEBP = bytes("RIFF", [0x10, 0, 0, 0], "WEBPVP8 rest");
const box = (major, ...compatible) => {
  const body = Buffer.concat([Buffer.from(major), Buffer.from([0, 0, 0, 0]), ...compatible.map((c) => Buffer.from(c))]);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(body.length + 8);
  return bytes(size, "ftyp", body, "mdat...");
};
const AVIF = box("avif", "mif1", "miaf");
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
const HTML = bytes("<!doctype html><script>alert(1)</script>");
const ok = (b, fileName, mimeType, maxBytes = STORAGE_MAX_BYTES) => checkImageUpload({ bytes: b, fileName, mimeType, maxBytes });

test("sniffImage recognises the four formats by their first bytes", () => {
  assert.equal(sniffImage(JPEG), "jpeg");
  assert.equal(sniffImage(PNG), "png");
  assert.equal(sniffImage(WEBP), "webp");
  assert.equal(sniffImage(AVIF), "avif");
  assert.equal(sniffImage(box("mif1", "avif")), "avif", "avif as a compatible brand");
  assert.equal(sniffImage(box("heic", "mif1")), null, "HEIC is not AVIF");
  assert.equal(sniffImage(bytes("GIF89a......")), null);
  assert.equal(sniffImage(SVG), null);
  assert.equal(sniffImage(new Uint8Array()), null);
});

test("every photograph already in the catalogue passes the check", () => {
  const dir = path.join(ROOT, "public/assets/images/watches");
  const files = readdirSync(dir).filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f));
  assert.ok(files.length > 0);
  const mime = { webp: "image/webp", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", avif: "image/avif" };
  for (const f of files) {
    const ext = f.split(".").pop().toLowerCase();
    const r = ok(new Uint8Array(readFileSync(path.join(dir, f))), f, mime[ext]);
    assert.ok(r.ok, `${f}: ${r.error}`);
  }
});

test("accepted: matching type, extension and content; .jpeg is stored as .jpg", () => {
  assert.deepEqual(ok(JPEG, "Saat.JPEG", "image/jpeg"), { ok: true, format: "jpeg", ext: "jpg", mime: "image/jpeg" });
  assert.equal(ok(PNG, "a.png", "image/png").ext, "png");
  assert.equal(ok(WEBP, "a.webp", "image/webp").ext, "webp");
  assert.equal(ok(AVIF, "a.avif", "image/avif").ext, "avif");
});

test("refused: SVG, HTML, other formats, missing extension", () => {
  for (const [b, name, mime] of [
    [SVG, "logo.svg", "image/svg+xml"],
    [SVG, "logo.png", "image/png"], // an SVG renamed to .png
    [HTML, "x.html", "text/html"],
    [HTML, "x.webp", "image/webp"],
    [bytes("GIF89a......"), "a.gif", "image/gif"],
    [JPEG, "noextension", "image/jpeg"],
    [JPEG, "a.jpg.svg", "image/svg+xml"],
  ]) {
    const r = ok(b, name, mime);
    assert.equal(r.ok, false, name);
    assert.match(r.error, /WebP, JPG, PNG ya da AVIF|uyuşmuyor/, name);
  }
});

test("refused: type, extension and content must all agree", () => {
  assert.match(ok(JPEG, "a.png", "image/png").error, /içeriği/, "JPEG content named .png");
  assert.match(ok(PNG, "a.png", "image/jpeg").error, /uyuşmuyor/, "declared type differs");
  assert.match(ok(PNG, "a.png", "").error, /uyuşmuyor/, "no declared type");
  assert.match(ok(PNG, "a.png", "application/octet-stream").error, /uyuşmuyor/);
});

test("size limit and empty files", () => {
  assert.match(ok(new Uint8Array(), "a.jpg", "image/jpeg").error, /boş/);
  const big = new Uint8Array(STORAGE_MAX_BYTES + 1);
  big.set(JPEG);
  assert.match(ok(big, "a.jpg", "image/jpeg").error, /4 MB'tan büyük/);
  const exact = new Uint8Array(STORAGE_MAX_BYTES);
  exact.set(JPEG);
  assert.equal(ok(exact, "a.jpg", "image/jpeg").ok, true, "exactly the limit is allowed");
});

test("object names: directly under watches/, from the watch's name, never the uploaded file's path", () => {
  const id = "3f2a6c1e-0d4b-4c3a-9f1e-1234567890ab";
  assert.equal(storageObjectName("Rolex Submariner Date", "jpg", id), `watches/rolex-submariner-date-${id}.jpg`);
  assert.equal(storageObjectName("Çılgın Şık Saat Ğü", "webp", id), `watches/cilgin-sik-saat-gu-${id}.webp`);
  for (const label of ["../../etc/passwd", "..\\..\\x", "/watches/../secret", "%2e%2e%2f", "a/b/c", "", "...", "<script>"]) {
    const name = storageObjectName(label, "png", id);
    assert.match(name, STORAGE_OBJECT, label);
    assert.equal(name.split("/").length, 2, `${label}: one folder only`);
    assert.ok(!name.includes(".."), label);
  }
  assert.equal(storageObjectName("", "png", id), `watches/saat-${id}.png`);
  assert.ok(storageObjectName("x".repeat(500), "png", id).length < 130, "long names are cut");
  assert.throws(() => storageObjectName("a", "svg", id), "only photo extensions");
  assert.throws(() => storageObjectName("a", "png/../x", id));
});

test("the Storage policy accepts exactly the names the panel writes", () => {
  const sql = readFileSync(path.join(ROOT, "supabase/migrations/20261027150000_product_images_policy.sql"), "utf8");
  const patterns = [...sql.matchAll(/name ~ '([^']+)'/g)].map((m) => m[1]);
  assert.equal(patterns.length, 2, "upload and update policies");
  assert.equal(patterns[0], patterns[1]);
  const policy = new RegExp(patterns[0]);
  for (const name of [
    "watches/rolex-1.jpg", "watches/a.webp", "watches/a.png", "watches/a.avif", `watches/saat-${crypto.randomUUID()}.jpg`,
    "watches/a/b.jpg", "watches/A.jpg", "watches/a.JPG", "watches/a.jpeg", "watches/../x.webp", "watches/-a.jpg",
    "watches/a--b.jpg", "watches/a b.jpg", "watches/a.svg", "watches/a.webp.svg", "a.jpg", "other/a.jpg", "watches/a.jpg\n",
  ])
    assert.equal(policy.test(name), STORAGE_OBJECT.test(name), name);
});

test("object names never collide: same watch, same file, different ids", () => {
  const names = new Set(Array.from({ length: 1000 }, () => storageObjectName("Aynı Saat", "jpg", crypto.randomUUID())));
  assert.equal(names.size, 1000);
});

test("photograph addresses: local files and this project's bucket only", () => {
  const SB = "https://abcd.supabase.co";
  const good = storagePublicUrl(SB, "watches/rolex-1a2b.jpg");
  assert.equal(good, "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/rolex-1a2b.jpg");
  assert.equal(storageObjectFromUrl(good, SB), "watches/rolex-1a2b.jpg");
  assert.equal(storageObjectFromUrl(good, `${SB}/`), "watches/rolex-1a2b.jpg", "a trailing slash in the setting");
  assert.equal(isAllowedImageSource(good, SB), true);
  assert.equal(isAllowedImageSource("/assets/images/watches/rolex.webp", SB), true, "existing local photographs");
  assert.equal(isAllowedImageSource("/assets/images/watches/rolex.webp", undefined), true, "also without Supabase");

  for (const bad of [
    "https://evil.example/storage/v1/object/public/product-images/watches/a.jpg", // another host
    "https://abcd.supabase.co.evil.example/storage/v1/object/public/product-images/watches/a.jpg",
    "https://other.supabase.co/storage/v1/object/public/product-images/watches/a.jpg", // another project
    "http://abcd.supabase.co/storage/v1/object/public/product-images/watches/a.jpg", // other scheme
    "https://abcd.supabase.co/storage/v1/object/public/avatars/watches/a.jpg", // another bucket
    "https://abcd.supabase.co/storage/v1/object/sign/product-images/watches/a.jpg", // signed URL
    `${good}?download=1`,
    `${good}#x`,
    "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/../secret.jpg",
    "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/%2e%2e/a.jpg",
    "https://abcd.supabase.co/storage/v1/object/public/product-images/other/a.jpg",
    "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/sub/a.jpg",
    "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/a.svg",
    "https://abcd.supabase.co/storage/v1/object/public/product-images/watches/A.JPG",
    "/assets/images/watches/a.svg",
    "/assets/../secret.webp",
    "//evil.example/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "",
    null,
    42,
  ])
    assert.equal(isAllowedImageSource(bad, SB), false, String(bad));

  assert.equal(isAllowedImageSource(good, undefined), false, "Storage addresses need the project's URL");
  assert.equal(isAllowedImageSource(good, "not a url"), false);
});
