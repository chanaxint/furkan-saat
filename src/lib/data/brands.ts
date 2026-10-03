import type { Brand } from "./types";

/**
 * The houses the boutique carries. Brand pages live at /markalar/[slug].
 *
 * Home page tile videos: put the clip in public/assets/video/brands/ and add
 *   reel: { mp4: "/assets/video/brands/casio.mp4", poster: "/assets/video/brands/casio.webp" }
 * to the brand. Until then the tile shows the `cover` photograph.
 */
export const BRANDS: Brand[] = [
  {
    slug: "casio",
    name: "Casio",
    founded: "1946",
    origin: "Tokyo",
    signature: "Dayanıklılığın dili.",
    description:
      "1974'te ilk saati Casiotron'u tanıtan Japon üretici; efsanevi F-91W'dan safir camlı Edifice serisine kadar dayanıklılığı ve erişilebilir teknolojisiyle dünyanın en çok takılan saatlerinden bazılarını üretir.",
    cover: "/assets/images/watches/casio-edifice-efb-730d-3av.webp",
  },
  {
    slug: "daniel-klein",
    name: "Daniel Klein",
    founded: "1998",
    origin: "Hong Kong",
    signature: "Herkes için moda.",
    description:
      "Hong Kong merkezli Daniel Klein Group'un imza markası; seksenden fazla ülkede, güncel tasarımı ulaşılabilir kılan saatler. Exclusive serisi çok fonksiyonlu kadranları ve güçlü kasalarıyla öne çıkar.",
    cover: "/assets/images/watches/daniel-klein-exclusive-pembe-kadran.webp",
  },
  {
    slug: "essence",
    name: "Essence",
    founded: "1999",
    origin: "Seul",
    signature: "Mücevher gibi taşınan zaman.",
    description:
      "Seul'de doğan Essence, sedef kadranlar, taşlı çerçeveler ve mücevher etkili bileziklerle kadın saatlerine odaklanır; her model bir aksesuar kadar dikkatle tasarlanır.",
    cover: "/assets/images/watches/essence-kare-yesil-roma.webp",
  },
  {
    slug: "freelook",
    name: "Freelook",
    founded: "1999",
    origin: "Paris",
    signature: "Parisli zarafet, her gün.",
    description:
      "1999'da Paris'te kurulan Freelook, Parisli kadının zahmetsiz zarafetinden ilham alır. Kristal taşlar ve altın detaylar, günlük şıklık için tasarlanmış modellerde buluşur.",
    cover: "/assets/images/watches/freelook-baget-tasli-yesil.webp",
  },
];
