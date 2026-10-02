import type { Currency } from "./data/types";

/** "€16.500" — or the house wording when the price is on request. */
export const formatPrice = (price: number | null, currency: Currency = "EUR") =>
  price === null
    ? "Fiyat için bilgi alın"
    : new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(price);

/** Turkish-aware, accent-insensitive text for search. */
export const normalize = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** "24 Eylül 2026" */
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T12:00:00`));

/** URL-safe slug from free text, Turkish letters folded: "Rolex Submariner 126610LN" → "rolex-submariner-126610ln". */
export const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
