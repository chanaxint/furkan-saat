import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Assurances } from "@/components/product/Assurances";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionMarker } from "@/components/ui/SectionMarker";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Hakkımızda — Furkan Saat",
  description: "Furkan Saat: Nevşehir'de seçkin saatler için özel bir ev. Hikâyemiz, yaklaşımımız ve hizmetlerimiz.",
};

const CHAPTERS = [
  {
    title: "Hikayemiz",
    text: "Furkan Saat, saati bir aksesuar değil, kuşaktan kuşağa geçen bir emanet olarak görenler için kuruldu. Nevşehir'deki butiğimizde, dünyanın en saygın saat evlerinden seçilmiş parçaları sakin ve özenli bir ortamda sunuyoruz.",
  },
  {
    title: "Yaklaşımımız",
    text: "Az ama doğru saat. Koleksiyonumuza giren her parça; geçmişi, durumu ve belgeleriyle tek tek değerlendirilir. Bir saati satmaktan önce, onu doğru kişiyle buluşturmayı önemsiyoruz.",
  },
  {
    title: "Uzmanlığımız",
    text: "Referans ve seri numarası doğrulaması, mekanizma incelemesi ve durum raporlaması atölyemizde yapılır. Satın alma, satış ve takas süreçlerinde aynı titizlikle yanınızdayız.",
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="Hakkımızda"
          title="Seçkin saatler için *özel bir ev*"
          lede="Nevşehir'de, randevuyla ve acele etmeden."
        />

        <figure className={`container ${styles.figure}`}>
          {[
            ["/assets/images/watches/essence-kare-yesil-roma.webp", "Essence kare yeşil kadranlı saat"],
            ["/assets/images/watches/casio-edifice-efr-s108de-3av.webp", "Casio Edifice Slim Sapphire"],
          ].map(([src, alt], i) => (
            <div key={src} className={styles.image}>
              <Image src={src} alt={alt} fill sizes="(max-width: 900px) 100vw, 45vw" priority={i === 0} />
            </div>
          ))}
        </figure>

        <section className={`container ${styles.chapters}`}>
          {CHAPTERS.map((c, i) => (
            <article key={c.title} className={styles.chapter}>
              <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
              <h2 className={`t-display ${styles.title}`}>{c.title}</h2>
              <p className={`t-lead ${styles.text}`}>{c.text}</p>
            </article>
          ))}
        </section>

        <section className={`container ${styles.assurances}`} aria-label="Güvence">
          <SectionMarker label="Her saatle birlikte" />
          <Assurances />
        </section>

        <section className={`container ${styles.visit}`}>
          <p className={`t-display ${styles.visitTitle}`}>
            Butiğimizde <em>tanışalım.</em>
          </p>
          <ButtonLink href="/ozel-gosterim">Randevu alın</ButtonLink>
        </section>
      </main>
      <Footer />
    </>
  );
}
