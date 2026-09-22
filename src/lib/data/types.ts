export type Tone = "green" | "deep" | "ivory" | "stone" | "champagne" | "wine";

export type WatchType = "Dress" | "Sport" | "Chronograph" | "Complication" | "Jewellery";
export type Material = "Steel" | "White Gold" | "Rose Gold" | "Yellow Gold" | "Platinum" | "Titanium" | "Carbon";
export type Movement = "Automatic" | "Manual" | "Quartz";

export type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string;
  type: WatchType;
  material: Material;
  movement: Movement;
  diameter: string;
  /** Price in EUR. `null` = price upon request. */
  price: number | null;
  /** Placeholder tone until photography is available. */
  tone: Tone;
  /** Future product photography (jpg/png/webp). */
  image: string | null;
  href: string;
};

export type House = {
  id: string;
  name: string;
  founded: string;
  origin: string;
  signature: string;
  description: string;
  tone: Tone;
  media: { image: string | null; video: string | null };
  href: string;
};

export type Story = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  tone: Tone;
  media: { image: string | null; video: string | null };
  href: string;
};
