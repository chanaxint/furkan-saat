import type { Metadata } from "next";
import { InfoNav } from "@/components/content/InfoNav";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { FAQ } from "@/lib/data/info";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular — Furkan Saat",
  description: "Satın alma, teslimat, iade, satış, takas ve garanti hakkında sık sorulan sorular.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((g) =>
      g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
    ),
  };
  return (
    <>
      <main className="page" data-nav-theme="light">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <PageHeader marker="Sık sorulanlar" title="Sık sorulan *sorular*" lede="Yanıtını bulamadığınız her soru için danışmanlarımız bir mesaj uzağınızda." />
        <div className={`container ${styles.layout}`}>
          <InfoNav current="sss" />
          <div className={styles.groups}>
            {FAQ.map((g) => (
              <section key={g.group} className={styles.group} aria-label={g.group}>
                <h2 className={styles.groupTitle}>{g.group}</h2>
                {g.items.map((i) => (
                  <details key={i.q} className={styles.item}>
                    <summary>
                      <span>{i.q}</span>
                      <span className={styles.icon} aria-hidden />
                    </summary>
                    <p>{i.a}</p>
                  </details>
                ))}
              </section>
            ))}
            <div className={styles.help}>
              <p>Başka bir sorunuz mu var?</p>
              <ButtonLink href="/iletisim" variant="line">
                Bize ulaşın
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
