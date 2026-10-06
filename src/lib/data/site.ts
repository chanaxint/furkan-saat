import settings from "./settings.json";

/**
 * Boutique details and site-wide content in one place. Contact and bank
 * details live in settings.json (editable from /yonetim/ayarlar).
 * Placeholder values — replace with the real ones before going live.
 */
export type Settings = {
  boutique: {
    name: string;
    city: string;
    address: string;
    hours: string;
    email: string;
    phone: string;
    /** International format, digits only — used for wa.me links. */
    whatsapp: string;
    instagram: string;
    mapUrl: string;
  };
  bank: { holder: string; bank: string; iban: string };
};

export const BOUTIQUE: Settings["boutique"] = settings.boutique;

/** Bank transfer details shown after checkout. Placeholder — replace with the real account. */
export const BANK: Settings["bank"] = settings.bank;

export type NavLink = { label: string; href: string };

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "Mağaza",
    links: [
      { label: "Koleksiyon", href: "/#koleksiyon" },
      { label: "Markalar", href: "/#markalar" },
      { label: "Dergi", href: "/dergi" },
      { label: "Karşılaştır", href: "/karsilastir" },
    ],
  },
  {
    title: "Hizmetler",
    links: [
      { label: "Özel gösterim", href: "/ozel-gosterim" },
      { label: "Saatinizi satın", href: "/saatinizi-satin" },
      { label: "Takas", href: "/takas" },
      { label: "Orijinallik", href: "/orijinallik" },
    ],
  },
  {
    title: "Yardım",
    links: [
      { label: "Sık sorulanlar", href: "/sss" },
      { label: "Teslimat", href: "/teslimat" },
      { label: "İade", href: "/iade" },
      { label: "Garanti", href: "/garanti" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "İletişim", href: "/iletisim" },
      { label: "Hesabım", href: "/hesap" },
    ],
  },
];

/** The promises every watch carries — shown on the home page and on each watch page. */
export const ASSURANCES = [
  {
    title: "Orijinallik garantisi",
    href: "/orijinallik",
    text: "Her saat, referans ve seri numarası doğrulanarak; kasa, kadran ve mekanizması tek tek incelenerek satışa sunulur.",
  },
  {
    title: "Uzman inceleme",
    href: "/orijinallik",
    text: "Mekanizma, su geçirmezlik ve hassasiyet testleri atölyemizde yapılır; durum raporu saatle birlikte teslim edilir.",
  },
  {
    title: "Güvenli teslimat",
    href: "/teslimat",
    text: "Sigortalı, takipli ve imza karşılığı gönderim. Dilerseniz saatinizi butikte, özel bir randevuyla teslim alın.",
  },
  {
    title: "Garanti ve iade",
    href: "/garanti",
    text: "Her saat Furkan Saat garantisiyle teslim edilir. Teslimden sonraki 14 gün içinde, kullanılmamış saatler için iade kabul edilir.",
  },
];
