"use client";

import { useMemo, useState } from "react";
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
 * The collection on the home page: every watch, with the filters laid out
 * over the grid as rows of chips (brand, who for, colour, kind) — one tap to
 * choose, another to let go — and a sort. The week's pieces lead the grid
 * and carry a gold mark.
 */
export function CatalogView({ products, marked = [] }: { products: Product[]; marked?: string[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState<SortKey>("featured");

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
      <div className={styles.filters} role="group" aria-label="Filtreler">
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

      <div className={styles.bar}>
        <p className={styles.count} aria-live="polite">
          {results.length} saat
        </p>
        {chosen > 0 && (
          <button type="button" className={styles.clear} onClick={() => setFilters({})}>
            Filtreleri temizle
          </button>
        )}
        <label className={styles.sort}>
          <span className="visually-hidden">Sırala</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
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
