import type { ReactNode } from "react";
import { SectionMarker } from "./SectionMarker";
import styles from "./PageHeader.module.css";

/**
 * Opening of every inner page: small marker, a light serif title, one line of
 * context. `*word*` in the title is set as the accent (em).
 */
export function PageHeader({
  marker,
  title,
  lede,
  aside,
}: {
  marker?: string;
  title: string;
  lede?: ReactNode;
  aside?: ReactNode;
}) {
  const parts = title.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <header className={`container ${styles.header}`}>
      {marker && (
        <div className="rise">
          <SectionMarker label={marker} />
        </div>
      )}
      <h1 className={`t-display rise ${styles.title}`} style={{ "--i": 1 } as React.CSSProperties}>
        {parts.map((p, i) => (p.startsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : p))}
      </h1>
      {lede && (
        <p className={`t-lead rise ${styles.lede}`} style={{ "--i": 2 } as React.CSSProperties}>
          {lede}
        </p>
      )}
      {aside && <div className={styles.aside}>{aside}</div>}
    </header>
  );
}
