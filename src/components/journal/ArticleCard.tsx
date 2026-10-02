import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/data/types";
import { formatDate } from "@/lib/format";
import styles from "./ArticleCard.module.css";

/** An article in a list. `feature` sets the cover large beside the text. */
export function ArticleCard({ article, feature = false, priority = false }: { article: Article; feature?: boolean; priority?: boolean }) {
  return (
    <Link href={`/dergi/${article.slug}`} className={styles.card} data-feature={feature || undefined}>
      <div className={styles.media}>
        <Image
          src={article.cover}
          alt=""
          fill
          priority={priority}
          sizes={feature ? "(max-width: 900px) 100vw, 55vw" : "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"}
          className={styles.image}
        />
      </div>
      <div className={styles.text}>
        <p className={styles.meta}>
          <span>{article.category}</span>
          <span>{article.readTime}</span>
        </p>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.excerpt}>{article.excerpt}</p>
        <p className={styles.date}>{formatDate(article.date)}</p>
      </div>
    </Link>
  );
}
