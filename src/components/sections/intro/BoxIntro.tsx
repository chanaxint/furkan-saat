"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";
import { buildIntroTimeline, createIntroState } from "@/lib/scene/intro";
import { progress } from "@/lib/scene/progress";
import styles from "./BoxIntro.module.css";

const BoxIntroScene = dynamic(() => import("@/components/three/intro/BoxIntroScene"), { ssr: false });

const CAPTIONS = ["The box opens", "Lifted into the light", "Turned by hand"];

/**
 * INTRO — the watch in its box.
 * A single GSAP timeline, scrubbed by this section's scroll (`scrub: 1`),
 * animates the shared state; the WebGL scene only reads it. The last frame
 * hands over to the Showcase section, which continues the motion.
 */
export function BoxIntro() {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLElement | null)[]>([]);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // One state object for the whole sequence, shared with the canvas.
  const state = useMemo(createIntroState, []);

  useGsap(() => {
    const tl = buildIntroTimeline(state, {
      title: title.current,
      cue: cue.current,
      captions: captions.current.filter(Boolean) as Element[],
    });
    tl.eventCallback("onUpdate", () => progress.intro.wake?.());

    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      animation: tl,
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="top" data-nav-theme="dark" aria-label="Opening">
      <div className={styles.pin}>
        <div className={styles.backdrop} aria-hidden />
        <BoxIntroScene state={state} className={styles.canvas} onReady={onReady} />
        <div className={styles.vignette} aria-hidden />

        <div className={styles.loader} data-ready={ready || undefined} aria-hidden>
          <span className={styles.loaderLine} />
          <span>Preparing</span>
        </div>

        <div ref={title} className={styles.title}>
          <p className="t-eyebrow">A private house of fine watches — İstanbul</p>
          <h1 className={`t-display ${styles.headline}`}>
            Time, <em>held</em> close.
          </h1>
        </div>

        <div className={styles.captions} aria-hidden>
          {CAPTIONS.map((c, i) => (
            <p key={c} ref={(el) => void (captions.current[i] = el)} className={styles.caption}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {c}
            </p>
          ))}
        </div>

        <div ref={cue} className={styles.cue} aria-hidden>
          <span>Scroll</span>
          <span className={styles.cueLine} />
        </div>
      </div>
    </section>
  );
}
