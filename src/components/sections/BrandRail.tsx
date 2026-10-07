"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./BrandReels.module.css";

/**
 * The brands as a row that slides sideways: arrows either side of the tiles on
 * wide screens (one tile per click), a swipe on touch screens. The tiles stay in
 * their own list (passed as children) so they keep their reveal on scroll.
 */
export function BrandRail({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const track = () => root.current?.querySelector<HTMLUListElement>("ul") ?? null;

  const measure = useCallback(() => {
    const t = track();
    if (!t) return;
    setEdge({ start: t.scrollLeft < 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const t = track();
    measure();
    t?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      t?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const move = (dir: -1 | 1) => {
    const t = track();
    const item = t?.querySelector("li");
    if (!t || !item) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({ left: dir * (item.getBoundingClientRect().width + gap), behavior: "smooth" });
  };

  return (
    <div ref={root}>
      <header className={styles.header}>{title}</header>
      <div className={styles.rail}>
        {children}
        {!(edge.start && edge.end) && (
          <>
            <button type="button" className={styles.arrow} data-side="prev" onClick={() => move(-1)} disabled={edge.start} aria-label="Önceki markalar">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className={styles.arrow} data-side="next" onClick={() => move(1)} disabled={edge.end} aria-label="Sonraki markalar">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
