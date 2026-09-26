/**
 * Brand reels — the four tiles after the opening ("ve daha fazlası").
 * Each clip (720×900, muted; WebM + MP4) starts on the brand's logo and morphs into a
 * watch; the poster is its first frame. `href` is the watch shown in the clip.
 */
export type BrandReel = { id: string; brand: string; watch: string; video: string; webm: string; poster: string; href: string };

const dir = "/assets/video/brands";

export const BRAND_REELS: BrandReel[] = [
  { id: "rolex", brand: "Rolex", watch: "Cosmograph Daytona", video: `${dir}/rolex.mp4`, webm: `${dir}/rolex.webm`, poster: `${dir}/rolex.webp`, href: "/collection/rolex-daytona-126506" },
  { id: "patek-philippe", brand: "Patek Philippe", watch: "Calatrava", video: `${dir}/patek-philippe.mp4`, webm: `${dir}/patek-philippe.webm`, poster: `${dir}/patek-philippe.webp`, href: "/collection/patek-5227g" },
  { id: "jacob-co", brand: "Jacob & Co.", watch: "Astronomia Tourbillon", video: `${dir}/jacob-co.mp4`, webm: `${dir}/jacob-co.webm`, poster: `${dir}/jacob-co.webp`, href: "/collection/jacob-astronomia" },
  { id: "mercedes-benz", brand: "Mercedes-Benz", watch: "Klasik Otomatik", video: `${dir}/mercedes-benz.mp4`, webm: `${dir}/mercedes-benz.webm`, poster: `${dir}/mercedes-benz.webp`, href: "/collection/mercedes-benz" },
];
