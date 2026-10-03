import { pose } from "@/lib/scene/pose";
import type { Brand } from "./types";

/**
 * The houses the boutique carries. Brand pages live at /markalar/[slug].
 * `logo` is the ivory-on-transparent mark shown on the home page brand tiles
 * (public/assets/images/brands/). `film` (public/assets/video/brands/) loops
 * behind the logo at the top of the brand page, and the watches follow it; an
 * optional `showcase` performs a 3D model
 * after it (public/assets/models/). `stage` opens the page on a 3D watch instead.
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
    logo: "/assets/images/brands/casio.png",
    stage: {
      model: "/assets/models/casio-watch.glb",
      pivot: [0, 0, 0.62],
      eyebrow: "1946'dan beri · Tokyo",
      poses: {
        // From the side, crown to the lens, the bracelet falling away on both sides.
        intro: pose(0, -0.18, -2.45, -90, 86, 0),
        // Close on the name printed on the dial.
        logo: pose(-0.12, -0.04, -0.8, -360, 0, 0),
        // Over the bracelet's links.
        bracelet: pose(-0.5, 0.22, -2.1, -385, 64, 0),
        // At rest to the right, behind the collection.
        rest: pose(0.55, -0.05, -4.6, -410, 16, -6),
      },
    },
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
    logo: "/assets/images/brands/daniel-klein.png",
  },
  {
    slug: "essence",
    name: "Essence",
    founded: "1979",
    origin: "Seul",
    signature: "Mücevher gibi taşınan zaman.",
    description:
      "Seul'de doğan Essence, sedef kadranlar, taşlı çerçeveler ve mücevher etkili bileziklerle kadın saatlerine odaklanır; her model bir aksesuar kadar dikkatle tasarlanır.",
    cover: "/assets/images/watches/essence-kare-yesil-roma.webp",
    logo: "/assets/images/brands/essence.png",
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
    logo: "/assets/images/brands/freelook-gold.webp",
    film: {
      mp4: "/assets/video/brands/freelook.mp4",
      webm: "/assets/video/brands/freelook.webm",
      poster: "/assets/video/brands/freelook.webp",
    },
    theme: "gold",
  },
];
