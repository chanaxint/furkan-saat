"use client";

import { useEffect, useRef } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { FrameSequence } from "@/components/sections/hero/FrameSequence";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./BrandFilmIntro.module.css";

type Props = {
  /** Frame folder, e.g. /assets/video/mercedes (000.webp …). */
  dir: string;
  count: number;
  brand: string;
  title: string;
  accent: string;
  /** Playback length in seconds. */
  duration?: number;
};

/**
 * Brand page opening, one screen tall. The first scroll gesture plays the
 * film once, start to end (scrolling is held meanwhile); it stops on its last
 * frame — the watch — with the title, and normal scrolling continues.
 * Scrolling up at the top plays it back to the car.
 */
export function BrandFilmIntro({ dir, count, brand, title, accent, duration = 8 }: Props) {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const { lenis } = useSmoothScroll();

  useEffect(() => {
    const canvas = film.current;
    if (!canvas) return;
    const seq = new FrameSequence(canvas, (i) => `${dir}/${String(i).padStart(3, "0")}.webp`, count, () => seq.draw(state.frame, true));
    const state = { frame: 0 };
    const last = count - 1;
    const onResize = () => seq.resize();
    onResize();
    window.addEventListener("resize", onResize);

    let phase: "idle" | "playing" | "done" = "idle";
    const html = document.documentElement;
    const hold = (on: boolean) => {
      html.style.overflow = on ? "hidden" : "";
      if (on) lenis?.stop();
      else lenis?.start();
    };
    const atTop = () => window.scrollY <= 2;

    const showEnd = () => {
      phase = "done";
      state.frame = last;
      seq.draw(last, true);
      gsap.set(copy.current, { autoAlpha: 1, y: 0 });
      gsap.set(cue.current, { autoAlpha: 0 });
    };

    // Forward: car → watch; scrolling is released on the watch.
    const play = () => {
      phase = "playing";
      hold(true);
      gsap.to(cue.current, { autoAlpha: 0, duration: 0.4 });
      gsap.to(state, {
        frame: last,
        duration: duration * (1 - state.frame / last),
        ease: "none",
        onUpdate: () => seq.draw(state.frame),
        onComplete: () => {
          phase = "done";
          gsap.fromTo(copy.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" });
          hold(false);
        },
      });
    };

    // Backward (scrolling up at the top): watch → car; the page stays held
    // on the car until the next downward scroll plays it forward again.
    const rewind = () => {
      phase = "playing";
      hold(true);
      gsap.to(copy.current, { autoAlpha: 0, y: 20, duration: 0.5 });
      gsap.to(state, {
        frame: 0,
        duration: duration * (state.frame / last),
        ease: "none",
        onUpdate: () => seq.draw(state.frame),
        onComplete: () => {
          phase = "idle";
          gsap.to(cue.current, { autoAlpha: 1, duration: 0.6 });
        },
      });
    };

    // Arrived mid-page, or reduced motion: just show the watch.
    if (window.scrollY > 10 || prefersReducedMotion()) showEnd();
    else hold(true);

    const reduced = prefersReducedMotion();
    const intent = (down: boolean, e: Event) => {
      if (phase === "playing") return e.preventDefault();
      if (phase === "idle") {
        e.preventDefault();
        if (down) play();
        return;
      }
      // done: only an upward scroll at the very top rewinds.
      if (!down && atTop() && !reduced) {
        e.preventDefault();
        rewind();
      }
    };

    let touchY = 0;
    const onWheel = (e: WheelEvent) => Math.abs(e.deltaY) > 1 && intent(e.deltaY > 0, e);
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - e.touches[0].clientY;
      if (phase !== "done" && e.cancelable) e.preventDefault();
      if (Math.abs(dy) > 8) intent(dy > 0, e);
    };
    const onKey = (e: KeyboardEvent) => {
      const down = ["ArrowDown", "PageDown", " ", "Spacebar", "End"].includes(e.key);
      const up = ["ArrowUp", "PageUp", "Home"].includes(e.key);
      if (down || up) intent(down, e);
    };
    const opts = { passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("keydown", onKey);
    const detach = () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };

    return () => {
      detach();
      hold(false);
      gsap.killTweensOf(state);
      window.removeEventListener("resize", onResize);
      seq.dispose();
    };
  }, [dir, count, duration, lenis]);

  return (
    <section ref={root} className={styles.section} data-nav-theme="dark" aria-label={`${brand} saatleri`}>
      <canvas ref={film} className={styles.film} aria-hidden />
      <div className={styles.shade} aria-hidden />
      <div ref={copy} className={styles.copy}>
        <p className={styles.brand} lang="en">
          {brand}
        </p>
        <h1 className={styles.title}>
          {title} <em>{accent}</em>
        </h1>
      </div>
      <div ref={cue} className={styles.cue} aria-hidden>
        <p>Kaydırın</p>
        <span />
      </div>
    </section>
  );
}
