/**
 * Boutique details and site-wide content in one place.
 * Placeholder contact details — replace with the real ones before going live.
 */
export const BOUTIQUE = {
  name: "Furkan Saat",
  city: "İstanbul",
  address: "Nişantaşı, Şişli — İstanbul",
  hours: "Randevu ile · Pazartesi – Cumartesi, 10.00 – 19.00",
  email: "concierge@furkansaat.com",
  phone: "+90 212 000 00 00",
  /** International format, digits only — used for wa.me links. */
  whatsapp: "902120000000",
  instagram: "https://instagram.com",
  mapUrl: "https://maps.google.com/?q=Ni%C5%9Fanta%C5%9F%C4%B1+%C4%B0stanbul",
};

/** Bank transfer details shown after checkout. Placeholder — replace with the real account. */
export const BANK = {
  holder: "Furkan Saat",
  bank: "Banka adı",
  iban: "TR00 0000 0000 0000 0000 0000 00",
};

/** The watch staged in the box-opening film on the home page. */
export const NEW_ARRIVAL_SLUG = "jacob-co-skeleton-tourbillon";

export type NavLink = { label: string; href: string };

/** Main navigation (desktop bar and menu drawer). */
export const NAV_LINKS: NavLink[] = [
  { label: "Koleksiyon", href: "/koleksiyon" },
  { label: "Markalar", href: "/markalar" },
  { label: "Dergi", href: "/dergi" },
  { label: "Hakkımızda", href: "/hakkimizda" },
  { label: "İletişim", href: "/iletisim" },
];

export const FOOTER_COLUMNS: { title: string; links: NavLink[] }[] = [
  {
    title: "Mağaza",
    links: [
      { label: "Koleksiyon", href: "/koleksiyon" },
      { label: "Koleksiyonlar", href: "/koleksiyonlar" },
      { label: "Markalar", href: "/markalar" },
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
