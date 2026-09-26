"use client";

import { useEffect, useRef } from "react";
import { FrameSequence } from "@/components/sections/hero/FrameSequence";
import { useGsap } from "@/hooks/useGsap";
import { gsap } from "@/lib/gsap";
import styles from "./BrandFilmIntro.module.css";

type Props = {
  /** Frame folder, e.g. /assets/video/mercedes (000.webp …). */
  dir: string;
  count: number;
  brand: string;
  title: string;
  accent: string;
};

/**
 * Brand page opening: a film scrubbed by scroll (sticky, full screen); the
 * brand title arrives on its last frame, then the page continues to products.
 */
export function BrandFilmIntro({ dir, count, brand, title, accent }: Props) {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const seq = useRef<FrameSequence | null>(null);

  useEffect(() => {
    if (!film.current) return;
    const s = new FrameSequence(film.current, (i) => `${dir}/${String(i).padStart(3, "0")}.webp`, count);
    seq.current = s;
    const onResize = () => s.resize();
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      s.dispose();
    };
  }, [dir, count]);

  useGsap(() => {
    const state = { frame: 0 };
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(state, { frame: count - 1, duration: 8, ease: "power1.inOut" }, 0);
    if (cue.current) tl.to(cue.current, { autoAlpha: 0, duration: 0.6 }, 0.2);
    if (copy.current) tl.fromTo(copy.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power2.out" }, 7.2);
    tl.set({}, {}, 9.5);
    tl.eventCallback("onUpdate", () => seq.current?.draw(state.frame));
    gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 } }).add(tl);
  }, root);

  return (
    <section ref={root} className={styles.section} data-nav-theme="dark" aria-label={`${brand} saatleri`}>
      <div className={styles.pin}>
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
          <span />
        </div>
      </div>
    </section>
  );
}
