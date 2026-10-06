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
    tile: "/assets/images/brands/tile-casio.webp",
    stage: {
      model: "/assets/models/casio-watch.glb",
      pivot: [0, 0, 0.62],
      eyebrow: "1946'dan beri · Tokyo",
      lines: [
        {
          side: "left",
          title: "Yeşil kronograf kadran",
          accent: "kadran",
          text: "Üç alt kadran, tarih penceresi ve 50 metre su geçirmezlik; derin yeşil kadranın üzerinde Casio imzası.",
        },
        {
          side: "right",
          title: "Paslanmaz çelik bilezik",
          accent: "bilezik",
          text: "Üç sıra halkalı paslanmaz çelik bilezik; katlanır kilidiyle bileğe tam oturur.",
        },
      ],
      film: {
        drop: {
          mp4: "/assets/video/brands/casio-water-drop.mp4",
          mobile: "/assets/video/brands/casio-water-drop-mobile.mp4",
          webm: "/assets/video/brands/casio-water-drop.webm",
          poster: "/assets/video/brands/casio-water-drop.jpg",
        },
      },
      water: {
        eyebrow: "50 metre · 5 bar",
        title: "Su geçirmez",
        accent: "geçirmez",
        text: "Yağmurda, el yıkarken, denizde ve havuzda kısa süreli yüzmede gönül rahatlığıyla takın.",
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
    tile: "/assets/images/brands/tile-daniel-klein.webp",
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
    tile: "/assets/images/brands/tile-essence.webp",
    scene: {
      image: "/assets/images/brands/essence-sakura.jpg",
      alt: "Kiraz çiçekleri altında taş yolda duran sedef kadranlı, taşlı çerçeveli Essence saat",
      music: { m4a: "/assets/audio/essence-japon.m4a", mp3: "/assets/audio/essence-japon.mp3" },
      carpet: "/assets/images/brands/essence-petal-foot.webp",
    },
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
    tile: "/assets/images/brands/tile-freelook.webp",
    film: {
      mp4: "/assets/video/brands/freelook.mp4",
      webm: "/assets/video/brands/freelook.webm",
      poster: "/assets/video/brands/freelook.webp",
    },
    theme: "gold",
  },
];
