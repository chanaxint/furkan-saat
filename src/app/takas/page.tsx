import type { Metadata } from "next";
import { TradeInForm } from "@/components/forms/TradeInForm";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { StepFlow } from "@/components/ui/StepFlow";
import styles from "../service.module.css";

export const metadata: Metadata = {
  title: "Takas — Furkan Saat",
  description: "Mevcut saatinizi değerine sayarak koleksiyonumuzdan yeni bir saat alın.",
};

const STEPS = [
  { title: "Saatiniz", text: "Takasa vermek istediğiniz saati ve almak istediğinizi bize anlatın." },
  { title: "Değerleme", text: "Saatiniz uzmanlarımızca incelenir; referans, mekanizma ve durum doğrulanır." },
  { title: "Teklif", text: "Saatiniz için yazılı ve bağlayıcı bir takas değeri sunarız." },
  { title: "Yeni saatiniz", text: "Koleksiyondan seçtiğiniz saat sizin için ayrılır ve hazırlanır." },
  { title: "Fark ödemesi", text: "Yalnızca iki saat arasındaki farkı ödersiniz; teslimat butikte ya da sigortalı gönderimle." },
];

export default function TradeInPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Takas"
          title="*Takas*"
          lede="Mevcut saatinizi değerine sayalım; yeni saatiniz için yalnızca farkı ödeyin."
        />
        <div className={`container ${styles.flow}`}>
          <StepFlow steps={STEPS} />
        </div>
        <div className={`container ${styles.narrow}`}>
          <TradeInForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
