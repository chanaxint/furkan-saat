"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { introSound } from "@/lib/sound/introSound";
import styles from "./HeroIntro.module.css";

/**
 * idle       first frame, "Aşağı kaydırın" — the page is held at the top
 * playing    the film plays once, start to end
 * line       the film cuts to black and "İstediğiniz her saat" is there at once
 * mark       the line gives way to "Furkan Saat"
 * done       the page is released; scrolling continues into the black → green blend
 * rewinding  scrolling back up at the top: the titles go and the film runs
 *            backwards to its first frame, then it is idle again
 *
 * Sound (lib/sound/introSound): ticks that accelerate with the film, a deep
 * hit on the cut, a chime with the name, slowing ticks on the rewind.
 */
type Phase = "idle" | "playing" | "line" | "mark" | "done" | "rewinding";

/** How long each title holds (ms). */
const LINE_MS = 2600;
const MARK_MS = 1200;
/** Rewind speed (the reversed film is played faster than real time). */
const REWIND_RATE = 2;
/** If a film stalls (slow network), the sequence moves on anyway. */
const SAFETY_MS = 14000;
/** A scroll-up only rewinds once the page has rested at the top this long, or on a fresh gesture. */
const TOP_REST_MS = 900;
const GESTURE_GAP_MS = 250;

const SCROLL_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Spacebar"]);
const FORWARD_KEYS = new Set(["ArrowDown", "PageDown", "End", " ", "Spacebar"]);
const BACK_KEYS = new Set(["ArrowUp", "PageUp", "Home"]);

const { film } = ASSETS.intro;

/**
 * HERO INTRO — the opening of the home page. The visitor's first scroll plays
 * the film; when it ends, the titles cut in over black, and the page then
 * flows through a band where the black mixes into the house green. Scrolling
 * back up at the top rewinds it all.
 */
export function HeroIntro() {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reverse = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const timers = useRef<number[]>([]);
  const { lenis, scrollTo } = useSmoothScroll();
  const sound = useSyncExternalStore(
    (fn) => introSound.subscribe(fn),
    () => introSound.snapshot,
    () => "10",
  );
  const soundOn = sound === "11";

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
    if (phaseRef.current !== "idle") return;
    go("playing");
    introSound.stop();
    const v = video.current;
    later(titles, SAFETY_MS);
    if (!v) return titles();
    v.currentTime = 0;
    v.play().catch(titles);
  }, [go, later, titles]);

  /** Back to the first frame: the reversed film's last frame is the film's first. */
  const rewound = useCallback(() => {
    if (phaseRef.current !== "rewinding") return;
    clearTimers();
    reverse.current?.pause();
    go("idle");
  }, [go, clearTimers]);

  const rewind = useCallback(() => {
    const p = phaseRef.current;
    if (p !== "line" && p !== "mark" && p !== "done") return;
    clearTimers();
    go("rewinding");
    const v = video.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
    const r = reverse.current;
    introSound.rewind((Number.isFinite(r?.duration) ? r!.duration : 5) / REWIND_RATE);
    later(rewound, SAFETY_MS);
    if (!r) return rewound();
    r.currentTime = 0;
    r.playbackRate = REWIND_RATE;
    r.play().catch(rewound);
  }, [go, later, clearTimers, rewound]);

  // Hold the page at the top while the opening plays; at the top, scrolling back rewinds it.
  useEffect(() => {
    // Arriving mid-page (back button, reload) or with reduced motion: no hold.
    if (window.scrollY > 40 || prefersReducedMotion()) {
      go("done");
      delete document.documentElement.dataset.intro;
      return;
    }
    let touchY = 0;
    let lastWheel = 0;
    let topSince = performance.now();

    const held = () => phaseRef.current !== "done";
    const atTop = () => window.scrollY <= 1;
    /** In the released page, only a deliberate scroll-up at the top rewinds. */
    const mayRewind = (fresh: boolean) =>
      phaseRef.current !== "done" || (atTop() && (fresh || performance.now() - topSince > TOP_REST_MS));

    const onWheel = (e: WheelEvent) => {
      const fresh = e.timeStamp - lastWheel > GESTURE_GAP_MS;
      lastWheel = e.timeStamp;
      if (e.deltaY < 0 && atTop() && mayRewind(fresh)) {
        e.preventDefault();
        e.stopPropagation();
        return rewind();
      }
      if (!held()) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.deltaY > 0) start();
    };
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (dy < -8 && atTop() && mayRewind(true)) {
        if (e.cancelable) e.preventDefault();
        return rewind();
      }
      if (!held()) return;
      if (e.cancelable) e.preventDefault();
      if (dy > 8) start();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(e.key)) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (BACK_KEYS.has(e.key) && atTop() && mayRewind(true)) {
        e.preventDefault();
        return rewind();
      }
      if (!held()) return;
      e.preventDefault();
      if (FORWARD_KEYS.has(e.key)) start();
    };
    const onScroll = () => {
      if (!atTop()) topSince = Infinity;
      else if (topSince === Infinity) topSince = performance.now();
      // Backstop for the scrollbar and anything else that moves a held page.
      if (held() && window.scrollY > 0) window.scrollTo(0, 0);
    };

    // Sound may only start after a click, tap or key press; the ticks then join the film where it is.
    const onActivate = () => void introSound.unlock().then((ok) => ok && rise());

    const opts = { capture: true, passive: false } as const;
    const activation = ["pointerdown", "keydown", "touchend"] as const;
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
    };
  }, [go, start, rewind, clearTimers, rise]);

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

  // Off → on also asks the browser for permission (this click allows it).
  const onSound = async () => {
    if (soundOn) {
      introSound.stop(0.2);
      introSound.setOn(false);
      return;
    }
    introSound.setOn(true);
    if (await introSound.unlock()) rise();
  };

  return (
    <section ref={root} id="top" className={styles.intro} data-nav-theme="dark" aria-label="Açılış">
      <div className={styles.stage} data-phase={phase}>
        <video
          ref={video}
          className={styles.video}
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
        <video
          ref={reverse}
          className={styles.reverse}
          muted
          playsInline
          preload="auto"
          onEnded={rewound}
          aria-hidden
        >
          <source src={film.reverse.mobile} type="video/mp4" media="(max-width: 767px)" />
          <source src={film.reverse.mp4} type="video/mp4" />
          <source src={film.reverse.webm} type="video/webm" />
        </video>
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

        <button
          type="button"
          className={styles.sound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Sesi kapat" : "Sesi aç"}
          onClick={onSound}
        >
          <span className={styles.bars} aria-hidden>
            <span />
            <span />
            <span />
            <span />
          </span>
          {soundOn ? "Ses açık" : "Ses kapalı"}
        </button>
      </div>

      {/* Where the black of the film mixes into the house green of the site. */}
      <div className={styles.blend} aria-hidden>
        <span className={styles.mist} />
        <span className={styles.mist} />
        <span className={styles.mist} />
        <span className={styles.mist} />
      </div>
    </section>
  );
}
