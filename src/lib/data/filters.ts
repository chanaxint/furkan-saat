import type { Watch } from "./types";

export type FilterKey = "brand" | "type" | "material" | "movement" | "price";
export type Filters = Record<FilterKey, string[]>;

export const EMPTY_FILTERS: Filters = { brand: [], type: [], material: [], movement: [], price: [] };

export const PRICE_BANDS = [
  { id: "under-15", label: "15.000 € altı", test: (p: number | null) => p !== null && p < 15000 },
  { id: "15-50", label: "15.000 € – 50.000 €", test: (p: number | null) => p !== null && p >= 15000 && p < 50000 },
  { id: "50-plus", label: "50.000 € üzeri", test: (p: number | null) => p !== null && p >= 50000 },
  { id: "request", label: "Fiyat sorunuz", test: (p: number | null) => p === null },
];

const unique = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "tr"));

export function filterOptions(watches: Watch[]): Record<FilterKey, { value: string; label: string }[]> {
  const opt = (vals: string[]) => unique(vals).map((v) => ({ value: v, label: v }));
  return {
    brand: opt(watches.map((w) => w.brand)),
    type: opt(watches.map((w) => w.type)),
    material: opt(watches.map((w) => w.material)),
    movement: opt(watches.map((w) => w.movement)),
    price: PRICE_BANDS.map((b) => ({ value: b.id, label: b.label })),
  };
}

export function applyFilters(watches: Watch[], f: Filters) {
  return watches.filter(
    (w) =>
      (!f.brand.length || f.brand.includes(w.brand)) &&
      (!f.type.length || f.type.includes(w.type)) &&
      (!f.material.length || f.material.includes(w.material)) &&
      (!f.movement.length || f.movement.includes(w.movement)) &&
      (!f.price.length || f.price.some((id) => PRICE_BANDS.find((b) => b.id === id)?.test(w.price))),
  );
}

export const FILTER_LABELS: Record<FilterKey, string> = {
  brand: "Marka",
  type: "Tür",
  material: "Malzeme",
  movement: "Mekanizma",
  price: "Fiyat",
};
