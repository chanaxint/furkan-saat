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
