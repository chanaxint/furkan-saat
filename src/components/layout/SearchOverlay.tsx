"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { PriceDisplay } from "@/components/product/PriceDisplay";
import { brandName, search } from "@/lib/services/catalog";
import styles from "./SearchOverlay.module.css";

const SUGGESTIONS = ["Submariner", "Patek Philippe", "126610LN", "Tourbillon", "Platin", "Bakım"];

/** Full-screen search: results update as you type, grouped into watches and brands. */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const { lenis } = useSmoothScroll();
  const results = useMemo(() => search(query), [query]);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => input.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose, lenis]);

  const close = () => {
    onClose();
    setQuery("");
  };

  return (
    <div className={styles.overlay} data-open={open || undefined} aria-hidden={!open} inert={!open} role="dialog" aria-modal="true" aria-label="Arama">
      <div className={`container ${styles.inner}`} data-lenis-prevent>
        <div className={styles.head}>
          <label className={styles.field}>
            <span className="visually-hidden">Ara</span>
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Marka, model ya da referans"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button className={styles.close} onClick={close}>
            Kapat <span aria-hidden>×</span>
          </button>
        </div>

        {!hasQuery && (
          <div className={styles.suggest}>
            <p className={styles.label}>Sık aranan</p>
            <ul>
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button onClick={() => setQuery(s)}>{s}</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasQuery && (
          <div className={styles.results} aria-live="polite">
            {results.watches.length + results.brands.length + results.articles.length === 0 && (
              <p className={styles.none}>
                “{query}” için sonuç bulunamadı. Danışmanlarımız koleksiyon dışındaki saatleri de bulabilir —{" "}
                <Link href="/iletisim" onClick={close}>
                  bize yazın
                </Link>
                .
              </p>
            )}
            {results.watches.length > 0 && (
              <section>
                <p className={styles.label}>Saatler · {results.watches.length}</p>
                <ul className={styles.watches}>
                  {results.watches.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/saat/${p.slug}`} onClick={close} className={styles.watch}>
                        <span className={styles.thumb}>
                          <Image src={p.images[0]} alt="" fill sizes="96px" />
                        </span>
                        <span className={styles.watchText}>
                          <span className={styles.brand}>{brandName(p.brand)}</span>
                          <span className={styles.model}>{p.model}</span>
                          <span className={styles.ref}>Ref. {p.reference}</span>
                        </span>
                        <PriceDisplay price={p.price} currency={p.currency} className={styles.price} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {results.brands.length > 0 && (
              <section>
                <p className={styles.label}>Markalar</p>
                <ul className={styles.brands}>
                  {results.brands.map((b) => (
                    <li key={b.slug}>
                      <Link href={`/markalar/${b.slug}`} onClick={close}>
                        {b.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {results.articles.length > 0 && (
              <section>
                <p className={styles.label}>Dergi</p>
                <ul className={styles.articles}>
                  {results.articles.map((a) => (
                    <li key={a.slug}>
                      <Link href={`/dergi/${a.slug}`} onClick={close}>
                        <span className={styles.ref}>{a.category}</span>
                        <span className={styles.model}>{a.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
