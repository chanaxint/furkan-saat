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
import { SHOWCASE_FOV } from "@/lib/scene/showcase";
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

/** Seconds into the splash film when "Su geçirmez" appears (the water has hit the watch). */
const SAID_AT = 0.9;
/**
 * The splash film is water only (the filmed watch taken out), as a
 * hard-light map: mid-grey leaves the page as it is, darker darkens, lighter
 * brightens. Its frame is 1920×1080; the filmed watch's head sat at WATCH_AT,
 * and one unit of the 3D scene measured UNIT pixels there. The film is placed
 * on the 3D watch's position and size on screen, so the water hits it on any
 * screen.
 */
const FILM = { w: 1920, h: 1080 };
const WATCH_AT = { x: 853.8, y: 545.6 };
const UNIT = 513.5;

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
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

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
    // The splash: as the watch settles into the scene marked for it, the water
    // crashes into it, once, in real time (60 fps) while the page holds still.
    // Scrolling back above that point resets it, to crash in again.
    const si = motion.scenes.findIndex((sc) => sc.splash);
    const hitAt = si > 0 ? times[si].arrive - 0.05 : Infinity;
    const until = si > 0 ? times[si].leave : Infinity;
    const film = water.current?.querySelector("video") ?? null;
    film?.pause();
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
    // Put the water on the 3D watch: where its head is on screen, at its size (as ShowcaseWatchScene places it).
    const place = () => {
      const w = water.current;
      if (!w) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const aspect = W / H;
      const portrait = aspect < 1 ? 1 - aspect : 0;
      const px = state.x * Math.max(0, 1 - portrait * 2);
      const py = state.y + portrait * PORTRAIT.lift;
      const pz = -state.z * (1 + portrait * PORTRAIT.pull);
      const f = H / 2 / Math.tan(((SHOWCASE_FOV / 2) * Math.PI) / 180);
      const k = f / pz / UNIT;
      const sx = W / 2 + (px / pz) * f;
      const sy = H / 2 - (py / pz) * f;
      w.style.transform = `translate(${sx - WATCH_AT.x * k}px, ${sy - WATCH_AT.y * k}px) scale(${k})`;
    };
    // While the film plays: fade it in and out at its ends, show the words.
    const tick = () => {
      raf = 0;
      const w = water.current;
      if (!w || !film) return;
      const d = film.duration || 3.3;
      const c = film.currentTime;
      const a = played && inWindow ? Math.max(0, Math.min(1, c / 0.05, (d - c) / 0.45)) : 0;
      w.style.opacity = a.toFixed(3);
      w.style.visibility = a > 0.001 ? "visible" : "hidden";
      const s2 = said.current;
      if (s2) {
        const b = played && inWindow ? Math.min(1, Math.max(0, (c - SAID_AT) / 0.4)) : 0;
        s2.style.opacity = b.toFixed(3);
        s2.style.visibility = b < 0.01 ? "hidden" : "visible";
        s2.style.setProperty("--shift", `${(1 - b) * 30}px`);
      }
      if (played && !film.paused && !film.ended) raf = requestAnimationFrame(tick);
    };
    const sc = scene.current!;
    // While the water hits, the page holds still: no scrolling until the film has played.
    const stop = (e: Event) => e.preventDefault();
    const stopKeys = (e: KeyboardEvent) => {
      if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault();
    };
    let locked = false;
    let release = 0;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      clearTimeout(release);
      lenisRef.current?.start();
      document.documentElement.style.removeProperty("overflow");
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stopKeys);
    };
    const lock = () => {
      if (locked || !film) return;
      locked = true;
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("wheel", stop, { passive: false });
      window.addEventListener("touchmove", stop, { passive: false });
      window.addEventListener("keydown", stopKeys);
      // Never longer than the film (should it not play at all, a short hold).
      release = window.setTimeout(unlock, ((film.duration || 3.3) + 0.3) * 1000);
    };
    const splash = (t: number) => {
      if (!film) return;
      inWindow = t < until;
      if (!played && t >= hitAt && inWindow) {
        played = true;
        place();
        film.currentTime = 0;
        film.play().catch(() => {});
        lock();
      } else if (played && t < hitAt - 0.3) {
        played = false;
        film.pause();
        film.currentTime = 0;
      }
      if (played) place();
      if (!raf) raf = requestAnimationFrame(tick);
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
    const onPlay = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => played && place();
    film?.addEventListener("playing", onPlay);
    film?.addEventListener("ended", unlock);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      unlock();
      film?.removeEventListener("playing", onPlay);
      film?.removeEventListener("ended", unlock);
      window.removeEventListener("resize", onResize);
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
          <div ref={water} className={styles.water}>
            <video className={styles.splash} muted playsInline preload="auto">
              <source src={stage.splash.mobile} type="video/mp4" media="(max-width: 767px)" />
              <source src={stage.splash.mp4} type="video/mp4" />
              {stage.splash.webm && <source src={stage.splash.webm} type="video/webm" />}
            </video>
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
