/** Allowed values — the admin panel offers exactly these. */
export const TONES = ["green", "deep", "ivory", "stone", "champagne", "wine"] as const;
export const MOVEMENTS = ["Otomatik", "Manuel", "Kuvars"] as const;
export const CONDITIONS = ["Yeni", "Kullanılmamış", "Mükemmel", "Çok iyi"] as const;
export const AVAILABILITY = ["Stokta", "Rezerve", "Sipariş üzerine"] as const;
export const CURRENCIES = ["EUR", "TRY", "USD"] as const;

export type Movement = (typeof MOVEMENTS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type Availability = (typeof AVAILABILITY)[number];
export type Currency = (typeof CURRENCIES)[number];
/** Placeholder tone used by MediaSlot while a photograph is missing. */
export type Tone = (typeof TONES)[number];

/** Technical data shown on the watch page and in comparisons. Missing values are simply not shown. */
export type ProductSpecs = {
  movement: Movement;
  caliber?: string;
  powerReserve?: string;
  caseDiameter?: string;
  caseMaterial: string;
  crystal?: string;
  waterResistance?: string;
  strap?: string;
  year?: string;
};

export type Product = {
  /** URL key: /saat/[slug] */
  slug: string;
  /** Brand slug — see BRANDS. */
  brand: string;
  model: string;
  /** Manufacturer reference; empty when the maker does not publish one. */
  reference: string;
  /** `null` = price upon request (enquiry only, no purchase). */
  price: number | null;
  currency: Currency;
  /** Gallery, first image is the cover; the second is shown on hover. */
  images: string[];
  /** Short editorial line for the watch page. */
  description: string;
  specs: ProductSpecs;
  condition: Condition;
  availability: Availability;
  /** Box and papers included. */
  fullSet: boolean;
  /** Collection slugs — see COLLECTIONS. */
  collections: string[];
  /** Shown in the home page selection. */
  featured?: boolean;
  /** ISO date the piece arrived; used for "newest" sorting. */
  addedAt: string;
  tone: Tone;
};

export type Brand = {
  slug: string;
  name: string;
  founded: string;
  origin: string;
  /** One quiet line under the name. */
  signature: string;
  description: string;
  /** Photograph for the brand tile and the brand page. */
  cover: string;
};

export type CollectionDef = {
  slug: string;
  name: string;
  description: string;
  /** Ground colour of the collection page's opening — its own note within the house palette. */
  ground: "ivory" | "green" | "wine" | "stone";
};

/** A block of article text. */
export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "quote"; text: string };

export type Article = {
  /** URL key: /dergi/[slug] */
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  /** ISO date */
  date: string;
  readTime: string;
  cover: string;
  body: ArticleBlock[];
  /** Brand slugs the article is about — shown on those brand pages. */
  brands: string[];
  /** Watches from the catalogue to show under the article. */
  products: string[];
};

/** A titled block of an information page (teslimat, iade, garanti, orijinallik). */
export type InfoSection = { title: string; text: string[] };
