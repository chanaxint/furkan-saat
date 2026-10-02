import type { ReactNode } from "react";
import styles from "./ServiceLayout.module.css";

/** Service pages: a quiet editorial column beside the form. */
export function ServiceLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className={`container ${styles.layout}`}>
      <aside className={styles.aside}>{aside}</aside>
      <section className={styles.form} aria-label="Form">
        {children}
      </section>
    </div>
  );
}

/** Numbered, short points for the editorial column. */
export function ServicePoints({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className={styles.points}>
      {items.map((p, i) => (
        <li key={p.title}>
          <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <p className={styles.pointTitle}>{p.title}</p>
            <p className={styles.pointText}>{p.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
