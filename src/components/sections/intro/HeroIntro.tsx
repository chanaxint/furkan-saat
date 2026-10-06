"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { introSound } from "@/lib/sound/introSound";
import styles from "./HeroIntro.module.css";

/**
 * idle       first frame, "Aşağı kaydırın" — the page is held at the top
 * playing    the film plays once, start to end
 * line       the film cuts to black and "İstediğiniz her saat" is there at once
 * mark       the line gives way to "Furkan Saat"
 * done       the page is released; scrolling continues into the black → green blend
 *
 * Sound (lib/sound/introSound): ticks that accelerate with the film, a deep
 * hit on the cut, a chime with the name.
 */
type Phase = "idle" | "playing" | "line" | "mark" | "done";

/** How long each title holds (ms). */
const LINE_MS = 1500;
const MARK_MS = 1200;
/** If a film stalls (slow network), the sequence moves on anyway. */
const SAFETY_MS = 14000;

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);
const FORWARD_KEYS = new Set(["ArrowDown", "PageDown", "End", " ", "Spacebar"]);

const { film } = ASSETS.intro;

/**
 * The opening plays only when the site is entered (or reloaded) on the home
 * page — never when coming back to it from another page.
 */
let introUsed = false;
function introAllowed() {
  if (introUsed) return false;
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  return !nav || new URL(nav.name).pathname === "/";
}

/**
 * Where to land instead of the opening: the section a link's #hash names
 * (the wordmark leads to the campaign).
 */
