"use client";

import { useEffect, useRef } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import styles from "./ScrollLine.module.css";

/**
 * The page scrollbar, drawn as a hairline on the right edge (the browser's own
 * bar and its track are hidden in globals.css, mouse/trackpad screens only).
 * The thumb can be dragged; clicking the line jumps there.
 */
export function ScrollLine() {
  const root = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();
  const glide = useRef(scrollTo);
  useEffect(() => {
    glide.current = scrollTo;
  }, [scrollTo]);

  useEffect(() => {
    const el = root.current;
    const th = thumb.current;
    if (!el || !th) return;
    let frame = 0;
    let idle = 0;

    const metrics = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const size = Math.max(48, vh * (vh / (max + vh)));
      return { vh, max, size, travel: vh - size };
    };

    const draw = () => {
      frame = 0;
      const { max, size, travel } = metrics();
      el.toggleAttribute("data-hidden", max <= 4);
      if (max <= 4) return;
      th.style.height = `${size}px`;
      th.style.transform = `translate3d(0, ${(window.scrollY / max) * travel}px, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
      // Brighter while the page is moving.
      el.dataset.active = "";
      clearTimeout(idle);
      idle = window.setTimeout(() => delete el.dataset.active, 900);
    };

    // Drag the thumb.
    let dragFrom: { y: number; scroll: number } | null = null;
    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      th.setPointerCapture(e.pointerId);
      dragFrom = { y: e.clientY, scroll: window.scrollY };
      el.dataset.dragging = "";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragFrom) return;
      const { max, travel } = metrics();
      const y = dragFrom.scroll + ((e.clientY - dragFrom.y) / Math.max(1, travel)) * max;
      window.scrollTo(0, Math.min(max, Math.max(0, y)));
    };
    const onUp = (e: PointerEvent) => {
      if (!dragFrom) return;
      dragFrom = null;
      th.releasePointerCapture(e.pointerId);
      delete el.dataset.dragging;
    };
    // Click the line: glide so that the thumb centres there.
    const onTrack = (e: PointerEvent) => {
      if (e.target === th) return;
      const { max, size, travel } = metrics();
      const k = (e.clientY - size / 2) / Math.max(1, travel);
      glide.current(Math.min(max, Math.max(0, k * max)));
    };

    draw();
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    th.addEventListener("pointerdown", onDown);
    th.addEventListener("pointermove", onMove);
    th.addEventListener("pointerup", onUp);
    th.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerdown", onTrack);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      th.removeEventListener("pointerdown", onDown);
      th.removeEventListener("pointermove", onMove);
      th.removeEventListener("pointerup", onUp);
      th.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerdown", onTrack);
    };
  }, []);

  return (
    <div ref={root} className={styles.track} aria-hidden>
      <div ref={thumb} className={styles.thumb} />
    </div>
  );
}
