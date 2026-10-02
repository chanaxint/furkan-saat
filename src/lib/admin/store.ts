import { promises as fs } from "fs";
import { slugify } from "@/lib/format";
import path from "path";
import { BRANDS } from "@/lib/data/brands";
import { COLLECTIONS } from "@/lib/data/collections";
import type { Settings } from "@/lib/data/site";
import {
  AVAILABILITY,
  CONDITIONS,
  CURRENCIES,
  MOVEMENTS,
  TONES,
  type Article,
  type ArticleBlock,
  type Product,
} from "@/lib/data/types";

/**
 * Server-side access to the editable data files (src/lib/data/*.json) for the
 * /yonetim panel. Everything written is validated here first. Used only in
 * development — see `isAdminEnabled`.
 */

/** The panel and its saves exist only while running `npm run dev`. */
export const isAdminEnabled = () => process.env.NODE_ENV === "development";

const DATA = path.join(process.cwd(), "src", "lib", "data");
const file = (name: string) => path.join(DATA, name);

async function readJson<T>(name: string): Promise<T> {
  return JSON.parse(await fs.readFile(file(name), "utf8")) as T;
}
async function writeJson(name: string, value: unknown) {
  await fs.writeFile(file(name), JSON.stringify(value, null, 2) + "\n", "utf8");
}

export const readProducts = () => readJson<Product[]>("products.json");
export const readArticles = () => readJson<Article[]>("journal.json");
export const readSettings = () => readJson<Settings>("settings.json");

/* ------------------------------------------------------------- validation */

export class InvalidInput extends Error {}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE = /^\/assets\/images\/[a-z0-9/_.-]+\.(webp|jpe?g|png|avif)$/i;

const str = (v: unknown, label: string, required = true) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (required && !s) throw new InvalidInput(`${label} gerekli.`);
  return s;
};
const optional = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[], label: string): T => {
  if (!list.includes(v as T)) throw new InvalidInput(`${label} geçersiz.`);
  return v as T;
};

export function validateProduct(input: Record<string, unknown>): Product {
  const specs = (input.specs ?? {}) as Record<string, unknown>;
  const slug = str(input.slug, "Adres (slug)");
  if (!SLUG.test(slug)) throw new InvalidInput("Adres yalnızca küçük harf, rakam ve tire içerebilir.");
  const price = input.price === null || input.price === "" || input.price === undefined ? null : Number(input.price);
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new InvalidInput("Fiyat geçersiz.");
  const images = Array.isArray(input.images) ? input.images.map(String) : [];
  if (images.some((i) => !IMAGE.test(i))) throw new InvalidInput("Fotoğraf yolu geçersiz.");
  const collections = Array.isArray(input.collections) ? input.collections.map(String) : [];
  if (collections.some((c) => !COLLECTIONS.some((x) => x.slug === c))) throw new InvalidInput("Koleksiyon geçersiz.");
  const addedAt = str(input.addedAt, "Eklenme tarihi");
  if (!DATE.test(addedAt)) throw new InvalidInput("Eklenme tarihi geçersiz.");

  return {
    slug,
    brand: oneOf(input.brand, BRANDS.map((b) => b.slug), "Marka"),
    model: str(input.model, "Model"),
    reference: str(input.reference, "Referans", false),
    price,
    currency: oneOf(input.currency, CURRENCIES, "Para birimi"),
    images,
    description: str(input.description, "Açıklama"),
    specs: {
      movement: oneOf(specs.movement, MOVEMENTS, "Mekanizma"),
      caliber: optional(specs.caliber),
      powerReserve: optional(specs.powerReserve),
      caseDiameter: optional(specs.caseDiameter),
      caseMaterial: str(specs.caseMaterial, "Kasa malzemesi"),
      crystal: optional(specs.crystal),
      waterResistance: optional(specs.waterResistance),
      strap: optional(specs.strap),
      year: optional(specs.year),
    },
    condition: oneOf(input.condition, CONDITIONS, "Durum"),
    availability: oneOf(input.availability, AVAILABILITY, "Bulunabilirlik"),
    fullSet: input.fullSet === true,
    collections,
    featured: input.featured === true || undefined,
    addedAt,
    tone: TONES.includes(input.tone as never) ? (input.tone as Product["tone"]) : "deep",
  };
}

