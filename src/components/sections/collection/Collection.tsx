"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { applyFilters, EMPTY_FILTERS, filterOptions, type FilterKey, type Filters } from "@/lib/data/filters";
import { WATCHES } from "@/lib/data/watches";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { CollectionFilters } from "./CollectionFilters";
import { ProductCard } from "./ProductCard";
import styles from "./Collection.module.css";

const OPTIONS = filterOptions(WATCHES);

/**
 * 07 — THE COLLECTION
 * The shift from storytelling to discovery. Three generous columns with an
 * offset middle column, text-led filters, and slow entrance for each piece.
 */
export function Collection() {
  const root = useRef<HTMLElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const results = useMemo(() => applyFilters(WATCHES, filters), [filters]);

  const onToggle = useCallback((key: FilterKey, value: string) => {
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  }, []);

  // Entrance + re-entrance after filtering.
  useGsap(
    () => {
      if (!grid.current) return;
      ScrollTrigger.refresh();
      if (prefersReducedMotion()) return;
      const items = grid.current.querySelectorAll("[data-item] > *");
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 40 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: grid.current, start: "top 85%", once: true },
        },
      );
    },
    root,
    [results],
  );

  return (
    <section ref={root} className={styles.section} id="collection" data-nav-theme="light" aria-label="The collection">
      <header className={styles.header}>
        <SectionMarker index="07" label="The Collection" />
        <SplitText text={"The *Collection*"} className={`t-display ${styles.heading}`} />
        <p className={styles.lede}>
          Current availability across our six houses. Every piece is authenticated, serviced where required and
          delivered with its original papers.
        </p>
      </header>

      <div className={styles.filters}>
        <CollectionFilters
          options={OPTIONS}
          filters={filters}
          onToggle={onToggle}
          onClear={() => setFilters(EMPTY_FILTERS)}
          count={results.length}
        />
      </div>

      {results.length > 0 ? (
        <ul ref={grid} className={styles.grid}>
          {results.map((w, i) => (
            <li key={w.id} data-item className={styles.item}>
              <ProductCard watch={w} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <p className="t-display t-s">No timepiece matches this selection.</p>
          <p className={styles.emptyText}>Our concierge can source pieces beyond the current collection.</p>
          <button className={styles.reset} onClick={() => setFilters(EMPTY_FILTERS)}>
            Reset filters
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <ArrowLink href="/collection" variant="frame">
          View the full collection
        </ArrowLink>
      </div>
    </section>
  );
}
