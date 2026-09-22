"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { SHOW_ASSET_HINTS } from "@/lib/assets";
import { ScrollTrigger } from "@/lib/gsap";
import { activePartIndex, EXPLODED_PARTS } from "@/lib/scene/exploded";
import { progress } from "@/lib/scene/progress";
import styles from "./ExplodedView.module.css";

const WatchExplodedView = dynamic(() => import("@/components/three/WatchExplodedView"), { ssr: false });

/**
 * 04 — EXPLODED VIEW
 * A horology technical presentation: the parts separate one by one along the
 * watch's axis while the index on the left follows the part in motion.
 */
export function ExplodedView() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const isMobile = useIsMobile();

  useGsap(() => {
    ScrollTrigger.create({
      trigger: root.current,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.exploded.target = self.progress;
        root.current?.style.setProperty("--p", self.progress.toFixed(4));
        setActive(activePartIndex(self.progress));
      },
      onToggle: (self) => (progress.exploded.active = self.isActive),
    });
  }, root);

  const part = EXPLODED_PARTS[active];

  return (
    <section ref={root} className={styles.section} id="anatomy" data-nav-theme="dark" aria-label="Anatomy of a timepiece">
      <div className={styles.pin}>
        <div className={styles.canvasWrap}>
          <WatchExplodedView className={styles.canvas} labels={!isMobile} />
          <div className={styles.axis} aria-hidden />
        </div>

        <div className={styles.copy}>
          <SectionMarker index="04" label="Anatomy" className={styles.marker} />
          <SplitText text={"The anatomy\nof a *calibre*"} className={`t-display ${styles.heading}`} />
          <p className={styles.intro}>
            Eight components, several hundred parts, one assembly. Scroll to separate the watch along its own axis —
            as a watchmaker would lay it out on the bench.
          </p>

          <ol className={styles.parts}>
            {EXPLODED_PARTS.map((p, i) => (
              <li key={p.id} className={styles.part} data-active={i === active || undefined} data-past={i < active || undefined}>
                <span className={styles.partIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.partName}>{p.label}</span>
              </li>
            ))}
          </ol>

          <div className={styles.caption} aria-live="polite">
            <span className={styles.counter}>
              {String(active + 1).padStart(2, "0")} / {String(EXPLODED_PARTS.length).padStart(2, "0")}
            </span>
            <p key={part.id} className={styles.captionText}>
              <strong>{part.label}.</strong> {part.caption}
            </p>
          </div>
        </div>

        <div className={styles.progress} aria-hidden>
          <span />
        </div>
        {SHOW_ASSET_HINTS && <p className={styles.hint}>Scene 04 · Exploded GLB · named nodes pending</p>}
      </div>
    </section>
  );
}
