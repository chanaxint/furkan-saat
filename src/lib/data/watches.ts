import type { Watch } from "./types";

/** The collection — sample pieces with studio photography (placeholders until the real stock is shot). */
export const WATCHES: Watch[] = [
  {
    id: "rolex-submariner-116610lv",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "116610LV",
    type: "Spor",
    material: "Çelik",
    movement: "Otomatik",
    diameter: "40 mm",
    price: null,
    tone: "green",
    image: "/assets/images/collection/rolex-submariner-116610lv.webp",
    href: "/collection/rolex-submariner-116610lv",
  },
  {
    id: "rolex-submariner-126610ln",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126610LN",
    type: "Spor",
    material: "Çelik",
    movement: "Otomatik",
    diameter: "41 mm",
    price: null,
    tone: "deep",
    image: "/assets/images/collection/rolex-submariner-126610ln.webp",
    href: "/collection/rolex-submariner-126610ln",
  },
  {
    id: "rolex-submariner-126619lb",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126619LB",
    type: "Spor",
    material: "Beyaz Altın",
    movement: "Otomatik",
    diameter: "41 mm",
    price: null,
    tone: "stone",
    image: "/assets/images/collection/rolex-submariner-126619lb.webp",
    href: "/collection/rolex-submariner-126619lb",
  },
  {
    id: "patek-celestial-6102p",
    brand: "Patek Philippe",
    model: "Grand Complications Celestial",
    reference: "6102P-001",
    type: "Komplikasyon",
    material: "Platin",
    movement: "Otomatik",
    diameter: "44 mm",
    price: null,
    tone: "deep",
    image: "/assets/images/collection/patek-celestial-6102p.webp",
    href: "/collection/patek-celestial-6102p",
  },
  {
    id: "jacob-co-skeleton-tourbillon",
    brand: "Jacob & Co.",
    model: "İskelet Tourbillon",
    reference: "Yeni koleksiyon",
    type: "Mücevher",
    material: "Beyaz Altın",
    movement: "Manuel",
    diameter: "44 mm",
    price: null,
    tone: "champagne",
    image: "/assets/images/collection/jacob-co-skeleton-tourbillon.webp",
    href: "/collection/jacob-co-skeleton-tourbillon",
  },
  {
    id: "mercedes-benz-classic",
    brand: "Mercedes-Benz",
    model: "Classic Automatic",
    reference: "MB-01",
    type: "Klasik",
    material: "Çelik",
    movement: "Otomatik",
    diameter: "42 mm",
    price: null,
    tone: "stone",
    image: "/assets/images/collection/mercedes-benz-classic.webp",
    href: "/collection/mercedes-benz",
  },
];

/** Section 05 — the single timepiece staged as New Arrival. */
export const NEW_ARRIVAL = {
  brand: "Jacob & Co.",
  // Descriptive name — replace with the exact model and reference when known.
  model: "İskelet Tourbillon",
  reference: "Yeni koleksiyon",
  description:
    "Pırlanta dizili kasa ve kulplar, iskelet kadranın ardında açıkça görünen mekanizma ve safir kabaşon kurma kolu. Kutusundan ilk kez çıkıyor.",
  details: [
    ["Kasa", "Pırlanta dizili"],
    ["Kadran", "İskelet, açık mekanizma"],
    ["Kordon", "Siyah timsah deri"],
  ] as [string, string][],
  href: "/collection/jacob-co-skeleton-tourbillon",
};

export const formatPrice = (price: number | null) =>
  price === null
    ? "Fiyat için bilgi alın"
    : new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(price);
