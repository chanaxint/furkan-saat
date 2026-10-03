import { pose } from "@/lib/scene/pose";
import type { Brand } from "./types";

/**
 * The houses the boutique carries. Brand pages live at /markalar/[slug].
 * `logo` is the ivory-on-transparent mark shown on the home page brand tiles
 * (public/assets/images/brands/). `film` (public/assets/video/brands/) loops
 * behind the logo at the top of the brand page; `showcase` performs a 3D model
 * after it (public/assets/models/).
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
    logo: "/assets/images/brands/freelook.png",
    film: {
      mp4: "/assets/video/brands/freelook.mp4",
      webm: "/assets/video/brands/freelook.webm",
      poster: "/assets/video/brands/freelook.webp",
    },
    theme: "gold",
    pageLogo: "/assets/images/brands/freelook-gold.webp",
    showcase: {
      model: "/assets/models/freelook-watch.glb",
      pivot: [0, 0, 0.6],
      beats: [
        {
          id: "case",
          side: "left",
          title: "Altın kasa",
          accent: "kasa",
          text: "Altın tonlarında, yumuşak hatlarla şekillenen bir kasa; kurma kolu bile özenle işlenmiş.",
          pose: pose(0.5, 0, -3.5, -52, 16, -5),
        },
        {
          id: "bezel",
          side: "right",
          title: "Taşlı çerçeve",
          accent: "çerçeve",
          text: "Çift sıra kristal taşla çevrili çerçeve, her açıdan ışığı yakalar.",
          pose: pose(-0.36, -0.06, -2.15, -372, 34, -4),
        },
        {
          id: "dial",
          side: "left",
          title: "Desenli kadran",
          accent: "kadran",
          text: "Altın desenli kadranın üzerinde üç siyah alt kadran; her biri ince altın bir halkayla çevrili.",
          pose: pose(0.5, 0.02, -2.6, -352, -8, -6),
        },
        {
          id: "bracelet",
          side: "right",
          title: "Altın bilezik",
          accent: "bilezik",
          text: "Geniş halkalı altın bilezik, bileğe ağırlığını hissettirmeden oturur.",
          pose: pose(-0.6, 0.25, -3.1, -385, 62, 0),
        },
      ],
    },
  },
];
