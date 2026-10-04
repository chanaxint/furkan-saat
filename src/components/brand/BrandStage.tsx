"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import type { Brand, BrandStageDef } from "@/lib/data/types";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { STAGES } from "@/lib/data/stages";
import { applyOverlay, createStageState, exitStart, sampleStage, sceneTimes } from "@/lib/scene/stage";
import styles from "./BrandStage.module.css";

const ShowcaseWatchScene = dynamic(() => import("@/components/three/ShowcaseWatchScene"), { ssr: false });

/**
 * BRAND STAGE — the opening of a brand page on its watch in 3D (lib/scene/stage.ts).
 * The 3D layer is fixed behind the region (opening + collection, passed as
 * children); after its turns the watch fades as the collection arrives. It
 * renders only while the region is on screen and the watch is visible.
 */
/**
 * The watch's last turn ends when the collection's top edge is this far down
 * the screen (negative: above the top, i.e. a longer stretch of scroll).
 */
const EXIT_END = -0.5;

/**
 * The water film after the collection: the hover before the drop runs fast,
 * then the drop itself a little faster than real time (a brisk fall).
 */
const FILM_HOVER_RATE = 2.2;
const FILM_DROP_RATE = 1.35;
const FILM_DROP_AT = 2.2;

const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

export function BrandStage({
  brand,
  stage,
  next,
  children,
  rest,
}: {
  brand: Brand;
  stage: BrandStageDef;
  /** Where the button scrolls to (the collection). */
  next: string;
  /** The collection: a layer the watch turns in beneath. */
  children: React.ReactNode;
  /** What follows the watch's return (scrolls over it like the collection). */
  rest?: React.ReactNode;
}) {
  const region = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  /** Phones: how much higher and further back the watch sits (mix eases it off before the film). */
  const portrait = useMemo(() => ({ lift: 0.32, pull: 2.2, mix: 1 }), []);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const wake = useRef<() => void>(() => {});
  const motion = STAGES[brand.slug];
  const state = useMemo(() => createStageState(motion), [motion]);
  const [active, setActive] = useState(true);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGsap(() => {
    // The scroll position is a time on the stage's timeline; every frame is sampled from it.
    const sides = stage.lines.map((l) => l.side);
    // Two stretches of scroll: the scenes while the opening is pinned, then the
    // last turn while the collection rises over the watch like a layer of its
    // own — the watch spins down and goes in beneath it.
    const { total } = sceneTimes(motion);
    const exit = exitStart(motion);
    const clock = { p: 0 };
    const time = () => {
      const h = hero.current!;
      const vh = window.innerHeight;
      const pinned = Math.max(1, h.offsetHeight - vh);
      const p0 = pinned / (pinned + vh * (1 - EXIT_END));
      return clock.p < p0 ? (clock.p / p0) * exit : exit + ((clock.p - p0) / (1 - p0)) * (total - exit);
    };
    const draw = () => {
      const o = sampleStage(motion, time(), state, stage.lines.length);
      portrait.mix = 1;
      applyOverlay(o, title.current, lines.current, sides);
      scene.current?.style.setProperty("--show", state.show.toFixed(3));
      // Once it has faded there is nothing to draw.
      if (state.show > 0.005) wake.current();
    };
    draw();
    const tl = gsap.to(clock, { p: 1, ease: "none", onUpdate: draw });
    ScrollTrigger.create({
      trigger: hero.current,
      start: "top top",
      end: `bottom ${EXIT_END * 100}%`,
      scrub: 1,
      animation: tl,
    });

    // After the collection: the watch comes back from below already turning
    // and settles on the first frame of the water film, which then takes over
    // and plays at its own (real) speed; "Su geçirmez" comes up in the water.
    const outro = motion.outro;
    const sc = scene.current!;
    const v = film.current;
    if (outro && back.current) {
      const { times } = sceneTimes(outro);
      const last = times[times.length - 1];
      let rolling = false;
      const roll = (on: boolean) => {
        if (on === rolling || !v) return;
        rolling = on;
        if (on) {
          v.currentTime = 0;
          v.playbackRate = FILM_HOVER_RATE;
          sc.dataset.film = "";
          v.play().catch(() => {});
        } else {
          v.pause();
          delete sc.dataset.film;
          delete sc.dataset.said;
          wake.current();
        }
      };

      const oclock = { t: 0 };
      const odraw = () => {
        const t = oclock.t;
        sampleStage(outro, t, state, 0);
        // Phones place the watch higher and further back; on the way to the
        // film's first frame that gives way, so it lands where the film's watch is.
        portrait.mix = 1 - smooth((t - last.start) / Math.max(0.1, last.arrive - last.start));
        sc.style.setProperty("--show", "1");
        roll(stage.film !== undefined && t >= last.arrive - 0.02);
        if (!rolling) wake.current();
      };
      const otl = gsap.to(oclock, { t: sceneTimes(outro).total, ease: "none", onUpdate: odraw, paused: true });
      ScrollTrigger.create({ trigger: back.current, start: "top bottom", end: "bottom bottom", scrub: 1, animation: otl });
    }

    if (v) {
      const onTime = () => {
        if (v.currentTime >= FILM_DROP_AT && v.playbackRate !== FILM_DROP_RATE) v.playbackRate = FILM_DROP_RATE;
      };
      const onEnd = () => void (sc.dataset.said = "");
      v.addEventListener("timeupdate", onTime);
      v.addEventListener("ended", onEnd);
      return () => {
        v.removeEventListener("timeupdate", onTime);
        v.removeEventListener("ended", onEnd);
      };
    }
  }, region);

  const onWake = useCallback((fn: () => void) => {
    wake.current = fn;
    fn();
  }, []);

  return (
    <div ref={region} className={styles.region}>
      <div ref={scene} className={styles.scene} aria-hidden>
        <div className={styles.light} />
        <div className={styles.canvas}>
          <ShowcaseWatchScene
            state={state}
            model={stage.model}
            pivot={stage.pivot}
            active={active}
            onWake={onWake}
            tone="steel"
            portrait={portrait}
          />
        </div>
        {stage.film && (
          <div className={styles.film}>
            <video ref={film} muted playsInline preload="auto" poster={stage.film.poster}>
              <source src={stage.film.mobile} type="video/mp4" media="(max-width: 767px)" />
              <source src={stage.film.mp4} type="video/mp4" />
              <source src={stage.film.webm} type="video/webm" />
            </video>
            {stage.water && (
              <div className={styles.waterText}>
                <p className={styles.eyebrow}>{stage.water.eyebrow}</p>
                <h2 className={styles.lineTitle}>
                  {stage.water.title.split(stage.water.accent)[0]}
                  <em>{stage.water.accent}</em>
                  {stage.water.title.split(stage.water.accent)[1]}
                </h2>
                <p className={styles.lineText}>{stage.water.text}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <section
        ref={hero}
        className={styles.hero}
        style={{ height: `${Math.round(exitStart(motion) * motion.speed) + 100}svh` }}
        data-nav-theme="light"
        aria-label={brand.name}
      >
        <div className={styles.pin}>
          <div ref={title} className={styles.title}>
            <p className={styles.eyebrow}>{stage.eyebrow}</p>
            <h1 className={styles.logo}>
              <Image src={brand.logo} alt={brand.name} fill priority sizes="(max-width: 767px) 70vw, 560px" />
            </h1>
            <button type="button" className={styles.button} onClick={() => scrollTo(next)}>
              Koleksiyonu keşfedin
            </button>
          </div>

          {/* What is said beside each close-up. */}
          {stage.lines.map((l, i) => {
            const [before, after] = l.title.split(l.accent);
            return (
              <div key={l.title} ref={(n) => void (lines.current[i] = n)} className={styles.line} data-side={l.side}>
                <p className={styles.index}>{String(i + 1).padStart(2, "0")}</p>
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
      </section>

      <div className={styles.over}>{children}</div>
      {motion.outro && (
        <section
          ref={back}
          className={styles.back}
          style={{ height: `${Math.round(sceneTimes(motion.outro).total * motion.outro.speed) + 100}svh` }}
          aria-hidden
        />
      )}
      {rest && <div className={styles.over}>{rest}</div>}
    </div>
  );
}
