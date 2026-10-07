"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/data/types";
import { ProductCard } from "./ProductCard";
import styles from "./RelatedCarousel.module.css";

/**
 * "Bunlar da ilginizi çekebilir": a row of watches that slides sideways —
 * arrows either side of the row (level with the middle of the photographs,
 * as on the home page's brands) on desktop, a swipe on phones. Each arrow
 * moves by one screenful.
 */
export function RelatedCarousel({ products, title }: { products: Product[]; title: React.ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const t = track.current;
    if (!t) return;
    setEdge({ start: t.scrollLeft < 4, end: t.scrollLeft + t.clientWidth >= t.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const move = (dir: -1 | 1) => {
    const t = track.current;
    if (!t) return;
    const card = t.querySelector("li");
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    const step = card ? card.getBoundingClientRect().width + gap : t.clientWidth;
    const perView = Math.max(1, Math.round(t.clientWidth / step));
    t.scrollBy({ left: dir * step * perView, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.head}>{title}</div>
      <div className={styles.rail}>
        <ul ref={track} className={styles.track} onScroll={measure} data-lenis-prevent-wheel>
          {products.map((p) => (
            <li key={p.slug}>
              <ProductCard product={p} sizes="(max-width: 640px) 70vw, (max-width: 1100px) 34vw, 25vw" />
            </li>
          ))}
        </ul>
        {!(edge.start && edge.end) && (
          <>
            <button type="button" className={styles.arrow} data-side="prev" onClick={() => move(-1)} disabled={edge.start} aria-label="Önceki saatler">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button type="button" className={styles.arrow} data-side="next" onClick={() => move(1)} disabled={edge.end} aria-label="Sonraki saatler">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </>
  );
}
