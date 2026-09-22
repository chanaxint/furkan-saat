import styles from "./StoryIndex.module.css";

const CHAPTERS = ["Opening", "Reveal", "Craft"];

/** Chapter rail on the pinned stage (desktop only). Driven by --story. */
export function StoryIndex() {
  return (
    <div className={styles.rail} aria-hidden>
      <div className={styles.track}>
        <span className={styles.fill} />
      </div>
      <ol className={styles.list}>
        {CHAPTERS.map((c, i) => (
          <li key={c} className={styles.item} style={{ ["--i" as string]: i }}>
            <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
            <span>{c}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
