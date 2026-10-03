"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import styles from "./ProductGallery.module.css";

/**
 * The watch page gallery. Desktop: every photograph full width, stacked, so the
 * page itself is the gallery. Phones: a swipeable strip with a counter.
 * Any photograph opens full screen, where arrows, swipe and Escape work.
 *
 * Close look (mouse screens): hovering a photograph frames the spot under the
 * pointer, and a magnified view of that frame opens beside it, over the
 * information column.
 */

/** Magnification of the close look, relative to the photograph on screen. */
const ZOOM = 2.4;
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

  /* ------------------------------------------------------- close look */
  const root = useRef<HTMLDivElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const paneImg = useRef<HTMLImageElement>(null);
  const lens = useRef<HTMLSpanElement>(null);
  const [look, setLook] = useState<number | null>(null);
  const [canLook, setCanLook] = useState(false);
  const pointer = useRef({ x: 0, y: 0, el: null as HTMLElement | null });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 901px)");
    const sync = () => setCanLook(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Place the pane beside the gallery and move the magnified photo and the lens. */
  const track = useCallback(() => {
    const { x, y, el } = pointer.current;
    const p = pane.current;
    const img = paneImg.current;
    const l = lens.current;
    const g = root.current;
    if (!el || !p || !img || !l || !g) return;
    const box = el.getBoundingClientRect();
    const gal = g.getBoundingClientRect();
    const navH = 76;
    const left = gal.right + Math.min(56, window.innerWidth * 0.03);
    const right = Math.max(20, window.innerWidth * 0.044);
    const pw = Math.max(240, window.innerWidth - left - right);
    const ph = Math.min(window.innerHeight - navH - 32, pw * 1.25);
    p.style.cssText = `left:${left}px;top:${navH + 16}px;width:${pw}px;height:${ph}px`;
    const W = box.width * ZOOM;
    const H = box.height * ZOOM;
    img.style.width = `${W}px`;
    img.style.height = `${H}px`;
    const fx = (x - box.left) / box.width;
    const fy = (y - box.top) / box.height;
    const tx = Math.min(0, Math.max(pw - W, pw / 2 - fx * W));
    const ty = Math.min(0, Math.max(ph - H, ph / 2 - fy * H));
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    // The lens frames exactly what the pane shows.
    l.style.cssText = `width:${pw / ZOOM}px;height:${ph / ZOOM}px;transform:translate3d(${box.left - gal.left - tx / ZOOM}px, ${box.top - gal.top - ty / ZOOM}px, 0)`;
  }, []);

  useEffect(() => {
    if (look === null) return;
    const onScroll = () => track();
    window.addEventListener("scroll", onScroll, { passive: true });
    track();
    return () => window.removeEventListener("scroll", onScroll);
  }, [look, track]);

  const lookHandlers = (i: number) =>
    canLook
      ? {
          onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
            pointer.current = { x: e.clientX, y: e.clientY, el: e.currentTarget };
            setLook(i);
          },
          onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
            pointer.current = { x: e.clientX, y: e.clientY, el: e.currentTarget };
            track();
          },
          onPointerLeave: () => setLook(null),
        }
      : {};

  // Phone strip: track which photograph is in view for the counter.
  const onStrip = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    setCurrent(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div ref={root} className={styles.gallery} data-looking={look !== null || undefined}>
      <ul className={styles.list} onScroll={onStrip}>
        {images.map((src, i) => (
          <li key={src} className={styles.item}>
            <button
              className={styles.open}
              onClick={() => {
                setLook(null);
                setView(i);
              }}
              aria-label={`Fotoğraf ${i + 1} — tam ekran`}
              {...lookHandlers(i)}
            >
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
      {canLook && <span ref={lens} className={styles.lens} data-on={look !== null || undefined} aria-hidden />}
      {canLook &&
        createPortal(
          <div ref={pane} className={styles.pane} data-on={look !== null || undefined} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={paneImg} src={images[look ?? 0]} alt="" className={styles.paneImg} decoding="async" />
            <span className={styles.paneLabel}>Yakından</span>
          </div>,
          document.body,
        )}

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
