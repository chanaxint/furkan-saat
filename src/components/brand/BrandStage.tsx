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
import { Quaternion } from "three";
import { SHOWCASE_FOV } from "@/lib/scene/showcase";
import { WaterDrops } from "@/lib/scene/drops";
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

/**
 * Into the water (the brand's `pool` film, its own watch taken out: it drops
 * in, and the same splash runs backwards as it comes out). After the film the
 * watch goes on up, clear of the water, and comes to rest: how long that
 * takes, and where it rests and how big (fractions of the screen's height).
 */
const SETTLE_FOR = 0.9;
const SETTLE_TO = { y: 0.28, r: 0.17 };
/** After the watch has settled and the page holds still, a breath before it drops. */
const BEAT_MS = 220;
/** The 3D watch's head radius in scene units (to size it like the filmed one). */
const HEAD_R = 0.452;
const smooth01 = (k: number) => {
  const t = Math.min(1, Math.max(0, k));
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
  const water = useRef<HTMLDivElement>(null);
  const said = useRef<HTMLDivElement>(null);
  const drops = useRef<HTMLCanvasElement>(null);
  const tint = useRef<HTMLDivElement>(null);
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
    // Into the water: as the watch settles into the scene marked for it, the
    // page holds still and the pool film plays; the 3D watch follows the filmed
    // watch's path down into the water, then rises out of it with water
    // running off it. Scrolling on takes it from there to the next scene;
    // scrolling back above that point resets it all.
    const si = motion.scenes.findIndex((sc) => sc.splash);
    const pool = stage.pool;
    const startAt = si > 0 ? times[si].arrive - 0.02 : Infinity;
    const until = si > 0 ? times[si].leave : Infinity;
    const nextMove = si > 0 && si + 1 < motion.scenes.length ? motion.scenes[si + 1].move : 1;
    const film = water.current?.querySelector("video") ?? null;
    film?.pause();
    const clock = { p: 0 };
    let main: ScrollTrigger | null = null;
    let gone = false;
    // idle → run (film playing, the page held) → done (out of the water)
    let phase: "idle" | "run" | "done" = "idle";
    let raf = 0;
    let lastT = 0;
    let emerged = false;
    // performance.now() at film time 0 (0 until it plays)
    let t0 = 0;
    const dur = pool ? (pool.track.x.length - 1) / pool.fps : 0;
    const ov = { x: 0, y: 0, z: 0, q: [0, 0, 0, 1] as [number, number, number, number] };
    const qa = new Quaternion();
    const qb = new Quaternion();
    const qFront = new Quaternion();
    const qStart = si > 0 ? new Quaternion().fromArray(motion.scenes[si].q).normalize() : new Quaternion();
    const time = () => {
      const h = hero.current!;
      const vh = window.innerHeight;
      const pinned = Math.max(1, h.offsetHeight - vh);
      const p0 = pinned / (pinned + vh * (1 - EXIT_END));
      return clock.p < p0 ? (clock.p / p0) * exit : exit + ((clock.p - p0) / (1 - p0)) * (total - exit);
    };
    // The filmed watch at film time c, on screen (the film is shown object-fit: cover).
    const filmed = (c: number) => {
      const tr = pool!.track;
      const n = tr.x.length - 1;
      const fi = Math.min(n, Math.max(0, c * pool!.fps));
      const i0 = Math.floor(fi);
      const i1 = Math.min(n, i0 + 1);
      const k = fi - i0;
      const L = (a: number[]) => a[i0] * (1 - k) + a[i1] * k;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const sc = Math.max(W / pool!.size[0], H / pool!.size[1]);
      const ox = (W - pool!.size[0] * sc) / 2;
      const oy = (H - pool!.size[1] * sc) / 2;
      return { x: ox + L(tr.x) * sc, y: oy + L(tr.y) * sc, r: L(tr.r) * sc, s: oy + L(tr.s) * sc, W, H, frame: fi, src: L(tr.src) };
    };
    // A head at (sx, sy) of radius r px on screen → the scene's state (undoing the phone placement in ShowcaseWatchScene).
    const toScene = (sx: number, sy: number, r: number, W: number, H: number) => {
      const f = H / 2 / Math.tan(((SHOWCASE_FOV / 2) * Math.PI) / 180);
      const pz = (f * HEAD_R) / r;
      const px = ((sx - W / 2) * pz) / f;
      const py = (-(sy - H / 2) * pz) / f;
      const aspect = W / H;
      const portrait = aspect < 1 ? 1 - aspect : 0;
      const xf = Math.max(0, 1 - portrait * 2);
      ov.x = xf > 0.02 ? px / xf : 0;
      ov.y = py - portrait * PORTRAIT.lift;
      ov.z = -pz / (1 + portrait * PORTRAIT.pull);
    };
    const dropsCanvas = drops.current;
    const water2 = dropsCanvas ? new WaterDrops(dropsCanvas) : null;
    const sc = scene.current!;
    const tintEl = tint.current;
    // The watch under water takes on the water's colour, below the surface line only.
    const setTint = (h: { x: number; y: number; r: number; s: number }, a: number) => {
      if (!tintEl) return;
      const top = Math.max(h.s, h.y - h.r * 3);
      const on = a > 0.01 && top < h.y + h.r * 3;
      tintEl.style.visibility = on ? "visible" : "hidden";
      if (!on) return;
      tintEl.style.opacity = a.toFixed(3);
      tintEl.style.left = `${h.x - h.r * 1.9}px`;
      tintEl.style.width = `${h.r * 3.8}px`;
      tintEl.style.top = `${top}px`;
    };
    const setSaid = (a: number) => {
      const s2 = said.current;
      if (!s2) return;
      s2.style.opacity = a.toFixed(3);
      s2.style.visibility = a < 0.01 ? "hidden" : "visible";
      s2.style.setProperty("--shift", `${(1 - a) * 30}px`);
    };
    // Each frame while the film plays (and while drops are still running).
    const tick = () => {
      raf = 0;
      if (!film || !pool) return;
      const now = performance.now();
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      // A steady clock from the moment the film starts (kept in step with it),
      // so the watch moves every frame, not only when the film reports a new time.
      let c = film.currentTime;
      if (t0) {
        c = (now - t0) / 1000;
        if (!film.paused && !film.ended && Math.abs(c - film.currentTime) > 0.12) {
          t0 = now - film.currentTime * 1000;
          c = film.currentTime;
        }
      }
      if (phase === "run") {
        // The film's frame, or (once it is over) its last one.
        const h = filmed(Math.min(c, dur));
        let sy = h.y;
        let r = h.r;
        let under = 1;
        // Down with the filmed watch, turning to face us, and back up out of
        // the water with it (turning back); then on up and to rest, facing us.
        qa.copy(qStart).slerp(qFront, smooth01(h.src / 150));
        if (c > dur) {
          const e = smooth01((c - dur) / SETTLE_FOR);
          sy = h.y + (h.H * SETTLE_TO.y - h.y) * e;
          r = h.r + (Math.min(h.r, h.H * SETTLE_TO.r) - h.r) * e;
          qa.slerp(qFront, e);
          under = 1 - e;
        }
        toScene(h.x, sy, r, h.W, h.H);
        ov.q = qa.toArray() as [number, number, number, number];
        setTint({ x: h.x, y: sy, r, s: h.s }, under);
        // Out of the water: drops on it, drips off it (and they go up with it).
        if (water2) {
          if (!emerged && h.frame >= pool.track.up && sy < h.s) {
            emerged = true;
            water2.emerge(h.x, sy, r, sy + r * 1.1);
          }
          if (emerged) water2.moveTo(h.x, sy);
        }
        setSaid(smooth01((c - dur - 0.25) / 0.5));
        if (c >= dur + SETTLE_FOR + 0.3) unlock();
        if (c >= dur + SETTLE_FOR) phase = "done";
        draw();
      }
      let more = false;
      if (water2 && water2.alive) {
        more = water2.frame(dt) && water2.fade > 0;
        if (!more) water2.clear();
      }
      if (phase === "run" || more) raf = requestAnimationFrame(tick);
      else lastT = 0;
    };
    // While the water plays, the page holds still: no scrolling until the watch is out.
    const stop = (e: Event) => e.preventDefault();
    const stopKeys = (e: KeyboardEvent) => {
      if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault();
    };
    let locked = false;
    let release = 0;
    function unlock() {
      if (!locked) return;
      locked = false;
      clearTimeout(release);
      lenisRef.current?.start();
      document.documentElement.style.removeProperty("overflow");
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stopKeys);
    }
    const lock = () => {
      if (locked) return;
      locked = true;
      lenisRef.current?.stop();
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("wheel", stop, { passive: false });
      window.addEventListener("touchmove", stop, { passive: false });
      window.addEventListener("keydown", stopKeys);
      // Never longer than the run (should the film not play at all, a short hold).
      release = window.setTimeout(unlock, (dur + SETTLE_FOR + 2) * 1000 + BEAT_MS);
    };
    // Where the page must stand for the timeline to read `t` (it holds there while the water plays).
    const scrollFor = (t: number) => {
      const st = main;
      if (!st) return window.scrollY;
      const h = hero.current!;
      const vh = window.innerHeight;
      const pinned = Math.max(1, h.offsetHeight - vh);
      const p0 = pinned / (pinned + vh * (1 - EXIT_END));
      const p = t < exit ? (t / exit) * p0 : p0 + ((t - exit) / (total - exit)) * (1 - p0);
      return st.start + p * (st.end - st.start);
    };
    let beat = 0;
    const reset = () => {
      phase = "idle";
      emerged = false;
      clearTimeout(beat);
      film?.pause();
      t0 = 0;
      if (film) film.currentTime = 0;
      delete sc.dataset.film;
      water2?.clear();
      setSaid(0);
      setTint({ x: 0, y: 0, r: 0, s: 0 }, 0);
      unlock();
    };
    const run = (t: number) => {
      if (!film || !pool) return;
      if (phase === "idle" && t >= startAt && t < until) {
        // The watch has settled: the page holds still, the water shows, and a beat later it drops.
        phase = "run";
        emerged = false;
        const y = scrollFor(startAt + 0.02);
        if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        lock();
        film.currentTime = 0;
        sc.dataset.film = "";
        clearTimeout(beat);
        beat = window.setTimeout(() => film.play().catch(() => {}), BEAT_MS);
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (phase !== "idle" && t < startAt - 0.3) {
        reset();
      }
    };
    const draw = () => {
      const t = time();
      const o = sampleStage(motion, t, state, stage.lines.length);
      applyOverlay(o, title.current, lines.current, sides);
      run(t);
      if (phase !== "idle") {
        // The watch goes where the water takes it; scrolling on, it eases from there into the next scene.
        const k = t > until ? smooth01((t - until) / Math.max(0.1, nextMove)) : 0;
        state.x = ov.x + (state.x - ov.x) * k;
        state.y = ov.y + (state.y - ov.y) * k;
        state.z = ov.z + (state.z - ov.z) * k;
        qb.fromArray(state.q);
        state.q = qa.fromArray(ov.q).slerp(qb, k).toArray() as [number, number, number, number];
        // The water leaves as the page moves on, drops and all.
        const away = t > until ? Math.max(0, 1 - (t - until) / 0.5) : 1;
        sc.style.setProperty("--pool", away.toFixed(3));
        if (water2) water2.fade = away;
        if (away <= 0) delete sc.dataset.film;
        else sc.dataset.film = "";
        if (away < 1) setSaid(Math.min(away, said.current ? Number(said.current.style.opacity || 0) : 0));
      }
      scene.current?.style.setProperty("--show", gone ? "0" : state.show.toFixed(3));
      // Once it has faded, or the collection covers it, there is nothing to draw.
      if (!gone && state.show > 0.005) wake.current();
    };
    draw();
    const tl = gsap.to(clock, { p: 1, ease: "none", onUpdate: draw });
    main = ScrollTrigger.create({
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
      if (film) t0 = performance.now() - film.currentTime * 1000;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onResize = () => water2?.resize();
    film?.addEventListener("playing", onPlay);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      reset();
      film?.removeEventListener("playing", onPlay);
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
        {stage.pool && (
          // The water, behind the 3D watch (its own watch taken out).
          <div ref={water} className={styles.water}>
            <video className={styles.pool} muted playsInline preload="auto" poster={stage.pool.poster}>
              <source src={stage.pool.mobile} type="video/mp4" media="(max-width: 767px)" />
              <source src={stage.pool.mp4} type="video/mp4" />
              {stage.pool.webm && <source src={stage.pool.webm} type="video/webm" />}
            </video>
          </div>
        )}
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
        {stage.pool && <div ref={tint} className={styles.tint} />}
        {stage.pool && <canvas ref={drops} className={styles.drops} />}
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
