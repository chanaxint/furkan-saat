"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { ScrollTrigger } from "@/lib/gsap";
import { buildHeroTimeline, createHeroState, HERO_LINES } from "@/lib/scene/hero";
import { progress } from "@/lib/scene/progress";
import { FrameSequence } from "./FrameSequence";
import styles from "./HeroFilm.module.css";

const HeroWatchScene = dynamic(() => import("@/components/three/hero/HeroWatchScene"), { ssr: false });

const { dir, count, ext } = ASSETS.hero.frames;
const frameSrc = (i: number) => `${dir}/${String(i).padStart(3, "0")}.${ext}`;

/**
 * HERO FILM — the opening. Footage of the box, the real 3D watch composited
 * onto its cushion, then lifted out and performed, all scrubbed by scroll
 * through one GSAP timeline (lib/scene/hero.ts).
 */
export function HeroFilm() {
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLElement | null)[]>([]);
  const seq = useRef<FrameSequence | null>(null);
  const [ready, setReady] = useState(false);
  const [filmReady, setFilmReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  const state = useMemo(createHeroState, []);

  useEffect(() => {
    if (!film.current) return;
    const s = new FrameSequence(film.current, frameSrc, count, () => setFilmReady(true));
    seq.current = s;
    const onResize = () => s.resize();
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      s.dispose();
      seq.current = null;
    };
  }, []);

  useGsap(() => {
    const tl = buildHeroTimeline(state, { title: title.current, cue: cue.current, lines: lines.current });
    const el = root.current!;
    tl.eventCallback("onUpdate", () => {
      seq.current?.draw(state.frame);
      el.style.setProperty("--film", state.film.toFixed(3));
      el.style.setProperty("--flash", state.flash.toFixed(3));
      progress.intro.wake?.();
    });
    ScrollTrigger.create({ trigger: el, start: "top top", end: "bottom bottom", scrub: 1, animation: tl });
    ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (progress.intro.active = self.isActive),
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="top" data-nav-theme="dark" aria-label="Opening">
      <div className={styles.pin}>
        <div className={styles.backdrop} aria-hidden />

        {/* First frame as a real image: visible before any script runs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frameSrc(0)} alt="" className={styles.poster} data-hidden={filmReady || undefined} aria-hidden />
        <canvas ref={film} className={styles.film} aria-hidden />
        <div className={styles.grade} aria-hidden />

        {/* Copy — behind the watch, which turns to look at each line */}
        <div className={styles.lines}>
          {HERO_LINES.map((l, i) => {
            const [before, after] = l.text.split(l.accent);
            return (
              <p
                key={l.id}
                ref={(node) => void (lines.current[i] = node)}
                className={styles.line}
                data-side={l.side}
                data-index={i}
              >
                {before}
                <em>{l.accent}</em>
                {after}
              </p>
            );
          })}
        </div>

        <HeroWatchScene state={state} className={styles.canvas} onReady={onReady} />
        <div className={styles.flash} aria-hidden />

        <div className={styles.loader} data-ready={(ready && filmReady) || undefined} aria-hidden>
          <span className={styles.loaderLine} />
        </div>

        <div ref={title} className={styles.title}>
          <p className="t-eyebrow">A private house of fine watches — İstanbul</p>
          <h1 className={`t-display ${styles.headline}`}>
            Time, <em>held</em> close.
          </h1>
        </div>

        <div ref={cue} className={styles.cue} aria-hidden>
          <span>Scroll</span>
          <span className={styles.cueLine} />
        </div>
      </div>
    </section>
  );
}
