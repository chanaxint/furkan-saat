import { Footer } from "@/components/layout/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import type { InfoPage } from "@/lib/data/info";
import { InfoNav } from "./InfoNav";
import styles from "./InfoPageView.module.css";

/**
 * The frame of every information page: the page's own sections beside a quiet
 * index of the others. `grid` sets the sections in two columns (orijinallik).
 */
export function InfoPageView({ page, grid = false }: { page: InfoPage; grid?: boolean }) {
  return (
    <>
      <main className="page" data-nav-theme="light">
        <PageHeader marker={page.name} title={page.title} lede={page.lede} />
        <div className={`container ${styles.layout}`}>
          <InfoNav current={page.slug} />
          <div>
            <ol className={styles.sections} data-grid={grid || undefined}>
              {page.sections.map((s, i) => (
                <li key={s.title} className={styles.section}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <h2 className={styles.title}>{s.title}</h2>
                  <div className={styles.text}>
                    {s.text.map((t) => (
                      <p key={t}>{t}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.help}>
              <p>Sorunuzun yanıtını bulamadınız mı?</p>
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
