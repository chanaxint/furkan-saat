"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useGsap } from "@/hooks/useGsap";
import { ScrollTrigger } from "@/lib/gsap";
import { progress } from "@/lib/scene/progress";
import { CinematicOpening } from "./CinematicOpening";
import { StoryIndex } from "./StoryIndex";
import { WatchFeatures } from "./WatchFeatures";
import { WatchReveal } from "./WatchReveal";
import styles from "./WatchStory.module.css";

const WatchScene = dynamic(() => import("@/components/three/WatchScene"), { ssr: false });

/**
 * 01 CINEMATIC OPENING → 02 WATCH REVEAL → 03 WATCH FEATURES
 * One sticky WebGL stage, three chapters of editorial overlay scrolling over
 * it. Native scroll drives a single progress channel (lib/scene/progress);
 * the 3D scene and the overlays read the same timeline.
 */
export function WatchStory() {
  const root = useRef<HTMLDivElement>(null);

  useGsap(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.story.target = self.progress;
        progress.story.velocity = self.getVelocity();
        root.current?.style.setProperty("--story", self.progress.toFixed(4));
      },
      onToggle: (self) => (progress.story.active = self.isActive),
    });
  }, root);

  return (
    <div ref={root} className={styles.story} id="top" data-nav-theme="dark">
      <div className={styles.stage}>
        <div className={styles.backdrop} aria-hidden />
        <div className={styles.watermark} aria-hidden>
          <span>Furkan</span>
          <span>Saat</span>
        </div>
        <WatchScene className={styles.canvas} />
        <div className={styles.vignette} aria-hidden />
        <StoryIndex />
      </div>

      <div className={styles.chapters}>
        <CinematicOpening />
        <WatchReveal />
        <WatchFeatures />
      </div>
    </div>
  );
}
