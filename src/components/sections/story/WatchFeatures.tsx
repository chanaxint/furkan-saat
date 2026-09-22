"use client";

import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./WatchFeatures.module.css";

type Feature = {
  title: string;
  text: string;
  /** Anchor around the watch (desktop). */
  pos: "tl" | "tr" | "ml" | "mr" | "bc";
};

const FEATURES: Feature[] = [
  { title: "Swiss Craftsmanship", text: "Finished by hand in the Jura, where the craft has been inherited for three centuries.", pos: "tl" },
  { title: "Precision Engineering", text: "Tolerances measured in microns; regulated in six positions before it leaves the bench.", pos: "tr" },
  { title: "Sapphire Crystal", text: "Grown, cut and domed — second only to diamond, clear on both faces.", pos: "ml" },
  { title: "Automatic Movement", text: "Wound by the wearer’s own motion. A rotor turns, a mainspring stores the day.", pos: "mr" },
  { title: "Water Resistance", text: "Screw-down crown and sealed caseback, tested to 100 metres.", pos: "bc" },
];

/**
 * 03 — WATCH FEATURES
 * Editorial annotations orbiting the watch rather than a spec list. Each one
 * draws its hairline leader toward the object before its text settles.
 */
export function WatchFeatures() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    const notes = q("[data-note]");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 1 },
      defaults: { ease: "none" },
    });

    tl.fromTo(q("[data-heading]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.02);
    notes.forEach((note, i) => {
      const at = 0.08 + i * 0.13;
      const leader = note.querySelector("[data-leader]");
      const body = note.querySelectorAll("[data-body] > *");
      tl.fromTo(leader, { scaleX: 0 }, { scaleX: 1, duration: 0.08 }, at)
        .fromTo(body, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.08 }, at + 0.03);
      // Mobile shows one note at a time.
      if (window.matchMedia("(max-width: 767px)").matches && i < notes.length - 1) {
        tl.to(note, { autoAlpha: 0, duration: 0.05 }, at + 0.12);
      }
    });
    tl.to(q("[data-heading], [data-note]"), { autoAlpha: 0, duration: 0.08 }, 0.92);
  }, root);

  return (
    <section ref={root} className={styles.features} id="features" aria-label="Craft">
      <div className={styles.pin}>
        <header className={styles.header} data-heading>
          <p className="t-eyebrow">03 — The Craft</p>
          <h2 className={`t-display ${styles.heading}`}>
            Five quiet <em>virtues</em>
          </h2>
        </header>

        {FEATURES.map((f, i) => (
          <article key={f.title} className={`${styles.note} ${styles[f.pos]}`} data-note>
            <span className={styles.leader} data-leader aria-hidden>
              <span className={styles.node} />
            </span>
            <div className={styles.body} data-body>
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.text}>{f.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
