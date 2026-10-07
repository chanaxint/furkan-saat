"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { ASSETS } from "@/lib/assets";
import { BRANDS } from "@/lib/data/brands";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./SiteLoader.module.css";

/**
 * SITE LOADER — on the first load of any page.
 *
 *   mark   "Furkan Saat" fades in, holds, and steps back
 *   ring   a hairline ring draws its progress around "Loading" while the
 *          fonts, the opening film's first frame and the film itself load
 *   land   home page: the ring travels and resizes onto the bezel of the
 *          watch in the film's first frame as the black lifts, so the ring
 *          becomes the watch; other pages: it simply fades
 */
type Phase = "mark" | "ring" | "land" | "done";

/** Shortest and longest time on screen (ms). */
const MIN_MS = 2800;
const MAX_MS = 9000;
/** The wordmark holds this long before the ring takes over. */
const MARK_MS = 1350;
/** Ring diameter while loading (px); see .ring in the CSS. */
const RING = 168;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Pages that open on a loader of their own (a brand's `loader`). */
const OWN_LOADER = new Set(BRANDS.filter((b) => b.loader).map((b) => `/markalar/${b.slug}`));

export function SiteLoader() {
  const path = usePathname() ?? "";
  // A visit that starts on a page with its own loader opens on that one
  // instead (decided once, on the first page, so it never plays later on).
  const [own] = useState(() => OWN_LOADER.has(path));
  // The management panel opens without it.
  const admin = path.startsWith("/yonetim");
  if (admin || own) return null;
  return <Loader />;
}

function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGCircleElement>(null);
  const [phase, setPhase] = useState<Phase>("mark");
  const { lenis } = useSmoothScroll();

  // Hold the page still while the loader is up.
  useIsoLayoutEffect(() => {
    document.documentElement.setAttribute("data-loading", "");
    return () => document.documentElement.removeAttribute("data-loading");
  }, []);
  useEffect(() => {
    if (!lenis) return;
    if (phase === "done") lenis.start();
    else lenis.stop();
  }, [lenis, phase]);

  useEffect(() => {
    const born = performance.now();
    const reduced = prefersReducedMotion();
    let target = 0.08;
    let shown = 0;
    let raf = 0;
    let finished = false;
    const timers: number[] = [];
    const parts = { fonts: 0, poster: 0, film: 0 };
    const update = () => (target = 0.08 + 0.92 * (parts.fonts * 0.2 + parts.poster * 0.25 + parts.film * 0.55));

    // What there is to wait for.
    document.fonts?.ready.then(() => ((parts.fonts = 1), update()));
    const video = document.querySelector<HTMLVideoElement>("[data-intro-video]");
    const home = !!video && window.scrollY < 10 && !document.documentElement.hasAttribute("data-landing");
    if (home && video) {
      const img = new Image();
      img.src = ASSETS.intro.film.poster;
      img.decode().then(
        () => ((parts.poster = 1), update()),
        () => ((parts.poster = 1), update()),
      );
      const onProgress = () => {
        if (video.readyState >= 4) parts.film = 1;
        else if (video.duration && video.buffered.length)
          parts.film = Math.min(1, video.buffered.end(video.buffered.length - 1) / video.duration);
        update();
      };
      ["progress", "canplaythrough", "loadeddata"].forEach((e) => video.addEventListener(e, onProgress));
      onProgress();
    } else {
      parts.poster = 1;
      const onLoad = () => ((parts.film = 1), update());
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }
    update();

    timers.push(window.setTimeout(() => setPhase("ring"), reduced ? 200 : MARK_MS));
    timers.push(window.setTimeout(() => ((target = 1), (parts.film = 1)), MAX_MS));

    const tick = () => {
      const elapsed = performance.now() - born;
      // The arc never runs ahead of what has loaded, and fills smoothly.
      const cap = elapsed < MIN_MS ? Math.min(target, 0.25 + (0.75 * elapsed) / MIN_MS) : target;
      shown += (cap - shown) * 0.06;
      if (arc.current) arc.current.style.strokeDashoffset = String(1 - shown);
      if (shown > 0.995 && elapsed >= MIN_MS && !finished) {
        finished = true;
        land(home && !reduced);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const land = (toWatch: boolean) => {
      setPhase("land");
      const el = root.current;
      const r = ring.current;
      if (!el || !r) return setPhase("done");
      const tl = gsap.timeline({ onComplete: () => setPhase("done") });
      tl.set([r, `.${styles.label}`], { transition: "none", animation: "none" }, 0);
      if (toWatch && video) {
        // Where the bezel sits on screen: the film is cover-fitted to its box.
        const box = video.getBoundingClientRect();
        const { dial, aspect } = ASSETS.intro.film;
        const fh = Math.max(box.height, box.width / aspect);
        const fw = fh * aspect;
        const x = box.left + box.width / 2 + (dial.cx - 0.5) * fw;
        const y = box.top + box.height / 2 + (dial.cy - 0.5) * fh;
        const d = dial.r * 2 * fh;
        tl.to(`.${styles.label}`, { autoAlpha: 0, duration: 0.35, ease: "power1.in" }, 0)
          .to(r, { x: x - window.innerWidth / 2, y: y - window.innerHeight / 2, scale: d / RING, duration: 1.15, ease: "power3.inOut" }, 0.2)
          .to(`.${styles.track}`, { opacity: 0, duration: 0.6 }, 0.2)
          .to(el, { "--veil": 0, duration: 0.9, ease: "power2.inOut" }, 0.55)
          // On the bezel: a brief glint, then the ring dissolves into the watch.
          .to(arc.current, { opacity: 1, stroke: "#f4e6c6", duration: 0.25 }, 1.3)
          .to(r, { autoAlpha: 0, scale: (d / RING) * 1.06, duration: 0.7, ease: "power2.out" }, 1.5);
      } else {
        tl.to(el, { autoAlpha: 0, duration: 0.7, ease: "power2.inOut" }, 0);
      }
    };

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (phase === "done") document.documentElement.removeAttribute("data-loading");
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      ref={root}
      className={styles.loader}
      data-phase={phase}
      role="status"
      aria-label="Yükleniyor"
    >
      <p className={styles.mark} aria-hidden>
        Furkan <span>Saat</span>
      </p>
      <div ref={ring} className={styles.ring} aria-hidden>
        <svg viewBox="0 0 200 200" className={styles.svg}>
          <circle className={styles.track} cx="100" cy="100" r="99" />
          <circle ref={arc} className={styles.arc} cx="100" cy="100" r="99" pathLength={1} />
        </svg>
        {/* lang="en": English capitals (LOADING, not LOADİNG). */}
        <span className={styles.label} lang="en">
          Loading
        </span>
      </div>
    </div>
  );
}
