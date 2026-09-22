"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { ScrollTrigger } from "@/lib/gsap";
import { activeShot, advanceDetails, DETAIL_SHOTS, DETAILS_FOV, detailsActive, sampleDetailsPose } from "@/lib/scene/details";
import { progress } from "@/lib/scene/progress";
import styles from "./WatchDetails.module.css";

const ModelSequenceScene = dynamic(() => import("@/components/three/showcase/ModelSequenceScene"), { ssr: false });

const SEQUENCE = {
  sample: sampleDetailsPose,
  advance: advanceDetails,
  fov: DETAILS_FOV,
  portraitPull: 0.9,
  frameShift: 0.14,
  portraitLift: 0.17,
};

/**
 * WATCH DETAILS — macro close-ups (in place of the exploded view for now).
 * The watch holds still; the camera moves in on five details and back out.
 * Captions switch from the render loop, so they change exactly when the
 * camera arrives on a detail.
 */
export function WatchDetails() {
  const root = useRef<HTMLElement>(null);
  const captions = useRef<(HTMLElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let last = -2;
    progress.details.onFrame = (p) => {
      const a = detailsActive(p);
      const shot = activeShot(a);
      if (shot !== last) {
        captions.current.forEach((el, i) => el?.toggleAttribute("data-active", i === shot));
        if (counter.current)
          counter.current.textContent = shot >= 0 ? `${DETAIL_SHOTS[shot].index} / 0${DETAIL_SHOTS.length}` : "";
        last = shot;
      }
      if (bar.current) bar.current.style.transform = `scaleX(${a.toFixed(4)})`;
    };
    return () => {
      progress.details.onFrame = undefined;
    };
  }, []);

  useGsap(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.details.target = self.progress;
        progress.details.wake?.();
      },
      onRefresh: (self) => {
        progress.details.target = self.progress;
        progress.details.wake?.();
      },
    });
    ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        progress.details.active = self.isActive;
        progress.details.wake?.();
      },
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="details" data-nav-theme="dark" aria-label="Details of the timepiece">
      <div className={styles.pin}>
        <div className={styles.backdrop} aria-hidden />
        <ModelSequenceScene
          asset={ASSETS.showcase.watch}
          channel={progress.details}
          sequence={SEQUENCE}
          className={styles.canvas}
        />
        <div className={styles.vignette} aria-hidden />

        <SectionMarker index="04" label="In detail" className={styles.marker} />

        <div className={styles.captions}>
          {DETAIL_SHOTS.map((s, i) => (
            <article key={s.id} ref={(el) => void (captions.current[i] = el)} className={styles.caption}>
              <span className={styles.index}>{s.index}</span>
              <h3 className={`t-display ${styles.title}`}>{s.title}</h3>
              <p className={styles.text}>{s.text}</p>
            </article>
          ))}
        </div>

        <div className={styles.progress} aria-hidden>
          <span ref={counter} className={styles.counter} />
          <span className={styles.track}>
            <span ref={bar} />
          </span>
        </div>
      </div>
    </section>
  );
}
