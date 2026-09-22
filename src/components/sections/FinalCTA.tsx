"use client";

import { useRef } from "react";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./FinalCTA.module.css";

/**
 * 11 — FINAL CTA
 * Deep green gives way to warm ivory as the words settle: the page ends in light.
 */
export function FinalCTA() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    const q = gsap.utils.selector(root);
    if (prefersReducedMotion()) {
      gsap.set(root.current, { "--mix": 1 });
      return;
    }
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        // Hand the nav its ink once the ground has turned to ivory.
        onUpdate: (self) => {
          if (root.current) root.current.dataset.navTheme = self.progress > 0.38 ? "light" : "dark";
        },
      },
      defaults: { ease: "none" },
    });
    tl.fromTo(root.current, { "--mix": 0 }, { "--mix": 1, duration: 0.55 }, 0.1)
      .fromTo(q("[data-word]"), { yPercent: 105 }, { yPercent: 0, stagger: 0.08, duration: 0.3 }, 0)
      .fromTo(q("[data-cta]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.55);
  }, root);

  return (
    <section ref={root} className={styles.section} data-nav-theme="dark" aria-label="Find your time">
      <div className={styles.pin}>
        <h2 className={`t-display ${styles.heading}`} aria-label="Find your time.">
          {["Find", "your", "time."].map((w, i) => (
            <span key={w} className={styles.mask} aria-hidden>
              <span data-word className={i === 2 ? styles.accent : undefined}>
                {w}
              </span>
            </span>
          ))}
        </h2>
        <div className={styles.cta} data-cta>
          <ArrowLink href="#collection" variant="frame">
            Explore collection
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
