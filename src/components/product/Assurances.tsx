import Link from "next/link";
import { ASSURANCES } from "@/lib/data/site";
import styles from "./Assurances.module.css";

/** The four promises every watch carries. `compact` is the watch-page variant. */
export function Assurances({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={styles.list} data-compact={compact || undefined}>
      {ASSURANCES.map((a, i) => (
        <li key={a.title} className={styles.item}>
          <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
          <h3 className={styles.title}>{a.title}</h3>
          <p className={styles.text}>{a.text}</p>
          <Link href={a.href} className={styles.more}>
            Ayrıntılar
          </Link>
        </li>
      ))}
    </ul>
  );
}
