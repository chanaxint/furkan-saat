import type { Metadata } from "next";
import Image from "next/image";
import { PrivateViewingForm } from "@/components/forms/PrivateViewingForm";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceLayout, ServicePoints } from "@/components/ui/ServiceLayout";
import { BOUTIQUE } from "@/lib/data/site";
import styles from "../service.module.css";

export const metadata: Metadata = {
  title: "Özel Gösterim — Furkan Saat",
  description: "Saatleri İstanbul butiğimizde, size ayrılmış bir saatte ve acele etmeden inceleyin.",
};

export default function PrivateViewingPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Özel gösterim"
          title="Özel *gösterim*"
          lede="Saatleri butiğimizde, yalnızca size ayrılmış bir saatte ve acele etmeden inceleyin."
        />
        <ServiceLayout
          aside={
            <>
              <div className={styles.image}>
                <Image
                  src="/assets/images/watches/rolex-submariner-126619lb-3.webp"
                  alt="Rolex Submariner 126619LB kadranı, yakın plan"
                  fill
                  sizes="(max-width: 900px) 100vw, 36vw"
                  priority
                />
              </div>
              <ServicePoints
                items={[
                  { title: "Size ayrılmış bir saat", text: "Randevunuz boyunca butik yalnızca sizin içindir." },
                  { title: "Saatler hazır", text: "Belirttiğiniz saatler gelişinizden önce hazırlanır; dilerseniz benzerleri de." },
                  { title: "Uzman eşliğinde", text: `${BOUTIQUE.address}. ${BOUTIQUE.hours}.` },
                ]}
              />
            </>
          }
        >
          <PrivateViewingForm />
        </ServiceLayout>
      </main>
      <Footer />
    </>
  );
}
