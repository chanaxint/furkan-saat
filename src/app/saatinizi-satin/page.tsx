import type { Metadata } from "next";
import { SellWatchForm } from "@/components/forms/SellWatchForm";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceLayout, ServicePoints } from "@/components/ui/ServiceLayout";

export const metadata: Metadata = {
  title: "Saatinizi Satın — Furkan Saat",
  description: "Saatinizin değerlemesini isteyin: uzman inceleme, şeffaf teklif ve güvenli ödeme.",
};

export default function SellYourWatchPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Saatinizi satın"
          title="Saatinizi *satın*"
          lede="Saatinizi anlatın; uzmanlarımız inceleyip size açık ve bağlayıcı bir teklif sunsun."
        />
        <ServiceLayout
          aside={
            <ServicePoints
              items={[
                { title: "Bilgileri gönderin", text: "Marka, referans, durum ve birkaç fotoğraf ilk değerleme için yeterli." },
                { title: "Ön değerleme", text: "Genellikle bir iş günü içinde piyasa verilerine dayanan bir fiyat aralığıyla dönüş yaparız." },
                { title: "İnceleme ve teklif", text: "Saatiniz butikte uzmanlarımızca incelenir, bağlayıcı teklif yazılı olarak sunulur." },
                { title: "Ödeme", text: "Teklifi kabul ettiğinizde ödeme aynı gün, banka havalesiyle yapılır." },
              ]}
            />
          }
        >
          <SellWatchForm />
        </ServiceLayout>
      </main>
      <Footer />
    </>
  );
}
