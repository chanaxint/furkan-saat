import type { Watch } from "./types";

/**
 * Mercedes-Benz watches — placeholder line-up for the brand page.
 * Replace names, references, prices and photos with the real stock.
 */
const w = (id: string, model: string, type: Watch["type"], material: Watch["material"], movement: Watch["movement"], diameter: string, tone: Watch["tone"]): Watch => ({
  id: `mercedes-${id}`,
  brand: "Mercedes-Benz",
  model,
  reference: "",
  type,
  material,
  movement,
  diameter,
  price: null,
  tone,
  image: null,
  href: `/collection/mercedes-benz#${id}`,
});

export const MERCEDES_WATCHES: Watch[] = [
  w("klasik-otomatik", "Klasik Otomatik", "Klasik", "Çelik", "Otomatik", "41 mm", "deep"),
  w("amg-kronograf", "AMG Kronograf", "Kronograf", "Titanyum", "Otomatik", "44 mm", "green"),
  w("performance", "Performance Spor", "Spor", "Çelik", "Otomatik", "42 mm", "stone"),
  w("heritage", "Heritage Klasik", "Klasik", "Çelik", "Manuel", "39 mm", "ivory"),
  w("carbon", "AMG Carbon Edition", "Spor", "Karbon", "Otomatik", "43 mm", "deep"),
  w("gmt", "Grand Tourer GMT", "Spor", "Çelik", "Otomatik", "42 mm", "champagne"),
];
