"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./WatchReveal.module.css";

/**
 * 02 — WATCH REVEAL
 * The hand has left frame; the watch is alone and dominant. Typography sits
 * at the edges so the object keeps the centre. The camera orbit itself lives
 * in lib/scene/story.ts (CHAPTERS.reveal).
 */
export function WatchReveal() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom bottom", scrub: 1 },
      defaults: { ease: "none" },
    });
    tl.fromTo(q("[data-left] > *"), { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.25 }, 0.05)
      .fromTo(q("[data-right] > *"), { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, stagger: 0.05, duration: 0.25 }, 0.18)
      .fromTo(q("[data-meter]"), { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, 0.1)
      .to(q("[data-left], [data-right]"), { autoAlpha: 0, y: -24, duration: 0.18 }, 0.82);
  }, root);

  return (
    <section ref={root} className={styles.reveal} id="reveal" aria-label="The reveal">
      <div className={styles.pin}>
        <div className={styles.left} data-left>
          <p className="t-eyebrow">02 — The Reveal</p>
          <h2 className={`t-display ${styles.heading}`}>
            Nothing
            <br />
            between you
            <br />
            and the <em>dial.</em>
          </h2>
        </div>

        <div className={styles.right} data-right>
          <p className={styles.copy}>
            Every timepiece at Furkan Saat is chosen by hand, examined under the loupe and presented as its maker
            intended — alone, and in good light.
          </p>
          <div className={styles.meta}>
            <span>Orbit</span>
            <span className={styles.meter}>
              <span data-meter />
            </span>
            <span>360°</span>
          </div>
        </div>
      </div>
    </section>
  );
}