export function validateArticle(input: Record<string, unknown>): Article {
  const slug = str(input.slug, "Adres (slug)");
  if (!SLUG.test(slug)) throw new InvalidInput("Adres yalnızca küçük harf, rakam ve tire içerebilir.");
  const date = str(input.date, "Tarih");
  if (!DATE.test(date)) throw new InvalidInput("Tarih geçersiz.");
  const cover = str(input.cover, "Kapak fotoğrafı");
  if (!IMAGE.test(cover)) throw new InvalidInput("Kapak fotoğrafı geçersiz.");
  const body = Array.isArray(input.body) ? (input.body as ArticleBlock[]) : [];
  if (!body.length || body.some((b) => !["p", "h", "quote"].includes(b?.type) || typeof b.text !== "string" || !b.text.trim()))
    throw new InvalidInput("Metin boş olamaz.");
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  return {
    slug,
    title: str(input.title, "Başlık"),
    category: str(input.category, "Kategori"),
    excerpt: str(input.excerpt, "Özet"),
    date,
    readTime: str(input.readTime, "Okuma süresi"),
    cover,
    body: body.map((b) => ({ type: b.type, text: b.text.trim() })),
    brands: list(input.brands).filter((b) => BRANDS.some((x) => x.slug === b)),
    products: list(input.products),
  };
}

export function validateSettings(input: Record<string, unknown>): Settings {
  const b = (input.boutique ?? {}) as Record<string, unknown>;
  const k = (input.bank ?? {}) as Record<string, unknown>;
  const whatsapp = str(b.whatsapp, "WhatsApp numarası").replace(/\D/g, "");
  if (whatsapp.length < 10) throw new InvalidInput("WhatsApp numarası ülke koduyla birlikte yazılmalı (90…).");
  return {
    boutique: {
      name: str(b.name, "Butik adı"),
      city: str(b.city, "Şehir"),
      address: str(b.address, "Adres"),
      hours: str(b.hours, "Çalışma saatleri"),
      email: str(b.email, "E-posta"),
      phone: str(b.phone, "Telefon"),
      whatsapp,
      instagram: str(b.instagram, "Instagram"),
      mapUrl: str(b.mapUrl, "Harita bağlantısı"),
    },
    bank: { holder: str(k.holder, "Hesap sahibi"), bank: str(k.bank, "Banka"), iban: str(k.iban, "IBAN") },
  };
}

/* ------------------------------------------------------------------ writes */

/** Inserts or replaces by slug. `previous` = the slug being edited, if it changed. */
export async function saveProduct(product: Product, previous?: string) {
  const list = await readProducts();
  const at = list.findIndex((p) => p.slug === (previous ?? product.slug));
  if (at === -1 && list.some((p) => p.slug === product.slug)) throw new InvalidInput("Bu adreste başka bir saat var.");
  if (at === -1) list.unshift(product);
  else list[at] = product;
  await writeJson("products.json", list);
}
export async function deleteProduct(slug: string) {
  await writeJson("products.json", (await readProducts()).filter((p) => p.slug !== slug));
}

export async function saveArticle(article: Article, previous?: string) {
  const list = await readArticles();
  const at = list.findIndex((a) => a.slug === (previous ?? article.slug));
  if (at === -1 && list.some((a) => a.slug === article.slug)) throw new InvalidInput("Bu adreste başka bir yazı var.");
  if (at === -1) list.unshift(article);
  else list[at] = article;
  await writeJson("journal.json", list);
}
export async function deleteArticle(slug: string) {
  await writeJson("journal.json", (await readArticles()).filter((a) => a.slug !== slug));
}

export const saveSettings = (s: Settings) => writeJson("settings.json", s);

/* ------------------------------------------------------------------ images */

const IMAGE_DIR = path.join(process.cwd(), "public", "assets", "images", "watches");
const TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
const MAX_BYTES = 15 * 1024 * 1024;

/** Saves an uploaded photograph and returns its public path. */
export async function saveImage(fileIn: File, name: string) {
  const ext = TYPES[fileIn.type];
  if (!ext) throw new InvalidInput("Yalnızca WebP, JPG, PNG ya da AVIF yüklenebilir.");
  if (fileIn.size > MAX_BYTES) throw new InvalidInput("Fotoğraf 15 MB'tan büyük olamaz.");
  const base = slugify(name) || "saat";
  const filename = `${base}-${Date.now().toString(36)}.${ext}`;
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  await fs.writeFile(path.join(IMAGE_DIR, filename), Buffer.from(await fileIn.arrayBuffer()));
  return `/assets/images/watches/${filename}`;
}
