"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";
import type { BrandShowcaseDef } from "@/lib/data/types";
import { buildShowcaseTimeline, createShowcaseState, SHOWCASE_TIMES } from "@/lib/scene/showcase";
import styles from "./BrandShowcase.module.css";

const ShowcaseWatchScene = dynamic(() => import("@/components/three/ShowcaseWatchScene"), { ssr: false });

/** Scroll length per timeline second (the section height is derived from it). */
const SVH_PER_SECOND = 52;

/**
 * BRAND SHOWCASE — after the film opening, the watch comes onto the screen in
 * 3D and turns to show its parts as the page scrolls (lib/scene/showcase.ts).
 * The 3D layer only loads as the section approaches and only renders while
 * it is on screen.
 */
export function BrandShowcase({ showcase, label }: { showcase: BrandShowcaseDef; label: string }) {
  const root = useRef<HTMLElement>(null);
  const lines = useRef<(HTMLElement | null)[]>([]);
  const wake = useRef<() => void>(() => {});
  const state = useMemo(createShowcaseState, []);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);

  // Load the 3D layer a screen ahead; render only while on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const pre = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "120% 0px" });
    const vis = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    pre.observe(el);
    vis.observe(el);
    return () => {
      pre.disconnect();
      vis.disconnect();
    };
  }, []);

  useGsap(() => {
    const el = root.current!;
    const tl = buildShowcaseTimeline(state, showcase.beats, lines.current);
    tl.eventCallback("onUpdate", () => {
      el.style.setProperty("--show", state.show.toFixed(3));
      wake.current();
    });
    // From the moment the section's top enters the screen until its end: the
    // watch arrives while the section is still scrolling into view.
    ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom bottom", scrub: 1, animation: tl });
  }, root);

  const onWake = useCallback((fn: () => void) => {
    wake.current = fn;
    fn();
  }, []);

  const height = `${Math.round(SHOWCASE_TIMES.end * SVH_PER_SECOND)}svh`;

  return (
    <section ref={root} className={styles.section} style={{ height }} data-nav-theme="light" aria-label={label}>
      <div className={styles.stage}>
        <div className={styles.glow} aria-hidden />
        <div className={styles.canvas} aria-hidden>
          {near && (
            <ShowcaseWatchScene
              state={state}
              model={showcase.model}
              pivot={showcase.pivot}
              active={active}
              onWake={onWake}
            />
          )}
        </div>
        <div className={styles.lines}>
          {showcase.beats.map((b, i) => {
            const [before, after] = b.title.split(b.accent);
            return (
              <div key={b.id} ref={(n) => void (lines.current[i] = n)} className={styles.line} data-side={b.side}>
                <p className={styles.index}>{String(i + 1).padStart(2, "0")}</p>
                <h2 className={styles.lineTitle}>
                  {before}
                  <em>{b.accent}</em>
                  {after}
                </h2>
                <p className={styles.lineText}>{b.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