function landing(): HTMLElement | null {
  const target = window.location.hash || (introAllowed() ? "" : "#markalar");
  if (!target || target === "#top") return null;
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

/**
 * HERO INTRO — the opening of the home page. The visitor's first scroll plays
 * the film; when it ends, the titles cut in over black, and the page then
 * flows through a band where the black mixes into the house green. It plays
 * once per visit (entering or reloading the site); scrolling back up never
 * leads back into it, and returning to the home page skips it.
 */
export function HeroIntro() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<number[]>([]);
  const { lenis, scrollTo } = useSmoothScroll();

  /** Start the accelerating ticks in step with the film, from wherever it is. */
  const rise = useCallback(() => {
    const v = video.current;
    if (phaseRef.current !== "playing" || !v || !introSound.ready) return;
    introSound.rise(Number.isFinite(v.duration) ? v.duration : 5, v.currentTime);
  }, []);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /** The film has ended (or could not play): titles, then release. */
  const titles = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    clearTimers();
    go("line");
    introSound.impact();
    later(() => {
      go("mark");
      introSound.chime();
    }, LINE_MS);
    later(() => go("done"), LINE_MS + MARK_MS);
  }, [go, later, clearTimers]);

  const start = useCallback(() => {
    // Not while the site loader is still on screen.
    if (phaseRef.current !== "idle" || document.documentElement.hasAttribute("data-loading")) return;
    go("playing");
    introSound.stop();
    const v = video.current;
    later(titles, SAFETY_MS);
    if (!v) return titles();
    v.currentTime = 0;
    v.play().catch(titles);
  }, [go, later, titles]);

  // Hold the page at the top while the opening plays.
  useEffect(() => {
    const mountedAt = performance.now();
    // Leaving the home page (not React's quick remount in development): the opening is spent.
    const spent = () => {
      if (performance.now() - mountedAt > 1000) introUsed = true;
    };
    // The browser does not put a reloaded page back where it was: a reload starts at the opening.
    history.scrollRestoration = "manual";
    if ((performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload" && window.location.hash) {
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    }
    const land = landing();
    let unland = () => {};
    if (land) {
      // The site loader is not to fly onto the film's watch: the page opens elsewhere.
      document.documentElement.dataset.landing = "";
      // (clear of the bar when the section asks for it with scroll-margin-top)
      const margin = parseFloat(getComputedStyle(land).scrollMarginTop) || 0;
      const jump = () => window.scrollTo(0, land.getBoundingClientRect().top + window.scrollY - margin);
      jump();
      // Layout settles (images, fonts) and ScrollTrigger measures (scrolling to 0 and back)
      // after this; until the visitor scrolls, keep putting the page on its target.
      const onRefresh = () => requestAnimationFrame(jump);
      const onLoad = () => requestAnimationFrame(jump);
      const stop = () => unland();
      ScrollTrigger.addEventListener("refresh", onRefresh);
      window.addEventListener("load", onLoad);
      ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) => window.addEventListener(t, stop, { passive: true }));
      const timer = window.setTimeout(stop, 2500);
      unland = () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        window.removeEventListener("load", onLoad);
        ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) => window.removeEventListener(t, stop));
        clearTimeout(timer);
      };
    }
    // Arriving mid-page (back button, a link to a section, a reload) or with reduced motion: no hold.
    if (land || window.scrollY > 40 || prefersReducedMotion()) {
      go("done");
      delete document.documentElement.dataset.intro;
      return () => {
        unland();
        spent();
      };
    }
    let touchY = 0;

    const held = () => phaseRef.current !== "done";

    // While the opening holds the page, a scroll down starts the film; nothing leads back into it.
    const onWheel = (e: WheelEvent) => {
      if (!held()) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 0) start();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      if (!held()) return;
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (e.cancelable) e.preventDefault();
      if (dy > 8) start();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (!held()) return;
      e.preventDefault();
      if (FORWARD_KEYS.has(e.key)) start();
    };
    const onScroll = () => {
      // The scrollbar (or anything else) moving a held page: back to the top,
      // and on the first frame it counts as the scroll that starts the film.
      if (held() && window.scrollY > 0) {
        window.scrollTo(0, 0);
        start();
      }
    };

    // Sound may only start after a click, tap or key press; the ticks then join the film where it is.
    const onActivate = () => void introSound.unlock().then((ok) => ok && rise());

    const opts = { capture: true, passive: false } as const;
    const activation = ["pointerdown", "pointerup", "keydown", "touchend"] as const;
    activation.forEach((t) => window.addEventListener(t, onActivate, { capture: true, passive: true }));
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("keydown", onKey, opts);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      activation.forEach((t) => window.removeEventListener(t, onActivate, { capture: true }));
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, opts);
      window.removeEventListener("scroll", onScroll);
      clearTimers();
      delete document.documentElement.dataset.intro;
      spent();
    };
  }, [go, start, clearTimers, rise]);

  // Smooth scrolling only runs once released. The navigation stays away while
  // the opening plays and the name fills the screen, and returns once the page
  // has scrolled on.
  useEffect(() => {
    const html = document.documentElement;
    if (lenis) {
      if (phase === "done") lenis.start();
      else lenis.stop();
    }
    if (phase !== "done") {
      html.dataset.intro = "";
      return;
    }
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.35) delete html.dataset.intro;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase, lenis]);

  // Once released, the titles lift away as the page scrolls on.
  useGsap(() => {
    const el = root.current!;
    gsap.to(`.${styles.titles}`, {
      yPercent: -24,
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top top", end: "60% top", scrub: true },
    });
  }, root);

  const onCue = () => (phase === "done" ? scrollTo("#markalar") : start());

  return (
    <section ref={root} id="top" className={styles.intro} data-nav-theme="dark" aria-label="Açılış">
      <div className={styles.stage} data-phase={phase}>
        <video
          ref={video}
          className={styles.video}
          data-intro-video
          poster={film.poster}
          muted
          playsInline
          preload="auto"
          onEnded={titles}
          onPlaying={rise}
          aria-hidden
        >
          <source src={film.mobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={film.mp4} type="video/mp4" />
          <source src={film.webm} type="video/webm" />
        </video>
        <div className={styles.grade} aria-hidden />

        <div className={styles.titles}>
          <p className={styles.line} aria-hidden>
            İstediğiniz <em>her saat</em>
          </p>
          <h1 className={styles.mark}>
            Furkan <span>Saat</span>
            <span className="visually-hidden"> — Nevşehir&apos;de seçkin saatlerin özel evi</span>
          </h1>
          <span className={styles.rule} aria-hidden />
        </div>

        <button type="button" className={styles.cue} onClick={onCue}>
          Aşağı kaydırın
          <span className={styles.cueLine} aria-hidden />
        </button>
      </div>

      {/* Where the black of the film turns, tone by tone, into the cream of the site. */}
      <div className={styles.blend} aria-hidden />
    </section>
  );
}
