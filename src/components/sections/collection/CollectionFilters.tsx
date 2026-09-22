"use client";

import { useEffect, useRef, useState } from "react";
import { FILTER_LABELS, type FilterKey, type Filters, PRICE_BANDS } from "@/lib/data/filters";
import styles from "./CollectionFilters.module.css";

type Props = {
  options: Record<FilterKey, { value: string; label: string }[]>;
  filters: Filters;
  onToggle: (key: FilterKey, value: string) => void;
  onClear: () => void;
  count: number;
};

const KEYS = Object.keys(FILTER_LABELS) as FilterKey[];

/** Quiet text-led filter bar with a single drawer — no chips, no pills. */
export function CollectionFilters({ options, filters, onToggle, onClear, count }: Props) {
  const [open, setOpen] = useState<FilterKey | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = KEYS.flatMap((k) => filters[k].map((v) => ({ key: k, value: v })));
  const labelFor = (k: FilterKey, v: string) => (k === "price" ? PRICE_BANDS.find((b) => b.id === v)?.label ?? v : v);

  return (
    <div ref={ref} className={styles.wrap}>
      <div className={styles.bar}>
        <span className={styles.lead}>Refine</span>
        <div className={styles.keys} role="tablist" aria-label="Filters">
          {KEYS.map((k) => (
            <button
              key={k}
              className={styles.key}
              aria-expanded={open === k}
              aria-controls={`filter-${k}`}
              data-active={open === k || undefined}
              onClick={() => setOpen((o) => (o === k ? null : k))}
            >
              {FILTER_LABELS[k]}
              {filters[k].length > 0 && <sup>{filters[k].length}</sup>}
              <span className={styles.chev} aria-hidden />
            </button>
          ))}
        </div>
        <span className={styles.count}>
          {String(count).padStart(2, "0")} {count === 1 ? "timepiece" : "timepieces"}
        </span>
      </div>

      <div className={styles.drawer} data-open={open !== null || undefined}>
        <div className={styles.drawerInner}>
          {open && (
            <ul id={`filter-${open}`} className={styles.options} key={open}>
              {options[open].map((o) => {
                const checked = filters[open].includes(o.value);
                return (
                  <li key={o.value}>
                    <button className={styles.option} aria-pressed={checked} onClick={() => onToggle(open, o.value)}>
                      <span className={styles.box} aria-hidden />
                      {o.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {active.length > 0 && (
        <div className={styles.active}>
          {active.map(({ key, value }) => (
            <button key={`${key}-${value}`} className={styles.tag} onClick={() => onToggle(key, value)}>
              {labelFor(key, value)} <span aria-hidden>×</span>
              <span className="visually-hidden">remove filter</span>
            </button>
          ))}
          <button className={styles.clear} onClick={onClear}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
