"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import styles from "./ProductGallery.module.css";

/**
 * The watch page gallery. Desktop: every photograph full width, stacked, so the
 * page itself is the gallery. Phones: a swipeable strip with a counter.
 * Any photograph opens full screen, where arrows, swipe and Escape work.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [view, setView] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const { lenis } = useSmoothScroll();
  const close = useCallback(() => setView(null), []);
  const step = useCallback(
    (d: number) => setView((v) => (v === null ? v : (v + d + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (view === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
      document.documentElement.style.overflow = "";
    };
  }, [view, close, step, lenis]);

  // Phone strip: track which photograph is in view for the counter.
  const onStrip = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className={styles.gallery}>
      <ul className={styles.list} onScroll={onStrip}>
        {images.map((src, i) => (
          <li key={src} className={styles.item}>
            <button className={styles.open} onClick={() => setView(i)} aria-label={`Fotoğraf ${i + 1} — tam ekran`}>
              <Image
                src={src}
                alt={i === 0 ? alt : `${alt} — görünüm ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 900px) 100vw, 58vw"
                className={styles.image}
              />
            </button>
          </li>
        ))}
      </ul>
      {images.length > 1 && (
        <p className={styles.counter} aria-hidden>
          {current + 1} / {images.length}
        </p>
      )}

      {view !== null && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Fotoğraflar" data-lenis-prevent>
          <Image src={images[view]} alt={alt} fill sizes="100vw" loading="eager" className={styles.full} />
          <button className={styles.close} onClick={close}>
            Kapat <span aria-hidden>×</span>
          </button>
          {images.length > 1 && (
            <>
              <button className={`${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="Önceki">
                ←
              </button>
              <button className={`${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="Sonraki">
                →
              </button>
              <p className={styles.lightboxCount}>
                {view + 1} / {images.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
