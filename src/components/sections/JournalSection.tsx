import { ArticleCard } from "@/components/journal/ArticleCard";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SplitText } from "@/components/ui/SplitText";
import { getArticles } from "@/lib/services/catalog";
import styles from "./JournalSection.module.css";

/** 06 — JOURNAL. The latest article large, two more beside it. */
export async function JournalSection() {
  const [featured, ...rest] = await getArticles();
  return (
    <section className={styles.section} id="dergi" data-nav-theme="light" aria-label="Dergi">
      <div className="container">
        <header className={styles.header}>
          <SplitText text={"Saatçiliğin\n*dünyası*"} className={`t-display ${styles.heading}`} />
        </header>
        <div className={styles.layout}>
          <ArticleCard article={featured} />
          <ul className={styles.side}>
            {rest.slice(0, 2).map((a) => (
              <li key={a.slug}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.footer}>
          <ArrowLink href="/dergi">Tüm yazılar</ArrowLink>
        </div>
      </div>
    </section>
  );
}
