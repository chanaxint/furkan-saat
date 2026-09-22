"use client";

import { useRef } from "react";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { HOUSES } from "@/lib/data/houses";
import { SHOW_ASSET_HINTS } from "@/lib/assets";
import styles from "./CinematicOpening.module.css";

const SUBTITLES = [
  "Every great watch begins in shadow.",
  "Until the wrist turns toward the light.",
  "And the dial is finally seen.",
];

/**
 * 01 — CINEMATIC OPENING
 * Overlay for the first chapter. The 3D stage behind handles the hand turn,
 * approach and hand exit; this layer carries the title card and cinematic
 * subtitles, all scrubbed to scroll.
 */
export function CinematicOpening() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);

    // Intro on load: title card fades up from black.
    gsap.from(q("[data-fade]"), { autoAlpha: 0, y: 16, duration: 2.2, ease: "expo.out", delay: 0.9, stagger: 0.15 });
    gsap.from(q("[data-curtain]"), { autoAlpha: 1, duration: 2.6, ease: "power2.inOut", delay: 0.1 });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 },
      defaults: { ease: "none" },
    });

    // Title card dissolves as the camera begins to move.
    tl.to(q("[data-title]"), { autoAlpha: 0, y: -40, filter: "blur(6px)", duration: 0.22 }, 0.02)
      .to(q("[data-cue], [data-hint]"), { autoAlpha: 0, duration: 0.08 }, 0);

    // Subtitles, one after another.
    q("[data-subtitle]").forEach((el, i) => {
      const at = 0.2 + i * 0.25;
      tl.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, at).to(
        el,
        { autoAlpha: 0, y: -8, duration: 0.08 },
        at + 0.16,
      );
    });
  }, root);

  return (
    <section ref={root} className={styles.opening} id="opening" aria-label="Opening">
      <div className={styles.curtain} data-curtain aria-hidden />
      <div className={styles.pin}>
        <div className={styles.title} data-title>
          <p className={`t-eyebrow ${styles.eyebrow}`} data-fade>
            A private house of fine watches — İstanbul
          </p>
          <SplitText as="h1" text={"Time, *held*\nclose."} className={`t-display t-xl ${styles.headline}`} trigger="mount" delay={1.1} stagger={0.1} />
          <ul className={styles.houses} data-fade aria-label="Houses represented">
            {HOUSES.map((h) => (
              <li key={h.id}>{h.name}</li>
            ))}
          </ul>
        </div>

        <div className={styles.subtitles} aria-live="off">
          {SUBTITLES.map((s, i) => (
            <p key={s} className={styles.subtitle} data-subtitle>
              <span className={styles.subIndex}>{String(i + 1).padStart(2, "0")}</span>
              {s}
            </p>
          ))}
        </div>

        <div className={styles.cue} data-cue data-fade>
          <span>Scroll</span>
          <span className={styles.cueLine} />
        </div>

        {SHOW_ASSET_HINTS && (
          <p className={styles.assetHint} data-hint aria-hidden>
            Scene 01 · Hand &amp; timepiece · GLB pending
          </p>
        )}
      </div>
    </section>
  );
}
