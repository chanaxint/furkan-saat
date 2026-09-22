"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useGsap } from "@/hooks/useGsap";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/gsap";
import { progress } from "@/lib/scene/progress";
import { SHOWCASE_BEATS, showcaseActive } from "@/lib/scene/showcase";
import styles from "./WatchShowcase.module.css";

const WatchShowcaseScene = dynamic(() => import("@/components/three/showcase/WatchShowcaseScene"), { ssr: false });

export const SHOWCASE_PIECE = {
  brand: "Rolex",
  model: "Submariner Date",
  reference: "116610LV",
};

/**
 * WATCH SHOWCASE
 * The watch, out of its box, held mid-air at the centre of the frame and
 * turned by the reader's own scroll: front → ¾ → profile → ¾ → front.
 *
 * This section only publishes scroll progress (progress.showcase.target);
 * every bit of motion lives in lib/scene/showcase.ts and ShowcaseRig.
 * A future box-opening / box-exit section simply precedes this one and ends
 * in SHOWCASE_ENTRY_POSE.
 */
export function WatchShowcase() {
  const root = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [beat, setBeat] = useState(0);
  const isMobile = useIsMobile();

  const onReady = useCallback(() => setReady(true), []);

  useGsap(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.showcase.target = self.progress;
        root.current?.style.setProperty("--p", self.progress.toFixed(4));
        const a = showcaseActive(self.progress);
        setBeat(Math.round(a * (SHOWCASE_BEATS.length - 1)));
      },
    });
    // Treat the section as active slightly before it pins so the spring
    // (not a snap) handles the very first frames on screen.
    ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (progress.showcase.active = self.isActive),
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
        <WatchShowcaseScene className={styles.canvas} onReady={onReady} depthOfField={!isMobile} />

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
              <li key={i} data-active={i === beat || undefined}>
                {b.label}
              </li>
            ))}
          </ol>
          <span className={styles.track} aria-hidden>
            <span />
          </span>
        </div>
      </div>
    </section>
  );
}
