/**
 * Brand reels — the four tiles after the opening ("ve daha fazlası").
 * Each clip (720×900, muted; WebM + MP4) starts on the brand's logo and morphs into a
 * watch; the poster is its first frame. `id` is the brand slug — tiles open /markalar/[id].
 */
export type BrandReel = { id: string; brand: string; video: string; webm: string; poster: string };

const dir = "/assets/video/brands";

export const BRAND_REELS: BrandReel[] = [
  { id: "rolex", brand: "Rolex", video: `${dir}/rolex.mp4`, webm: `${dir}/rolex.webm`, poster: `${dir}/rolex.webp` },
  { id: "patek-philippe", brand: "Patek Philippe", video: `${dir}/patek-philippe.mp4`, webm: `${dir}/patek-philippe.webm`, poster: `${dir}/patek-philippe.webp` },
  { id: "jacob-co", brand: "Jacob & Co.", video: `${dir}/jacob-co.mp4`, webm: `${dir}/jacob-co.webm`, poster: `${dir}/jacob-co.webp` },
  { id: "mercedes-benz", brand: "Mercedes-Benz", video: `${dir}/mercedes-benz.mp4`, webm: `${dir}/mercedes-benz.webm`, poster: `${dir}/mercedes-benz.webp` },
];
