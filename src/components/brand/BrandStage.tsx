"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { useGsap } from "@/hooks/useGsap";
import type { Brand, BrandStageDef } from "@/lib/data/types";
import { ScrollTrigger } from "@/lib/gsap";
import { buildStageTimeline, createStageState, STAGE_TIMES } from "@/lib/scene/stage";
import styles from "./BrandStage.module.css";

const ShowcaseWatchScene = dynamic(() => import("@/components/three/ShowcaseWatchScene"), { ssr: false });

/** Scroll length per timeline second. */
const SVH_PER_SECOND = 55;

/**
 * BRAND STAGE — the opening of a brand page on its watch in 3D (lib/scene/stage.ts).
 * The 3D layer is fixed behind the whole region (opening + collection, passed
 * as children), so once the turns are done the watch stays there, swaying,
 * while the collection scrolls over it. It renders only while that region is
 * on screen.
 */
export function BrandStage({
  brand,
  stage,
  next,
  children,
}: {
  brand: Brand;
  stage: BrandStageDef;
  /** Where the button scrolls to (the collection). */
  next: string;
  children: React.ReactNode;
}) {
  const region = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const title = useRef<HTMLDivElement>(null);
  const wake = useRef<() => void>(() => {});
  const state = useMemo(() => createStageState(stage.poses), [stage.poses]);
  const [active, setActive] = useState(true);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const el = region.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useGsap(() => {
    const tl = buildStageTimeline(state, stage.poses, title.current);
    tl.eventCallback("onUpdate", () => wake.current());
    ScrollTrigger.create({ trigger: hero.current, start: "top top", end: "bottom bottom", scrub: 1, animation: tl });
  }, region);

  const onWake = useCallback((fn: () => void) => {
    wake.current = fn;
    fn();
  }, []);

  return (
    <div ref={region} className={styles.region}>
      <div className={styles.scene} aria-hidden>
        <div className={styles.light} />
        <ShowcaseWatchScene
          state={state}
          model={stage.model}
          pivot={stage.pivot}
          active={active}
          onWake={onWake}
          tone="steel"
          portrait={{ lift: 0.1, pull: 2.2, keepX: true }}
        />
      </div>

      <section
        ref={hero}
        className={styles.hero}
        style={{ height: `${Math.round(STAGE_TIMES.end * SVH_PER_SECOND)}svh` }}
        data-nav-theme="light"
        aria-label={brand.name}
      >
        <div className={styles.pin}>
          <div ref={title} className={styles.title}>
            <p className={styles.eyebrow}>{stage.eyebrow}</p>
            <h1 className={styles.logo}>
              <Image src={brand.logo} alt={brand.name} fill priority sizes="(max-width: 767px) 70vw, 560px" />
            </h1>
            <button type="button" className={styles.button} onClick={() => scrollTo(next)}>
              Koleksiyonu keşfedin
            </button>
          </div>
        </div>
      </section>

      <div className={styles.over}>{children}</div>
    </div>
  );
}
