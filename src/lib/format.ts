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

/** URL-safe slug from free text, Turkish letters folded: "Casio Edifice EFR-S108DE" → "casio-edifice-efr-s108de". */
export const slugify = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "Ref. EFR-S108DE-3AV" — or nothing when the maker publishes no reference. */
/**
 * The watch's model for a card: its reference when the maker publishes one
 * ("EFB-730D-3AV"), otherwise the model name without the description of the
 * dial and bracelet ("Exclusive — Siyah, Deri Kayış" → "Exclusive").
 */
export const modelLabel = (model: string, reference: string) => reference || model.split(" — ")[0].trim();

export const refLabel = (reference: string) => (reference ? `Ref. ${reference}` : "");

/** "Casio Edifice Slim — EFR-S108DE-3AV", or without the dash when there is no reference. */
export const watchLabel = (brand: string, model: string, reference: string) =>
  reference ? `${brand} ${model} — ${reference}` : `${brand} ${model}`;
