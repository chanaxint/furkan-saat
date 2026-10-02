import type { ArticleBlock } from "@/lib/data/types";
import styles from "./ArticleBody.module.css";

/** Renders an article: paragraphs, subheads and pull quotes in one reading column. */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className={styles.body}>
      {blocks.map((b, i) =>
        b.type === "h" ? (
          <h2 key={i} className={styles.h}>
            {b.text}
          </h2>
        ) : b.type === "quote" ? (
          <blockquote key={i} className={styles.quote}>
            {b.text}
          </blockquote>
        ) : (
          <p key={i} className={styles.p}>
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}
