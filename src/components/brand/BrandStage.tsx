"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import type { Brand, BrandStageDef } from "@/lib/data/types";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { STAGES } from "@/lib/data/stages";
import { SHOWCASE_FOV } from "@/lib/scene/showcase";
import { applyOverlay, createStageState, exitStart, sampleStage, sceneTimes, type StageState } from "@/lib/scene/stage";
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

/** Phones: the watch sits higher and further back (as ShowcaseWatchScene places it). */
const PORTRAIT = { lift: 0.32, pull: 2.2 };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/** Where the watch's centre is on screen, from the top (0–1), placed as the 3D layer places it. */
function screenY(s: Pick<StageState, "y" | "z">) {
  const aspect = window.innerWidth / window.innerHeight;
  const portrait = aspect < 1 ? 1 - aspect : 0;
  const y = s.y + portrait * PORTRAIT.lift;
  const z = s.z * (1 + portrait * PORTRAIT.pull);
  return 0.5 - y / (-z * Math.tan((SHOWCASE_FOV * Math.PI) / 360)) / 2;
}

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
  const waterText = useRef<HTMLDivElement>(null);
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

    // After the collection: the watch comes back from below already turning,
    // turns on, and drops into water ("Su geçirmez" while it is under).
    const outro = motion.outro;
    if (outro && back.current) {
      const { times } = sceneTimes(outro);
      const drop = outro.water;
      const probe = createStageState(outro);
      const sc = scene.current!;
      const text = waterText.current;
      // The waterline sits between the watch above it and the watch under it; the
      // splash is when the watch's centre goes through it.
      let level = 0.55;
      let splashAt = Infinity;
      const measure = () => {
        if (drop === undefined) return;
        const above = outro.scenes[drop - 1];
        const under = outro.scenes[outro.scenes.length - 1];
        level = screenY(above) + (screenY(under) - screenY(above)) * 0.45;
        const { start, arrive } = times[drop];
        splashAt = arrive;
        for (let n = 0; n <= 40; n++) {
          const t = start + ((arrive - start) * n) / 40;
          sampleStage(outro, t, probe, 0);
          if (screenY(probe) >= level) {
            splashAt = t;
            break;
          }
        }
        sc.style.setProperty("--level", `${(level * 100).toFixed(2)}%`);
      };
      measure();

      const oclock = { t: 0 };
      const odraw = () => {
        const t = oclock.t;
        sampleStage(outro, t, state, 0);
        sc.style.setProperty("--show", "1");
        if (drop !== undefined) {
          // The water rises in while the watch holds above it, and stays.
          const rise = smooth((t - times[drop - 1].arrive + 0.5) / 1.1);
          const splash = clamp01((t - splashAt) / 1.1);
          const under = smooth((t - splashAt) / 0.5);
          const said = smooth((t - splashAt - 0.5) / 0.9);
          sc.style.setProperty("--rise", rise.toFixed(3));
          sc.style.setProperty("--splash", splash.toFixed(3));
          sc.style.setProperty("--under", under.toFixed(3));
          if (splash > 0 && splash < 1) sc.dataset.splash = "";
          else delete sc.dataset.splash;
          if (text) {
            text.style.opacity = said.toFixed(3);
            text.style.visibility = said < 0.01 ? "hidden" : "visible";
            text.style.translate = `0 ${((1 - said) * 30).toFixed(1)}px`;
          }
        }
        wake.current();
      };
      const otl = gsap.to(oclock, { t: sceneTimes(outro).total, ease: "none", onUpdate: odraw, paused: true });
      ScrollTrigger.create({
        trigger: back.current,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1,
        animation: otl,
        onRefresh: () => {
          measure();
          odraw();
        },
      });
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
            portrait={PORTRAIT}
          />
        </div>
        {motion.outro?.water !== undefined && (
          <div className={styles.water}>
            <div className={styles.body}>
              <svg className={styles.surface} viewBox="0 0 1200 20" preserveAspectRatio="none">
                <path d="M0 14 Q 150 2 300 14 T 600 14 T 900 14 T 1200 14 V20 H0 Z" />
              </svg>
              <span className={styles.caustics} />
              <span className={styles.bubbles}>
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} style={{ "--i": i } as React.CSSProperties} />
                ))}
              </span>
            </div>
            <div className={styles.splash}>
              <span className={styles.ring} />
              <span className={styles.ring} />
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ "--i": i } as React.CSSProperties} />
              ))}
            </div>
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
          aria-hidden={!stage.water}
        >
          {stage.water && (
            <div className={styles.backPin}>
              <div ref={waterText} className={styles.waterText}>
                <p className={styles.eyebrow}>{stage.water.eyebrow}</p>
                <h2 className={styles.lineTitle}>
                  {stage.water.title.split(stage.water.accent)[0]}
                  <em>{stage.water.accent}</em>
                  {stage.water.title.split(stage.water.accent)[1]}
                </h2>
                <p className={styles.lineText}>{stage.water.text}</p>
              </div>
            </div>
          )}
        </section>
      )}
      {rest && <div className={styles.over}>{rest}</div>}
    </div>
  );
}
