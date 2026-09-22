"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { progress } from "@/lib/scene/progress";
import { SHOWCASE_BEATS, SHOWCASE_MESSAGES, showcaseActive, type ShowcaseMessage } from "@/lib/scene/showcase";
import styles from "./WatchShowcase.module.css";

const WatchShowcaseScene = dynamic(() => import("@/components/three/showcase/WatchShowcaseScene"), { ssr: false });

export const SHOWCASE_PIECE = {
  brand: "Rolex",
  model: "Submariner Date",
  reference: "116610LV",
};

/** Kinetic line: full-width crossing inside its window, soft fade at the edges. */
function placeMessage(el: HTMLElement, m: ShowcaseMessage, a: number, vw: number) {
  const [start, end] = m.range;
  const t = (a - start) / (end - start);
  if (t <= 0 || t >= 1) {
    if (el.style.visibility !== "hidden") el.style.visibility = "hidden";
    return;
  }
  const w = el.offsetWidth;
  // right → left: from just off the right edge to just off the left edge.
  const from = m.from === "right" ? vw : -w;
  const to = m.from === "right" ? -w : vw;
  // Half speed mid-screen so each line reads, full speed at the edges; never static.
  const eased = t + (0.5 / (2 * Math.PI)) * Math.sin(2 * Math.PI * t);
  const x = from + (to - from) * eased;
  const fade = Math.min(1, t / 0.12, (1 - t) / 0.12);
  el.style.visibility = "visible";
  el.style.opacity = fade.toFixed(3);
  el.style.transform = `translate3d(${x.toFixed(1)}px, -50%, 0)`;
}

/**
 * WATCH SHOWCASE
 * The watch rises into frame, shows its face off, recedes through a full
 * turn (caseback, bracelet, dial), tips its dial up at a side angle and
 * settles into the front hero pose — all driven by the reader's scroll.
 *
 * This section only publishes scroll progress; every bit of motion lives in
 * lib/scene/showcase.ts and ShowcaseRig. Kinetic type is updated from the
 * render loop (progress.showcase.onFrame) so it moves in lock-step with the
 * watch, with the same inertia.
 */
export function WatchShowcase() {
  const root = useRef<HTMLElement>(null);
  const lines = useRef<(HTMLElement | null)[]>([]);
  const beats = useRef<(HTMLElement | null)[]>([]);
  const track = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // Frame-synced DOM updates (text lines, beat rail, progress line).
  useEffect(() => {
    let lastBeat = -1;
    const reduced = prefersReducedMotion();
    progress.showcase.onFrame = (p) => {
      const a = showcaseActive(p);
      const vw = window.innerWidth;
      SHOWCASE_MESSAGES.forEach((m, i) => {
        const el = lines.current[i];
        if (!el) return;
        if (reduced) {
          el.style.visibility = a >= m.range[0] && a <= m.range[1] ? "visible" : "hidden";
          return;
        }
        placeMessage(el, m, a, vw);
      });
      let beat = 0;
      SHOWCASE_BEATS.forEach((b, i) => {
        if (a >= b.at - 0.001) beat = i;
      });
      if (beat !== lastBeat) {
        beats.current.forEach((el, i) => el?.toggleAttribute("data-active", i === beat));
        lastBeat = beat;
      }
      if (track.current) track.current.style.transform = `scaleX(${a.toFixed(4)})`;
    };
    return () => {
      progress.showcase.onFrame = undefined;
    };
  }, []);

  useGsap(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.showcase.target = self.progress;
        progress.showcase.wake?.();
      },
      onRefresh: (self) => {
        progress.showcase.target = self.progress;
        progress.showcase.wake?.();
      },
    });
    // Active slightly before the pin, so the spring (not a snap) handles
    // the first frames on screen.
    ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        progress.showcase.active = self.isActive;
        progress.showcase.wake?.();
      },
    });

    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    gsap.from(q("[data-fade]"), {
      autoAlpha: 0,
      y: 16,
      duration: 1.6,
      stagger: 0.1,
      ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 40%", once: true },
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="showcase" data-nav-theme="dark" aria-label="Timepiece showcase">
      <div className={styles.pin}>
        <div className={styles.backdrop} aria-hidden />

        {/* Kinetic type — sits behind the watch, sweeps from both sides */}
        <div className={styles.lines} aria-hidden>
          {SHOWCASE_MESSAGES.map((m, i) => {
            const [before, after] = m.accent ? m.text.split(m.accent) : [m.text, ""];
            return (
              <p
                key={m.text}
                ref={(el) => void (lines.current[i] = el)}
                className={styles.line}
                data-pos={m.top < 50 ? "top" : "bottom"}
                style={{ top: `${m.top}%` }}
              >
                {before}
                {m.accent && <em>{m.accent}</em>}
                {after}
              </p>
            );
          })}
        </div>

        <WatchShowcaseScene className={styles.canvas} onReady={onReady} />
        <div className={styles.vignette} aria-hidden />

        <div className={styles.loader} data-ready={ready || undefined} aria-hidden>
          <span className={styles.loaderLine} />
          <span>Preparing the timepiece</span>
        </div>

        <header className={styles.header}>
          <p className="t-eyebrow" data-fade>
            The Showcase
          </p>
        </header>

        <div className={styles.piece} data-fade>
          <p className={styles.brand}>{SHOWCASE_PIECE.brand}</p>
          <h2 className={`t-display ${styles.model}`}>{SHOWCASE_PIECE.model}</h2>
          <p className={styles.ref}>Ref. {SHOWCASE_PIECE.reference}</p>
        </div>

        <div className={styles.rail} data-fade>
          <ol className={styles.beats}>
            {SHOWCASE_BEATS.map((b, i) => (
              <li key={b.label} ref={(el) => void (beats.current[i] = el)} data-active={i === 0 || undefined}>
                {b.label}
              </li>
            ))}
          </ol>
          <span className={styles.track} aria-hidden>
            <span ref={track} />
          </span>
        </div>

        {/* Accessible copy of the kinetic lines */}
        <ul className="visually-hidden">
          {SHOWCASE_MESSAGES.map((m) => (
            <li key={m.text}>{m.text}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
