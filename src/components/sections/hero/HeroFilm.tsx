"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { ScrollTrigger } from "@/lib/gsap";
import { ALL_LINES, buildHeroTimeline, createHeroState, HERO_FINALE, HERO_LINES, HERO_OUTRO } from "@/lib/scene/hero";
import { MOVEMENT_FILM, movementFrameSrc } from "@/lib/scene/movement";
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
  const cue = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const lines = useRef<(HTMLElement | null)[]>([]);
  const seq = useRef<FrameSequence | null>(null);
  const movement = useRef<HTMLCanvasElement>(null);
  const movementSeq = useRef<FrameSequence | null>(null);
  const [ready, setReady] = useState(false);
  const [filmReady, setFilmReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  const state = useMemo(createHeroState, []);

  useEffect(() => {
    if (!film.current) return;
    const s = new FrameSequence(film.current, frameSrc, count, () => setFilmReady(true));
    seq.current = s;
    const onResize = () => {
      s.resize();
      movementSeq.current?.resize();
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      s.dispose();
      seq.current = null;
      movementSeq.current?.dispose();
      movementSeq.current = null;
    };
  }, []);

  useGsap(() => {
    const tl = buildHeroTimeline(state, {
      cue: cue.current,
      lines: lines.current,
      finale: finale.current,
      outro: outro.current,
    });
    const el = root.current!;
    tl.eventCallback("onUpdate", () => {
      seq.current?.draw(state.frame);
      // Movement film: start loading once the opening is underway, draw while visible.
      if (!movementSeq.current && movement.current && tl.progress() > 0.12) {
        movementSeq.current = new FrameSequence(movement.current, movementFrameSrc, MOVEMENT_FILM.count);
        movementSeq.current.resize();
      }
      if (state.mechFilm > 0) movementSeq.current?.draw(state.mech);
      el.style.setProperty("--mech", state.mechFilm.toFixed(3));
      // The whole 3D layer fades (not its materials), so the swap shows no see-through ghosting.
      el.style.setProperty("--hide", state.hide.toFixed(3));
      el.style.setProperty("--film", state.film.toFixed(3));
      // Mobile copy fade: only once the footage has gone.
      el.style.setProperty("--copy", (1 - state.film).toFixed(3));
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
    <section ref={root} className={styles.section} id="top" data-nav-theme="dark" aria-label="Açılış">
      <div className={styles.pin}>
        <div className={styles.backdrop} aria-hidden />

        {/* First frame as a real image: visible before any script runs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={frameSrc(0)} alt="" className={styles.poster} data-hidden={filmReady || undefined} aria-hidden />
        <canvas ref={film} className={styles.film} aria-hidden />
        {/* Movement film — takes over from the 3D watch in the mechanism beat */}
        <canvas ref={movement} className={styles.movement} aria-hidden />
        <div className={styles.grade} aria-hidden />

        {/* Feature lines — the watch turns to show each part as its line arrives */}
        <div className={styles.lines}>
          {ALL_LINES.map((l, i) => {
            const [before, after] = l.title.split(l.accent);
            // Numbering restarts for the Patek Philippe.
            const n = i < HERO_LINES.length ? i + 1 : i - HERO_LINES.length + 1;
            return (
              <div
                key={l.id}
                ref={(node) => void (lines.current[i] = node)}
                className={styles.line}
                data-side={l.side}
              >
                <p className={styles.index}>{String(n).padStart(2, "0")}</p>
                <h2 className={styles.lineTitle}>
                  {before}
                  <em>{l.accent}</em>
                  {after}
                </h2>
                <p className={styles.lineText}>{l.text}</p>
              </div>
            );
          })}
        </div>

        {/* Handover: the line above, the Patek Philippe's name beneath the watch */}
        <div ref={finale} className={styles.finale}>
          <h2 className={styles.finaleLine}>
            {HERO_FINALE.line.split(HERO_FINALE.accent)[0]}
            <em>{HERO_FINALE.accent}</em>
          </h2>
          <div className={styles.finaleName}>
            {/* lang="en": brand names use English capitals (PHILIPPE, not PHİLİPPE). */}
            <p className={styles.finaleBrand} lang="en">
              {HERO_FINALE.brand}
            </p>
            <p className={styles.finaleModel}>{HERO_FINALE.model}</p>
            <p className={styles.finaleRef}>{HERO_FINALE.reference}</p>
          </div>
        </div>

        {/* Outro — hands over to the rest of the home page */}
        <div ref={outro} className={styles.outro}>
          <h2 className={styles.outroLine}>
            {HERO_OUTRO.line.split(HERO_OUTRO.accent)[0]}
            <em>{HERO_OUTRO.accent}</em>
          </h2>
          <span className={styles.outroCue} aria-hidden />
        </div>

        <HeroWatchScene state={state} className={styles.canvas} onReady={onReady} />
        <div className={styles.flash} aria-hidden />

        <div className={styles.loader} data-ready={(ready && filmReady) || undefined} aria-hidden>
          <span className={styles.loaderLine} />
        </div>

        {/* No copy on screen until the handover — the heading is for screen readers only. */}
        <h1 className="visually-hidden">Furkan Saat — İstanbul&apos;da seçkin saatlerin özel evi</h1>

        <div ref={cue} className={styles.cue} aria-hidden>
          <span className={styles.cueLine} />
        </div>
      </div>
    </section>
  );
}
