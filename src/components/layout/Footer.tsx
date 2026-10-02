import Link from "next/link";
import { BOUTIQUE, FOOTER_COLUMNS } from "@/lib/data/site";
import { whatsappUrl } from "@/lib/services/enquiries";
import styles from "./Footer.module.css";

/** Footer: statement, link columns, contact — and the wordmark set large. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer} data-nav-theme="light">
      <div className={styles.top}>
        <p className={styles.statement}>
          Seçkin saatler için özel bir ev — <em>{BOUTIQUE.city}.</em>
        </p>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} className={styles.col}>
            <p className={styles.label}>{col.title}</p>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={styles.link}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

      </div>

      <p className={`t-display ${styles.wordmark}`} aria-hidden>
        Furkan <em>Saat</em>
      </p>

      <div className={styles.bottom}>
        <p>© {year} Furkan Saat</p>
        <ul className={styles.social}>
          <li>
            <a href={BOUTIQUE.instagram} target="_blank" rel="noreferrer" className={styles.link}>
              Instagram
            </a>
          </li>
          <li>
            <a href={whatsappUrl("Merhaba,")} target="_blank" rel="noreferrer" className={styles.link}>
              WhatsApp
            </a>
          </li>
          <li>
            <a href={`mailto:${BOUTIQUE.email}`} className={styles.link}>
              {BOUTIQUE.email}
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
