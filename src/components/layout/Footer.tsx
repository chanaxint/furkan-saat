import Link from "next/link";
import { BOUTIQUE, FOOTER_LINKS, LEGAL_LINKS } from "@/lib/data/navigation";
import styles from "./Footer.module.css";

/** 12 — FOOTER. Quiet, typographic, nothing superfluous. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer} id="contact" data-nav-theme="light">
      <div className={styles.top}>
        <p className={styles.statement}>
          A private house for exceptional timepieces — <em>{BOUTIQUE.city}.</em>
        </p>

        <nav aria-label="Footer" className={styles.nav}>
          <ul>
            {FOOTER_LINKS.map((l) => (
              <li key={l.label}>
                <a href={l.href} {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})} className={styles.link}>
                  {l.label}
                  {l.external && <span aria-hidden> ↗</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.contact}>
          <p className={styles.label}>Contact</p>
          <a href={`mailto:${BOUTIQUE.email}`} className={styles.link}>
            {BOUTIQUE.email}
          </a>
          <p className={styles.muted}>{BOUTIQUE.hours}</p>
        </div>
      </div>

      <p className={`t-display ${styles.wordmark}`} aria-hidden>
        Furkan <em>Saat</em>
      </p>

      <div className={styles.bottom}>
        <p>© {year} Furkan Saat</p>
        <ul className={styles.legal}>
          {LEGAL_LINKS.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className={styles.link}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
