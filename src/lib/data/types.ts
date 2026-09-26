export type Tone = "green" | "deep" | "ivory" | "stone" | "champagne" | "wine";

export type WatchType = "Klasik" | "Spor" | "Kronograf" | "Komplikasyon" | "Mücevher";
export type Material = "Çelik" | "Beyaz Altın" | "Kırmızı Altın" | "Sarı Altın" | "Platin" | "Titanyum" | "Karbon";
export type Movement = "Otomatik" | "Manuel" | "Kuvars";

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
