import type { InfoSection } from "./types";

/**
 * Information pages and FAQ. Draft wording — have the policies (shipping,
 * returns, warranty) checked against the boutique's actual terms before launch.
 */
export type InfoPage = {
  slug: string;
  /** Short name for navigation. */
  name: string;
  title: string;
  lede: string;
  sections: InfoSection[];
};

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "orijinallik",
    name: "Orijinallik",
    title: "Orijinallik *güvencesi*",
    lede: "Satışa sunduğumuz her saat, vitrine çıkmadan önce aynı titiz incelemeden geçer.",
    sections: [
      {
        title: "Orijinallik garantisi",
        text: [
          "Furkan Saat'ten aldığınız her saatin orijinal olduğunu garanti ederiz. Herhangi bir parçanın orijinal olmadığı ortaya çıkarsa, ödediğiniz bedelin tamamını iade ederiz.",
        ],
      },
      {
        title: "Uzman inceleme",
        text: [
          "Saat, deneyimli bir saat ustası tarafından kasası açılarak incelenir. Kasa, kadran, ibreler, kordon ve kurma kolu üretici standartlarıyla karşılaştırılır.",
        ],
      },
      {
        title: "Referans doğrulaması",
        text: [
          "Referans ve seri numaraları birbiriyle ve belgelerle eşleştirilir; üretim yılı, kadran ve çerçeve gibi detayların o referansla uyumlu olduğu kontrol edilir.",
        ],
      },
      {
        title: "Mekanizma incelemesi",
        text: [
          "Kalibre doğrulanır; hassasiyet, genlik ve güç rezervi ölçülür. Gerekirse saat, satıştan önce bakıma alınır.",
        ],
      },
      {
        title: "Durum raporu",
        text: [
          "Kasa ve bilezikteki izler, cam, kadran ve çalışma değerleri yazılı bir raporda toplanır. Rapor fotoğraflarıyla birlikte saatle teslim edilir.",
        ],
      },
      {
        title: "Belgelendirme",
        text: [
          "Saatin mevcut kutusu, garanti belgesi ve bakım kayıtları açıkça belirtilir. Eksik bir belge varsa bunu satıştan önce söyleriz.",
        ],
      },
    ],
  },
  {
    slug: "teslimat",
    name: "Teslimat",
    title: "Teslimat ve *gönderim*",
    lede: "Her saat sigortalı, takipli ve imza karşılığı gönderilir.",
    sections: [
      {
        title: "Gönderim",
        text: [
          "Türkiye içindeki siparişler, ödemenin onaylanmasından sonra 1–3 iş günü içinde sigortalı ve takipli olarak gönderilir. Gönderim ücretsizdir.",
          "Paket, saatin markası belli olmayacak şekilde sade bir ambalajla hazırlanır.",
        ],
      },
      {
        title: "Teslim alma",
        text: [
          "Teslimat yalnızca alıcının kendisine, kimlik kontrolü ve imza karşılığı yapılır. Dilerseniz saatinizi Nevşehir butiğimizde, özel bir randevuyla teslim alabilirsiniz.",
        ],
      },
      {
        title: "Yurt dışı",
        text: [
          "Yurt dışı gönderimler için danışmanlarımızla iletişime geçin. Gümrük vergileri ve ithalat masrafları alıcıya aittir.",
        ],
      },
    ],
  },
  {
    slug: "iade",
    name: "İade",
    title: "İade ve *değişim*",
    lede: "Saatiniz beklediğiniz gibi değilse, teslimden sonraki 14 gün içinde iade edebilirsiniz.",
    sections: [
      {
        title: "İade koşulları",
        text: [
          "Saat; kullanılmamış, koruyucu bantları sökülmemiş ve teslim edildiği haliyle, tüm kutu, belge ve aksesuarlarıyla birlikte geri gönderilmelidir.",
          "Kişiye özel ayarlanan bilezikler ve özel sipariş saatler iade kapsamı dışındadır.",
        ],
      },
      {
        title: "İade süreci",
        text: [
          "İade talebinizi danışmanlarımıza iletin; sigortalı gönderimi biz ayarlayalım. Saat atölyemizde incelendikten sonra ödemeniz, ödeme yönteminize 5 iş günü içinde iade edilir.",
        ],
      },
      {
        title: "Değişim",
        text: [
          "Saatinizi koleksiyondaki başka bir saatle değiştirmek isterseniz fiyat farkı üzerinden aynı süreç işler.",
        ],
      },
    ],
  },
  {
    slug: "garanti",
    name: "Garanti",
    title: "*Garanti*",
    lede: "Her saat, Furkan Saat garantisiyle teslim edilir.",
    sections: [
      {
        title: "Yeni saatler",
        text: [
          "Yeni ve kullanılmamış saatler, üreticinin uluslararası garantisini taşır. Garanti süresi markaya göre değişir ve saatin belgesinde belirtilir.",
        ],
      },
      {
        title: "İkinci el saatler",
        text: [
          "Daha önce sahiplenilmiş saatlerin mekanizması için teslim tarihinden itibaren 12 ay Furkan Saat garantisi verilir. Garanti, normal kullanımda ortaya çıkan mekanik arızaları kapsar.",
        ],
      },
      {
        title: "Kapsam dışı",
        text: [
          "Darbe, su girişi (saatin su geçirmezlik değerinin dışında kullanım), yetkisiz kişilerce yapılan müdahaleler, kasa ve bilezikteki doğal aşınma garanti kapsamında değildir.",
        ],
      },
      {
        title: "Bakım",
        text: [
          "Garanti süresi dolduktan sonra da saatinizin bakımı ve onarımı için atölyemiz hizmetinizdedir.",
        ],
      },
    ],
  },
];

