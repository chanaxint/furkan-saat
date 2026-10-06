"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
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
/** Phones: the watch sits higher and further back. */
const PORTRAIT = { lift: 0.32, pull: 2.2 };

/** Seconds of the drop film: the watch goes into the water ("Su geçirmez"), and has settled (the words). */
const SPLASH_AT = 0.52;
const SAID_AT = 2.8;
/** Where the water's surface is at the end of the film (percent of the height). */
const SURFACE = 38;
/** Bubbles rising beside the watch once it rests: [x offset from centre, start height, size (px), seconds, delay]. */
const BUBBLES: [number, number, number, number, number][] = [
  [27, 62, 9, 3.4, 0],
  [31, 58, 6, 2.9, 0.9],
  [25, 66, 12, 4.1, 1.7],
  [33, 61, 5, 2.6, 2.4],
  [29, 70, 7, 3.6, 3.1],
  [-27, 56, 8, 3.8, 0.5],
  [-24, 63, 5, 3.0, 1.4],
  [-30, 60, 10, 4.4, 2.6],
  [3, 92, 6, 4.8, 1.1],
  [-6, 95, 4, 4.2, 3.3],
];
/** The drop starts when the collection's lower edge has risen this far up the screen. */
const DROP_START = "top 88%";

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
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const wake = useRef<() => void>(() => {});
  const motion = STAGES[brand.slug];
  const state = useMemo(() => createStageState(motion), [motion]);
  const [active, setActive] = useState(true);
  const { scrollTo, lenis } = useSmoothScroll();

  // The page always opens on its first scene: the browser is not to put it
  // back where it was (a reload, the back button), nor carry over the scroll
  // of the page before. Until the visitor scrolls, keep it at the top while
  // the layout and the scroll triggers settle.
  useIsomorphicLayoutEffect(() => {
    if (window.location.hash) return;
    history.scrollRestoration = "manual";
    const top = () => window.scrollY !== 0 && window.scrollTo(0, 0);
    top();
    const onRefresh = () => requestAnimationFrame(top);
    const stop = () => done();
    const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("load", onRefresh);
    events.forEach((t) => window.addEventListener(t, stop, { passive: true }));
    const timer = window.setTimeout(stop, 1500);
    function done() {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("load", onRefresh);
      events.forEach((t) => window.removeEventListener(t, stop));
      clearTimeout(timer);
    }
    return done;
  }, []);
  // Smooth scrolling may still be easing toward the old page's position.
  useEffect(() => {
    if (!window.location.hash && window.scrollY < 4) lenis?.scrollTo(0, { immediate: true, force: true });
  }, [lenis]);

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
    let gone = false;
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
      scene.current?.style.setProperty("--show", gone ? "0" : state.show.toFixed(3));
      // Once it has faded, or the collection covers it, there is nothing to draw.
      if (!gone && state.show > 0.005) wake.current();
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

    // The watch is done once the collection covers it.
    ScrollTrigger.create({
      trigger: hero.current,
      start: `bottom ${EXIT_END * 100}%`,
      onEnter: () => {
        gone = true;
        draw();
      },
      onLeaveBack: () => {
        gone = false;
        draw();
      },
    });

    // After the collection: the water film. As the collection's lower edge
    // rises, the watch drops out from under it into the water ("Su geçirmez"
    // as it goes in); then it rests there, bubbles rising, the words beside it.
    const sc = scene.current!;
    const drop = film.current;
    const water = back.current;
    if (!drop || !water) return;
    const set = (key: "film" | "splash" | "said", on: boolean) => {
      if (on) sc.dataset[key] = "";
      else delete sc.dataset[key];
    };
    const reset = () => {
      drop.pause();
      drop.currentTime = 0;
      set("splash", false);
      set("said", false);
    };
    ScrollTrigger.create({ trigger: water, start: "top bottom", end: "bottom top", onToggle: (self) => set("film", self.isActive) });
    ScrollTrigger.create({
      trigger: water,
      start: DROP_START,
      onEnter: () => {
        reset();
        drop.play().catch(() => {});
      },
      onLeaveBack: reset,
    });
    // The film ends on the watch at rest; it stays on that frame, with the bubbles going on over it.
    const onTime = () => {
      set("splash", drop.currentTime >= SPLASH_AT);
      set("said", drop.currentTime >= SAID_AT);
    };
    drop.addEventListener("timeupdate", onTime);
    drop.addEventListener("ended", onTime);
    return () => {
      drop.removeEventListener("timeupdate", onTime);
      drop.removeEventListener("ended", onTime);
    };
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
        {stage.film && (
          <div className={styles.film}>
            <video ref={film} className={styles.drop} muted playsInline preload="auto" poster={stage.film.drop.poster}>
              <source src={stage.film.drop.mobile} type="video/mp4" media="(max-width: 767px)" />
              <source src={stage.film.drop.mp4} type="video/mp4" />
              <source src={stage.film.drop.webm} type="video/webm" />
            </video>
            <div className={styles.bubbles}>
              {BUBBLES.map(([x, y, size, dur, delay], i) => (
                <i
                  key={i}
                  style={
                    {
                      "--x": x,
                      "--y": `${y}%`,
                      "--rise": y - SURFACE,
                      "--size": `${size}px`,
                      animationDuration: `${dur}s`,
                      animationDelay: `${delay}s`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            {stage.water && (
              <>
                <h2 className={`${styles.lineTitle} ${styles.waterTitle}`}>
                  {stage.water.title.split(stage.water.accent)[0]}
                  <em>{stage.water.accent}</em>
                  {stage.water.title.split(stage.water.accent)[1]}
                </h2>
                <div className={styles.waterText}>
                  <p className={styles.eyebrow}>{stage.water.eyebrow}</p>
                  <p className={styles.lineText}>{stage.water.text}</p>
                </div>
              </>
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
            <button type="button" className={styles.button} onClick={() => scrollTo(next, { immediate: true })}>
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
      {stage.film && <section ref={back} className={styles.back} aria-hidden />}
      {rest && <div className={styles.over}>{rest}</div>}
    </div>
  );
}
