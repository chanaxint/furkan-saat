"use client";

import { Fragment, useRef } from "react";
import { MediaSlot } from "@/components/media/MediaSlot";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { HOUSES } from "@/lib/data/houses";
import type { Tone } from "@/lib/data/types";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Houses.module.css";

/** Each house gets its own world: panel ground, ink and media tone. */
const WORLDS: Record<
  Tone,
  { panel: string; media: Tone; theme: "dark" | "light" }
> = {
  green: { panel: styles.worldGreen, media: "green", theme: "dark" },
  ivory: { panel: styles.worldIvory, media: "stone", theme: "light" },
  deep: { panel: styles.worldDeep, media: "deep", theme: "dark" },
  stone: { panel: styles.worldStone, media: "champagne", theme: "light" },
  champagne: { panel: styles.worldStone, media: "ivory", theme: "light" },
  wine: { panel: styles.worldWine, media: "wine", theme: "light" },
};

/**
 * 08 — THE HOUSES
 * Six stacked, full-screen worlds. Each new house slides over the last on
 * natural scroll (sticky, no hijacking) while the previous one recedes.
 */
export function Houses() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const panels = gsap.utils.toArray<HTMLElement>(
      "[data-house]",
      root.current,
    );

    panels.forEach((panel, i) => {
      const inner = panel.querySelector("[data-inner]");
      const name = panel.querySelectorAll("[data-name] span");
      const media = panel.querySelector("[data-media-inner]");

      // Name rises as the world arrives.
      gsap.fromTo(
        name,
        { yPercent: 60 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "top top",
            scrub: 1,
          },
        },
      );
      if (media)
        gsap.fromTo(
          media,
          { yPercent: -6, scale: 1.08 },
          {
            yPercent: 6,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: panel,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );

      // Previous world recedes under the next one.
      const next = panels[i + 1];
      if (next && inner)
        gsap.to(inner, {
          scale: 0.92,
          autoAlpha: 0.25,
          ease: "none",
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
    });
  }, root);

  return (
    <section
      ref={root}
      className={styles.section}
      id="houses"
      aria-label="Markalar"
    >
      <header className={styles.intro} data-nav-theme="dark">
        <SectionMarker
          index="08"
          label="Markalar"
          className={styles.marker}
        />
        <SplitText
          text={"Altı ev.\nAltı *dünya.*"}
          className={`t-display ${styles.heading}`}
        />
        <p className={styles.lede}>
          Küçük ve seçkin bir manüfaktür çevresinin yetkili iş ortağıyız. Her biri kendi dilini
          korur — biz yalnızca ona alan açarız.
        </p>
      </header>

      <div className={styles.stack}>
        {HOUSES.map((h, i) => {
          const world = WORLDS[h.tone];
          return (
            <Fragment key={h.id}>
              <article
                className={`${styles.panel} ${world.panel}`}
                data-house
                data-nav-theme={world.theme}
                aria-label={h.name}
              >
                <div className={styles.inner} data-inner>
                  <div className={styles.meta}>
                    <span className={styles.count}>
                      {String(i + 1).padStart(2, "0")} /{" "}
                      {String(HOUSES.length).padStart(2, "0")}
                    </span>
                    <span>Kuruluş {h.founded}</span>
                    <span>{h.origin}</span>
                  </div>

                  <MediaSlot
                    tone={world.media}
                    image={h.media.image}
                    video={h.media.video ? { mp4: h.media.video } : null}
                    alt={`${h.name} — marka filmi`}
                    hint="Marka filmi · 16:9"
                    motif="horizon"
                    className={styles.media}
                  />

                  <div className={styles.copy}>
                    <p className={`t-display ${styles.signature}`}>
                      <em>{h.signature}</em>
                    </p>
                    <p className={styles.description}>{h.description}</p>
                    <ArrowLink href={h.href}>Markayı keşfedin</ArrowLink>
                  </div>

                  <h3 className={`t-display ${styles.name}`} data-name>
                    <span>{h.name}</span>
                  </h3>
                </div>
              </article>
              {/* Dwell: the world holds the screen before the next one slides over. */}
              {i < HOUSES.length - 1 && (
                <div className={styles.dwell} aria-hidden />
              )}
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
