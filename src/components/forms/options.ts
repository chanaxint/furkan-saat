import { BRANDS } from "@/lib/data/brands";
import { PRODUCTS } from "@/lib/data/products";
import { brandName } from "@/lib/services/catalog";
import { watchLabel } from "@/lib/format";
import type { Option } from "./fields";

/** Choices shared by the enquiry forms — read from the catalogue, never typed twice. */
export const BRAND_OPTIONS: Option[] = [
  ...BRANDS.map((b) => ({ value: b.name, label: b.name })),
  { value: "Diğer", label: "Diğer" },
];

export const WATCH_OPTIONS: Option[] = PRODUCTS.map((p) => ({
  value: p.slug,
  label: watchLabel(brandName(p.brand), p.model, p.reference),
}));

export const watchOptionLabel = (slug: string) => WATCH_OPTIONS.find((o) => o.value === slug)?.label ?? slug;

export const CONDITION_OPTIONS: Option[] = ["Hiç kullanılmamış", "Mükemmel", "Çok iyi", "İyi", "Bakım gerektiriyor"].map((v) => ({
  value: v,
  label: v,
}));

export const YES_NO: Option[] = [
  { value: "Var", label: "Var" },
  { value: "Yok", label: "Yok" },
];

export const TIME_OPTIONS: Option[] = ["10.00", "11.00", "12.00", "13.00", "14.00", "15.00", "16.00", "17.00", "18.00"].map((v) => ({
  value: v,
  label: v,
}));
