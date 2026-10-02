import type { Brand } from "./types";

/** Every house the boutique represents. Brand pages live at /markalar/[slug]. */
export const BRANDS: Brand[] = [
  {
    slug: "rolex",
    name: "Rolex",
    founded: "1905",
    origin: "Cenevre",
    signature: "Kalıcılığın ölçüsü.",
    description:
      "Bir asırlık sessiz kararlılık: Oyster kasalar, kendi alaşımları ve torunlara kadar bakımı yapılabilecek mekanizmalar. Rolex bir saatten çok, bir standarttır.",
  },
  {
    slug: "patek-philippe",
    name: "Patek Philippe",
    founded: "1839",
    origin: "Cenevre",
    signature: "Gelecek nesil için saklanır.",
    description:
      "Cenevre'de hâlâ aile şirketi olarak kalan son büyük manüfaktür. Patek Philippe Mührü'ne göre elle bitirilmiş büyük komplikasyonlar ve modayı asla kovalamayan bir sükûnet.",
  },
  {
    slug: "richard-mille",
    name: "Richard Mille",
    founded: "2001",
    origin: "Les Breuleux",
    signature: "Bilekte bir yarış makinesi.",
    description:
      "Karbon TPT ve grade 5 titanyumdan tonneau kasalar, bir şasi gibi tasarlanmış iskelet kalibreler. Ödün vermeyen, çağdaş haute horlogerie.",
  },
  {
    slug: "audemars-piguet",
    name: "Audemars Piguet",
    founded: "1875",
    origin: "Le Brassus",
    signature: "Vallée de Joux'da doğdu.",
    description:
      "Hâlâ bağımsız, hâlâ doğduğu vadide. Sekizgen Royal Oak çelikte lüksü yeniden tanımladı; komplikasyonlar ise kararlılıkla el işçiliğiyle üretilir.",
  },
  {
    slug: "cartier",
    name: "Cartier",
    founded: "1847",
    origin: "Paris",
    signature: "İlk komplikasyon: form.",
    description:
      "Tank, Santos, Crash — dile dönüşmüş biçimler. Paris'in tasarım disiplini, La Chaux-de-Fonds'daki İsviçre saatçiliğiyle buluşur.",
  },
  {
    slug: "jacob-co",
    name: "Jacob & Co.",
    founded: "1986",
    origin: "New York · Cenevre",
    signature: "Hareket hâlindeki evren.",
    description:
      "Yörüngede dönen tourbillonlar, taşlarla bezeli küreler ve mekanik bir tiyatro. Marka komplikasyonu bir gösteriye, gösteriyi de ciddi bir zanaate dönüştürür.",
  },
  {
    slug: "vacheron-constantin",
    name: "Vacheron Constantin",
    founded: "1755",
    origin: "Cenevre",
    signature: "Kesintisiz iki yüz yetmiş yıl.",
    description:
      "Kuruluşundan bu yana üretimine hiç ara vermemiş en eski manüfaktür. Malta haçı, Cenevre Mührü ve el gravürünün sessiz ustalığı.",
  },
  {
    slug: "omega",
    name: "Omega",
    founded: "1848",
    origin: "Biel/Bienne",
    signature: "Ay'a giden saat.",
    description:
      "Speedmaster'ın Apollo yolculukları, Seamaster'ın denizleri ve Co-Axial eşapmanın mühendisliği. Kronometrinin en tutarlı adreslerinden biri.",
  },
  {
    slug: "breguet",
    name: "Breguet",
    founded: "1775",
    origin: "Paris · L'Abbaye",
    signature: "Tourbillonun evi.",
    description:
      "Abraham-Louis Breguet'nin icatları bugün hâlâ saatçiliğin alfabesi: tourbillon, Breguet ibreleri ve guilloché kadranlar.",
  },
  {
    slug: "hublot",
    name: "Hublot",
    founded: "1980",
    origin: "Nyon",
    signature: "Füzyon sanatı.",
    description:
      "Altını kauçukla buluşturarak başlayan cesur bir çizgi. Seramik, safir ve kendi alaşımlarıyla malzemeyi tasarımın merkezine koyar.",
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    founded: "1926",
    origin: "Stuttgart",
    signature: "Yoldan bileğe.",
    description:
      "Mercedes-Benz'in tasarım dilini taşıyan saatler: üç köşeli yıldız, sade kadranlar ve otomobil ustalığından ilham alan detaylar.",
    film: { dir: "/assets/video/mercedes", count: 240, accent: "Saatleri" },
  },
];
