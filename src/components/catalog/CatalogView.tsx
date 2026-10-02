"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
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
 * The catalogue: a quiet bar (filter, count, sort) over the grid. Filters
 * open in a side drawer instead of a permanent sidebar.
 */
export function CatalogView({ products }: { products: Product[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const [sort, setSort] = useState<SortKey>("featured");
  const [open, setOpen] = useState(false);

  const facets = useMemo(() => facetOptions(products), [products]);
  const results = useMemo(() => sortProducts(applyFilters(products, filters), sort), [products, filters, sort]);

  const toggle = (key: FacetKey, value: string) =>
    setFilters((f) => {
      const cur = f[key] ?? [];
      return { ...f, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  const active = facets.flatMap((f) =>
    (filters[f.key] ?? []).map((v) => ({ key: f.key, value: v, label: f.options.find((o) => o.value === v)?.label ?? v })),
  );

  return (
    <div className="container">
      <div className={styles.bar}>
        <button className={styles.filterButton} onClick={() => setOpen(true)} aria-haspopup="dialog">
          Filtrele{active.length > 0 && <sup>{active.length}</sup>}
        </button>
        <p className={styles.count} aria-live="polite">
          {results.length} saat
        </p>
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

      {active.length > 0 && (
        <ul className={styles.active} aria-label="Seçili filtreler">
          {active.map((a) => (
            <li key={`${a.key}-${a.value}`}>
              <button onClick={() => toggle(a.key, a.value)} aria-label={`${a.label} filtresini kaldır`}>
                {a.label} <span aria-hidden>×</span>
              </button>
            </li>
          ))}
          <li>
            <button className={styles.clear} onClick={() => setFilters({})}>
              Tümünü temizle
            </button>
          </li>
        </ul>
      )}

      {results.length > 0 ? (
        <ProductGrid products={results} priorityCount={3} />
      ) : (
        <div className={styles.empty}>
          <p className="t-display t-s">Bu seçime uyan bir saat yok.</p>
          <p className={styles.emptyText}>
            Aradığınız saati danışmanlarımız koleksiyonun dışından da bulabilir.
          </p>
          <Button variant="line" onClick={() => setFilters({})}>
            Filtreleri temizle
          </Button>
        </div>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        label="Filtreler"
        footer={
          <div className={styles.drawerActions}>
            <Button variant="line" onClick={() => setFilters({})}>
              Temizle
            </Button>
            <Button variant="solid" onClick={() => setOpen(false)}>
              {results.length} saati göster
            </Button>
          </div>
        }
      >
        {facets.map((f) => (
          <fieldset key={f.key} className={styles.facet}>
            <legend>{f.label}</legend>
            {f.options.map((o) => {
              const checked = filters[f.key]?.includes(o.value) ?? false;
              return (
                <label key={o.value} className={styles.option}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(f.key, o.value)} />
                  <span className={styles.box} aria-hidden />
                  {o.label}
                </label>
              );
            })}
          </fieldset>
        ))}
      </Drawer>
    </div>
  );
}
