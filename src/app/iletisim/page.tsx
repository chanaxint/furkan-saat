import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { BOUTIQUE } from "@/lib/data/site";
import { mailtoUrl, whatsappUrl } from "@/lib/services/enquiries";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "İletişim — Furkan Saat",
  description: "Furkan Saat İstanbul butiği: adres, çalışma saatleri, telefon, WhatsApp ve özel randevu.",
};

export default function ContactPage() {
  const rows = [
    { label: "Adres", value: BOUTIQUE.address, href: BOUTIQUE.mapUrl, external: true, action: "Haritada açın" },
    { label: "Çalışma saatleri", value: BOUTIQUE.hours },
    { label: "Telefon", value: BOUTIQUE.phone, href: `tel:${BOUTIQUE.phone.replace(/\s/g, "")}`, action: "Arayın" },
    { label: "WhatsApp", value: `+${BOUTIQUE.whatsapp}`, href: whatsappUrl("Merhaba,"), external: true, action: "Yazın" },
    { label: "E-posta", value: BOUTIQUE.email, href: `mailto:${BOUTIQUE.email}`, action: "Yazın" },
  ];

  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader
          marker="İletişim"
          title="Butikte, *randevuyla*"
          lede="Bir saati incelemek, satmak ya da takas etmek için bize ulaşın; size ayrılmış bir saat belirleyelim."
        />

        <div className={`container ${styles.layout}`}>
          <dl className={styles.rows}>
            {rows.map((r) => (
              <div key={r.label} className={styles.row}>
                <dt>{r.label}</dt>
                <dd>
                  <span>{r.value}</span>
                  {r.href && (
                    <a href={r.href} {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})} className={styles.action}>
                      {r.action}
                    </a>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <aside className={styles.appointment}>
            <p className={styles.label}>Özel randevu</p>
            <p className={`t-display ${styles.title}`}>
              Saatleri sakin bir ortamda, <em>acele etmeden</em> inceleyin.
            </p>
            <p className={styles.text}>
              Görmek istediğiniz saatleri ve size uygun günü yazın; randevunuzu teyit edelim.
            </p>
            <div className={styles.actions}>
              <ButtonLink
                href={whatsappUrl("Merhaba, butikte özel bir randevu almak istiyorum.")}
                external
                variant="solid"
              >
                WhatsApp ile randevu
              </ButtonLink>
              <ButtonLink
                href={mailtoUrl("Özel randevu talebi", "Merhaba,\n\nButikte özel bir randevu almak istiyorum.\n\nTercih ettiğim gün ve saat:\nGörmek istediğim saatler:\n")}
              >
                E-posta ile
              </ButtonLink>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
