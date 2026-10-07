"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/data/types";
import {
  applyFilters,
  facetOptions,
  SORTS,
  sortProducts,
  type FacetKey,
  type Filters,
  type SortKey,
} from "@/lib/services/catalog";
import styles from "./CatalogView.module.css";

/**
 * The collection on the home page: every watch, a "Filtrele" button that opens
 * the filters (rows of chips: brand, who for, colour, kind — one tap to choose,
 * another to let go) and a sort. The week's pieces lead the grid and carry a
 * gold mark.
 */
export function CatalogView({ products, marked = [] }: { products: Product[]; marked?: string[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState<SortKey>("featured");
  const [open, setOpen] = useState(false);
  const panel = useId();

  // Opened for women's or men's watches (the home page tiles, or ?cinsiyet= in a link).
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("cinsiyet");
    if (g) setFilters({ gender: [g] });
    const on = (e: Event) => {
      const v = (e as CustomEvent<{ gender: string }>).detail?.gender;
      if (v) setFilters({ gender: [v] });
    };
    window.addEventListener("catalog:filter", on);
    return () => window.removeEventListener("catalog:filter", on);
  }, []);

  const facets = useMemo(() => facetOptions(products), [products]);
  const results = useMemo(() => sortProducts(applyFilters(products, filters), sort), [products, filters, sort]);
  const chosen = Object.values(filters).reduce((n, v) => n + (v?.length ?? 0), 0);

  const toggle = (key: FacetKey, value: string) =>
    setFilters((f) => {
      const cur = f[key] ?? [];
      return { ...f, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  return (
    <div className="container">
      <div className={styles.bar}>
        <button
          type="button"
          className={styles.filterButton}
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 20 20" aria-hidden>
            <path d="M3 5h14M6 10h8M9 15h2" />
          </svg>
          Filtrele
          {chosen > 0 && <span className={styles.badge}>{chosen}</span>}
        </button>
        <p className={styles.count} aria-live="polite">
          {results.length} saat
        </p>
        {chosen > 0 && (
          <button type="button" className={styles.clear} onClick={() => setFilters({})}>
            Temizle
          </button>
        )}
        <SortMenu value={sort} onChange={setSort} />
      </div>

      <div id={panel} className={styles.panel} data-open={open || undefined} role="group" aria-label="Filtreler">
        <div className={styles.panelInner}>
          <div className={styles.filters}>
            {facets.map((f) => (
              <div key={f.key} className={styles.facet}>
                <p className={styles.facetLabel}>{f.label}</p>
                <ul className={styles.chips}>
                  {f.options.map((o) => {
                    const on = filters[f.key]?.includes(o.value) ?? false;
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          className={styles.chip}
                          aria-pressed={on}
                          data-color={f.key === "color" ? o.value : undefined}
                          tabIndex={open ? 0 : -1}
                          onClick={() => toggle(f.key, o.value)}
                        >
                          {o.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <ProductGrid products={results} marked={marked} markLabel="Haftanın saati" dense />
      ) : (
        <div className={styles.empty}>
          <p className="t-display t-s">Bu seçime uyan bir saat yok.</p>
          <p className={styles.emptyText}>Aradığınız saati danışmanlarımız koleksiyonun dışından da bulabilir.</p>
          <Button variant="line" onClick={() => setFilters({})}>
            Filtreleri temizle
          </Button>
        </div>
      )}
    </div>
  );
}

/** The sort, as a quiet line that opens a small ivory list (no system dropdown). */
function SortMenu({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useId();
  const current = SORTS.find((s) => s.key === value) ?? SORTS[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const pick = (v: SortKey) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={root} className={styles.sort}>
      <button
        type="button"
        className={styles.sortButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={list}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.sortLabel}>Sırala</span>
        {current.label}
        <svg viewBox="0 0 10 6" aria-hidden>
          <path d="M.5.5 5 5 9.5.5" />
        </svg>
      </button>
      <ul id={list} className={styles.sortList} role="listbox" aria-label="Sırala" data-open={open || undefined}>
        {SORTS.map((s) => (
          <li
            key={s.key}
            role="option"
            aria-selected={s.key === value}
            tabIndex={open ? 0 : -1}
            onClick={() => pick(s.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                pick(s.key);
              }
            }}
          >
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
