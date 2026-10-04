"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ShopRow.module.css";

/**
 * The scrolling row of a ShopRow, with arrows either side: each press moves it
 * on by a page of tiles. An arrow shows only while there is more that way.
 */
export function RowScroller({ children, label }: { children: React.ReactNode; label: string }) {
  const row = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEnds({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);

  const move = (dir: 1 | -1) => {
    const el = row.current;
    const tile = el?.querySelector("li");
    if (!el || !tile) return;
    // A page of whole tiles (at least one).
    const step = tile.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "0");
    const page = Math.max(1, Math.floor((el.clientWidth + 4) / step));
    el.scrollBy({ left: dir * page * step, behavior: "smooth" });
  };

  return (
    <div className={styles.scroller}>
      <ul ref={row} className={styles.row}>
        {children}
      </ul>
      <button
        type="button"
        className={styles.arrow}
        data-side="prev"
        onClick={() => move(-1)}
        disabled={ends.start}
        aria-label={`${label}: önceki saatler`}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.arrow}
        data-side="next"
        onClick={() => move(1)}
        disabled={ends.end}
        aria-label={`${label}: sonraki saatler`}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
