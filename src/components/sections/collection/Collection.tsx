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
    <section ref={root} className={styles.section} id="collection" data-nav-theme="light" aria-label="Koleksiyon">
      <header className={styles.header}>
        <SectionMarker index="07" label="Koleksiyon" />
        <SplitText text={"*Koleksiyon*"} className={`t-display ${styles.heading}`} />
        <p className={styles.lede}>
          Altı evimizin güncel stoğu. Her saat orijinalliği doğrulanmış, gerektiğinde bakımı yapılmış ve orijinal
          belgeleriyle teslim edilir.
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
          <p className="t-display t-s">Bu seçime uyan bir saat yok.</p>
          <p className={styles.emptyText}>Danışmanlarımız mevcut koleksiyonun dışındaki saatleri de sizin için bulabilir.</p>
          <button className={styles.reset} onClick={() => setFilters(EMPTY_FILTERS)}>
            Filtreleri sıfırla
          </button>
        </div>
      )}

      <div className={styles.footer}>
        <ArrowLink href="/collection" variant="frame">
          Tüm koleksiyonu görün
        </ArrowLink>
      </div>
    </section>
  );
}
