import styles from "./Marquee.module.css";

/** A band of the house name running past, endlessly. */
export function Marquee({ text = "Furkan Saat", count = 8 }: { text?: string; count?: number }) {
  const items = Array.from({ length: count }, (_, i) => (
    <span key={i} className={styles.item}>
      {text}
      <span className={styles.dot} aria-hidden>
        ✦
      </span>
    </span>
  ));
  return (
    <div className={styles.band} aria-hidden>
      {/* Two identical runs: when the first has gone by, the second is exactly in its place. */}
      <div className={styles.track}>
        <div className={styles.run}>{items}</div>
        <div className={styles.run}>{items}</div>
      </div>
    </div>
  );
}
