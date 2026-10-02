import type { CollectionDef } from "./types";

/** Curated collections. A watch joins one by listing its slug in `collections`. */
export const COLLECTIONS: CollectionDef[] = [
  { slug: "yeni-gelenler", name: "Yeni Gelenler", description: "Butiğe en son ulaşan saatler.", ground: "ivory" },
  { slug: "kadin", name: "Kadın", description: "Sedef kadranlar, taşlı çerçeveler ve zarif bilezikler.", ground: "wine" },
  { slug: "tasli", name: "Taşlı", description: "Kristal taşlarla ışıldayan, mücevher etkili saatler.", ground: "stone" },
  { slug: "kronograf", name: "Kronograflar", description: "Zamanı ölçen saatler.", ground: "green" },
  { slug: "dijital", name: "Dijital", description: "Retro ekranlar, alarm ve kronometre: dijital saatin klasikleri.", ground: "stone" },
  { slug: "ikonik", name: "İkonik Saatler", description: "Kendi kategorisinin ölçüsü olmuş modeller.", ground: "green" },
  { slug: "spor", name: "Spor", description: "Güçlü kasalar, okunaklı kadranlar, her gün için.", ground: "stone" },
  { slug: "klasik", name: "Klasik", description: "Sade kadranlar, zamansız formlar.", ground: "wine" },
];