export const getInfoPage = (slug: string) => INFO_PAGES.find((p) => p.slug === slug)!;

/** Frequently asked questions, grouped. */
export const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Satın alma",
    items: [
      {
        q: "Saatleriniz orijinal mi?",
        a: "Evet. Her saat satıştan önce kasası açılarak incelenir, referans ve seri numaraları doğrulanır. Orijinalliğini garanti ederiz.",
      },
      {
        q: "Fiyatı yazmayan saatler için ne yapmalıyım?",
        a: "Saat sayfasındaki “Bilgi al” ya da WhatsApp bağlantısıyla bize yazın; danışmanlarımız fiyat ve durum bilgisini paylaşır.",
      },
      {
        q: "Online ödeme yapabilir miyim?",
        a: "Siparişinizi siteden verebilir, ödemeyi banka havalesiyle ya da danışmanınızla birlikte (kredi kartı, butikte ödeme) tamamlayabilirsiniz. Saat, ödeme süresince sizin için ayrılır.",
      },
      {
        q: "Saati satın almadan önce görebilir miyim?",
        a: "Elbette. Özel gösterim sayfasından randevu alın; seçtiğiniz saatler gelişinizden önce hazırlanır.",
      },
    ],
  },
  {
    group: "Teslimat ve iade",
    items: [
      { q: "Gönderim ne kadar sürer?", a: "Ödeme onayından sonra Türkiye içinde 1–3 iş günü içinde, sigortalı ve takipli olarak teslim edilir." },
      { q: "İade edebilir miyim?", a: "Kullanılmamış ve teslim edildiği haliyle olan saatleri 14 gün içinde iade edebilirsiniz." },
    ],
  },
  {
    group: "Satış ve takas",
    items: [
      {
        q: "Saatimi size satabilir miyim?",
        a: "Evet. “Saatinizi satın” formundan saatinizin bilgilerini ve fotoğraflarını gönderin; ön değerlemeyle dönüş yaparız.",
      },
      {
        q: "Takas nasıl işler?",
        a: "Saatiniz incelenir ve değeri belirlenir. Koleksiyondan seçtiğiniz saat için yalnızca iki saat arasındaki farkı ödersiniz.",
      },
      {
        q: "Kutusu ya da belgesi olmayan saatleri alıyor musunuz?",
        a: "Evet, ancak belgeler saatin değerini etkiler. Değerlemede bunu açıkça belirtiriz.",
      },
    ],
  },
  {
    group: "Bakım ve garanti",
    items: [
      { q: "Garanti süresi ne kadar?", a: "Yeni saatler üretici garantisi taşır; ikinci el saatlerin mekanizması 12 ay Furkan Saat garantisindedir." },
      { q: "Saatime bakım yaptırabilir miyim?", a: "Atölyemiz satın aldığınız saatlerin bakım ve onarımı için hizmetinizdedir. Randevu için bize yazın." },
    ],
  },
];
