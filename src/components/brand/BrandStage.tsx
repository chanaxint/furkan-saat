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
      const t = time();
      const o = sampleStage(motion, t, state, stage.lines.length);
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
            caseback={stage.caseback}
            active={active}
            onWake={onWake}
            tone="steel"
            portrait={PORTRAIT}
          />
        </div>
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
      {rest && <div className={styles.over}>{rest}</div>}
    </div>
  );
}
