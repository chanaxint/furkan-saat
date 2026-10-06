import type { ShowcaseBeat } from "@/lib/scene/pose";

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
  /** The watch head-on on a white ground: when set, the card's picture (the cover then shows on hover). */
  front?: string;
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
  /** Photograph for the brand page. */
  cover: string;
  /** Logo (ivory on transparent) for the home page brand tile and the brand page opening. */
  logo: string;
  /** Artwork for the home page brand tile (4:5, logo included). */
  tile?: string;
  /**
   * Optional film for the brand page opening: it loops silently behind the
   * logo, full screen (16:9 or wider, a few seconds, no sound needed).
   */
  film?: { mp4: string; webm?: string; poster?: string };
  /**
   * Optional opening as a still photograph instead of a film, with cherry
   * petals drifting over it and music that loops (starts on the first click).
   */
  scene?: {
    image: string;
    alt: string;
    music: { m4a: string; mp3: string };
    /** A cut-out (transparent above) laid along the foot of the page, as if petals had gathered there. */
    carpet?: string;
  };
  /**
   * Optional 3D opening: the watch alone, head-on at the centre of the screen,
   * turning to follow the pointer, with the brand's name set huge behind it.
   */
  watchHero?: {
    model: string;
    label: string;
    /** Up to four notes in frosted panes at the screen's corners, read on hover. */
    notes?: { title: string; text: string; /** e.g. "en" for a brand name, so capitals are not Turkish-dotted. */ lang?: string }[];
  };
  /** Optional 3D showcase after the opening: the watch performs as the page scrolls. */
  showcase?: BrandShowcaseDef;
  /**
   * Optional 3D opening instead of a film: the watch from the side under the
   * brand's name, turning onto the name on its dial and onto its bracelet,
   * then swaying behind the collection.
   */
  stage?: BrandStageDef;
  /**
   * Palette. `gold`: the brand page has a warm white ground with gold accents,
   * and its home page tile name is set in gold (use a gold `logo` with it).
   */
  theme?: "gold";
  /** Logo used on the brand page itself, when it differs from `logo`. */
  pageLogo?: string;
};

export type BrandStageDef = {
  /** .glb path. */
  model: string;
  /** Centre of the watch head in model units. */
  pivot: [number, number, number];
  /** Poses, timings and turns live in stages.json under the brand's slug (edited at /yonetim/donusler). */
  /** Small line above the name, e.g. "1946'dan beri · Tokyo". */
  eyebrow: string;
  /** What is said beside the close-ups: the name on the dial, then the bracelet. */
  lines: [StageLineDef, StageLineDef];
  /** After the collection: the watch dropping into water and coming to rest in it (played once). */
  film?: { drop: StageFilm & { poster: string } };
  /** In the water: the title as the watch goes in, then eyebrow and text beside it. */
  water?: { eyebrow: string; title: string; accent: string; text: string };
};

export type StageFilm = { mp4: string; mobile: string; webm: string };

export type StageLineDef = {
  /** Side of the screen the line sits on (the watch is on the other side). */
  side: "left" | "right";
  title: string;
  /** The word of the title set in the accent colour. */
  accent: string;
  text: string;
};

export type BrandShowcaseDef = {
  /** .glb path. */
  model: string;
  /** Centre of the watch head in model units. */
  pivot: [number, number, number];
  /** Four feature turns, in order. */
  beats: ShowcaseBeat[];
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
