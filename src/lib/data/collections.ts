import type { CollectionDef } from "./types";

/** Curated collections. A watch joins one by listing its slug in `collections`. */
export const COLLECTIONS: CollectionDef[] = [
  { slug: "nadir-parcalar", name: "Nadir Parçalar", description: "Üretimden kalkmış, sınırlı ya da bulunması yıllar alan saatler.", ground: "green" },
  { slug: "yeni-gelenler", name: "Yeni Gelenler", description: "Butiğe en son ulaşan saatler.", ground: "ivory" },
  { slug: "ikonik", name: "İkonik Saatler", description: "Kendi kategorisinin ölçüsü olmuş referanslar.", ground: "stone" },
  { slug: "kronograf", name: "Kronograflar", description: "Zamanı ölçen saatler.", ground: "ivory" },
  { slug: "tourbillon", name: "Tourbillon", description: "Yer çekimine karşı dönen kafesler.", ground: "wine" },
  { slug: "iskelet", name: "İskelet", description: "Mekanizmayı saklamayan kadranlar.", ground: "green" },
  { slug: "spor", name: "Spor", description: "Dalış, yarış ve gündelik hayat için.", ground: "stone" },
  { slug: "klasik", name: "Klasik", description: "İnce kasalar, sade kadranlar.", ground: "wine" },
];
