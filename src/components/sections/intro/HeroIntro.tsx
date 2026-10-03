"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./HeroIntro.module.css";

/**
 * idle    first frame, "Aşağı kaydırın" — the page is held at the top
 * playing the film plays once, start to end
 * line    the film dims, "İstediğiniz her saat" fades in
 * mark    the line leaves, "Furkan Saat" arrives
 * done    the page is released; scrolling continues into the black → green blend
 */
type Phase = "idle" | "playing" | "line" | "mark" | "done";

/** How long each title holds (ms). */
const LINE_MS = 3200;
const MARK_MS = 1700;
/** If the film stalls (slow network), the titles come anyway. */
const SAFETY_MS = 14000;

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);
const FORWARD_KEYS = new Set(["ArrowDown", "PageDown", "End", " ", "Spacebar"]);

const { film } = ASSETS.intro;

/**
 * HERO INTRO — the opening of the home page. The visitor's first scroll plays
 * the film; when it ends, the titles fade in over black, and the page then
 * flows through a band where the black mixes into the house green.
 */
export function HeroIntro() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<number[]>([]);
  const { lenis } = useSmoothScroll();

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  /** The film has ended (or could not play): titles, then release. */
  const titles = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    go("line");
    later(() => go("mark"), LINE_MS);
    later(() => go("done"), LINE_MS + MARK_MS);
  }, [go]);

  const start = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    go("playing");
    const v = video.current;
    later(titles, SAFETY_MS);
    if (!v) return titles();
    v.currentTime = 0;
    v.play().catch(titles);
  }, [go, titles]);

  // Hold the page at the top until the opening has played.
  useEffect(() => {
    // Arriving mid-page (back button, reload) or with reduced motion: no hold.
    if (window.scrollY > 40 || prefersReducedMotion()) {
      go("done");
      return;
    }
    const html = document.documentElement;
    html.dataset.intro = "";
    let touchY = 0;

    const held = () => phaseRef.current !== "done";
    const onWheel = (e: WheelEvent) => {
      if (!held()) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 0) start();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      if (!held()) return;
      e.preventDefault();
      if (touchY - (e.touches[0]?.clientY ?? touchY) > 8) start();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!held() || !SCROLL_KEYS.has(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (FORWARD_KEYS.has(e.key)) start();
    };
    // Backstop for the scrollbar and anything else that moves the page.
    const onScroll = () => held() && window.scrollY > 0 && window.scrollTo(0, 0);

    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("keydown", onKey, opts);
    window.addEventListener("scroll", onScroll, { passive: true });
    const pending = timers.current;
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, opts);
      window.removeEventListener("scroll", onScroll);
      pending.forEach(clearTimeout);
      delete html.dataset.intro;
    };
  }, [go, start]);

  // Release: smooth scrolling resumes. The navigation stays away while the name
  // fills the screen, and returns once the page has scrolled on.
  useEffect(() => {
    if (lenis) {
      if (phase === "done") lenis.start();
      else lenis.stop();
    }
    if (phase !== "done") return;
    const html = document.documentElement;
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.35) delete html.dataset.intro;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [phase, lenis]);

  // Once released, the film drifts down and the titles lift away as the page scrolls on.
  useGsap(() => {
    const el = root.current!;
    const st = { trigger: el, start: "top top", end: "60% top", scrub: true };
    gsap.to(`.${styles.media}`, { yPercent: 16, ease: "none", scrollTrigger: st });
    gsap.to(`.${styles.titles}`, { yPercent: -24, opacity: 0, ease: "none", scrollTrigger: st });
  }, root);

  const { scrollTo } = useSmoothScroll();
  const onCue = () => (phase === "done" ? scrollTo("#koleksiyon") : start());

  return (
    <section ref={root} id="top" className={styles.intro} data-nav-theme="dark" aria-label="Açılış">
      <div className={styles.stage} data-phase={phase}>
        <div className={styles.media}>
          <video
            ref={video}
            className={styles.video}
            poster={film.poster}
            muted
            playsInline
            preload="auto"
            onEnded={titles}
            aria-hidden
          >
            <source src={film.mobile} type="video/mp4" media="(max-width: 767px)" />
            <source src={film.mp4} type="video/mp4" />
            <source src={film.webm} type="video/webm" />
          </video>
        </div>
        <div className={styles.grade} aria-hidden />

        <div className={styles.titles}>
          <p className={styles.line} aria-hidden>
            İstediğiniz <em>her saat</em>
          </p>
          <h1 className={styles.mark}>
            Furkan <span>Saat</span>
            <span className="visually-hidden"> — İstanbul&apos;da seçkin saatlerin özel evi</span>
          </h1>
          <span className={styles.rule} aria-hidden />
        </div>

        <button type="button" className={styles.cue} onClick={onCue}>
          Aşağı kaydırın
          <span className={styles.cueLine} aria-hidden />
        </button>
      </div>

      {/* Where the black of the film mixes into the house green of the site. */}
      <div className={styles.blend} aria-hidden>
        <span className={styles.mist} />
        <span className={styles.mist} />
        <span className={styles.mist} />
      </div>
    </section>
  );
}
