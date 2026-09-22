import styles from "./SectionMarker.module.css";

/** Small editorial chapter marker: "05 — New Arrival". */
export function SectionMarker({ index, label, className = "" }: { index: string; label: string; className?: string }) {
  return (
    <p className={`${styles.marker} ${className}`}>
      <span className={styles.index}>{index}</span>
      <span className={styles.rule} aria-hidden />
      <span>{label}</span>
    </p>
  );
}
