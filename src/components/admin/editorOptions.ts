import { BRANDS } from "@/lib/data/brands";
import { COLLECTIONS } from "@/lib/data/collections";
import type { Product } from "@/lib/data/types";
import { brandName } from "@/lib/services/catalog";
import { watchLabel } from "@/lib/format";

/** Choices for the editors, read from the shared data. */
export const BRAND_CHOICES = BRANDS.map((b) => ({ value: b.slug, label: b.name }));
export const COLLECTION_CHOICES = COLLECTIONS.map((c) => ({ value: c.slug, label: c.name }));

export const productChoices = (products: Product[]) =>
  products.map((p) => ({ value: p.slug, label: watchLabel(brandName(p.brand), p.model, p.reference) }));
