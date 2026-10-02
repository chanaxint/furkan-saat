import styles from "./StepFlow.module.css";

/** A process in a single line: numbered steps joined by a hairline. Stacks on phones. */
export function StepFlow({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className={styles.flow}>
      {steps.map((s, i) => (
        <li key={s.title} className={`rise ${styles.step}`} style={{ "--i": i + 2 } as React.CSSProperties}>
          <span className={styles.dot} aria-hidden />
          <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
          <p className={styles.title}>{s.title}</p>
          <p className={styles.text}>{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
