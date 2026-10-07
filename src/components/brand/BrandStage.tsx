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

/** Seconds into the splash film when "Su geçirmez" appears (the water reaching the watch). */
const SAID_AT = 1.6;

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
  const water = useRef<HTMLDivElement>(null);
  const said = useRef<HTMLDivElement>(null);
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
    const { total, times } = sceneTimes(motion);
    const exit = exitStart(motion);
    // The splash: as the watch settles into the scene marked for it, the
    // water crashes in once, in real time (not scrubbed). Scrolling back above
    // that point resets it, so it can crash in again.
    const si = motion.scenes.findIndex((sc) => sc.splash);
    const hitAt = si > 0 ? times[si].arrive - 0.15 : Infinity;
    const until = si > 0 ? times[si].leave + 0.6 : Infinity;
    const vids = Array.from(water.current?.querySelectorAll("video") ?? []);
    vids.forEach((v) => v.pause());
    const clock = { p: 0 };
    let gone = false;
    let played = false;
    let inWindow = false;
    let raf = 0;
    const time = () => {
      const h = hero.current!;
      const vh = window.innerHeight;
      const pinned = Math.max(1, h.offsetHeight - vh);
      const p0 = pinned / (pinned + vh * (1 - EXIT_END));
      return clock.p < p0 ? (clock.p / p0) * exit : exit + ((clock.p - p0) / (1 - p0)) * (total - exit);
    };
    // While the film plays: fade it in and out at its ends, keep the second copy in step, show the words.
    const tick = () => {
      raf = 0;
      const w = water.current;
      const lead = vids[0];
      if (!w || !lead) return;
      const d = lead.duration || 8;
      const c = lead.currentTime;
      const fade = played && inWindow ? Math.min(1, c / 0.12, (d - c) / 0.6) : 0;
      w.style.opacity = Math.max(0, fade).toFixed(3);
      w.style.visibility = fade > 0.001 ? "visible" : "hidden";
      for (const v of vids.slice(1)) if (Math.abs(v.currentTime - c) > 0.04) v.currentTime = c;
      const s2 = said.current;
      if (s2) {
        const a = played && inWindow ? Math.min(1, Math.max(0, (c - SAID_AT) / 0.5)) : 0;
        s2.style.opacity = a.toFixed(3);
        s2.style.visibility = a < 0.01 ? "hidden" : "visible";
        s2.style.setProperty("--shift", `${(1 - a) * 30}px`);
      }
      if (played && !lead.paused && !lead.ended) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const splash = (t: number) => {
      if (!vids.length) return;
      inWindow = t < until;
      if (!played && t >= hitAt && inWindow) {
        played = true;
        vids.forEach((v) => {
          v.currentTime = 0;
          v.play().catch(() => {});
        });
      } else if (played && t < hitAt - 0.3) {
        played = false;
        vids.forEach((v) => {
          v.pause();
          v.currentTime = 0;
        });
      }
      run();
    };
    const draw = () => {
      const t = time();
      const o = sampleStage(motion, t, state, stage.lines.length);
      applyOverlay(o, title.current, lines.current, sides);
      splash(t);
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
    const onPlay = () => run();
    vids.forEach((v) => {
      v.addEventListener("playing", onPlay);
      v.addEventListener("ended", onPlay);
    });
    return () => {
      cancelAnimationFrame(raf);
      vids.forEach((v) => {
        v.removeEventListener("playing", onPlay);
        v.removeEventListener("ended", onPlay);
      });
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
            caseback={stage.caseback}
            active={active}
            onWake={onWake}
            tone="steel"
            portrait={PORTRAIT}
          />
        </div>
        {stage.splash && (
          // The same film twice: inverted and multiplied, the water's body and
          // edges darken the light ground like real water; screened, its
          // highlights brighten the watch behind it.
          <div ref={water} className={styles.water}>
            {(["body", "light"] as const).map((k) => (
              <video key={k} className={styles.splash} data-layer={k} muted playsInline preload="auto">
                <source src={stage.splash!.mobile} type="video/mp4" media="(max-width: 767px)" />
                <source src={stage.splash!.mp4} type="video/mp4" />
                {stage.splash!.webm && <source src={stage.splash!.webm} type="video/webm" />}
              </video>
            ))}
          </div>
        )}
        {stage.water && (
          <div ref={said} className={styles.said}>
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
