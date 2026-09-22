"use client";

import Link from "next/link";
import { useRef } from "react";
import { MediaSlot } from "@/components/media/MediaSlot";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { STORIES } from "@/lib/data/stories";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Editorial.module.css";

const LAYOUT = [
  { cls: styles.feature, ratio: "21 / 10" },
  { cls: styles.left, ratio: "4 / 5" },
  { cls: styles.right, ratio: "3 / 4" },
];

/**
 * 09 — EDITORIAL · The World of Horology
 * Three long-form stories. Images drift inside their frames on scroll,
 * titles rise line by line.
 */
export function Editorial() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    gsap.utils.toArray<HTMLElement>("[data-story]", root.current).forEach((story) => {
      const inner = story.querySelector("[data-media-inner]");
      if (inner)
        gsap.fromTo(
          inner,
          { yPercent: -6 },
          { yPercent: 6, ease: "none", scrollTrigger: { trigger: story, start: "top bottom", end: "bottom top", scrub: true } },
        );
      gsap.from(story.querySelectorAll("[data-fade]"), {
        autoAlpha: 0,
        y: 18,
        duration: 1.4,
        stagger: 0.1,
        ease: "expo.out",
        scrollTrigger: { trigger: story, start: "top 75%", once: true },
      });
    });
  }, root);

  return (
    <section ref={root} className={styles.section} id="journal" data-nav-theme="light" aria-label="The world of horology">
      <header className={styles.header}>
        <SectionMarker index="09" label="Journal" />
        <SplitText text={"The World\nof *Horology*"} className={`t-display ${styles.heading}`} />
      </header>

      <div className={styles.grid}>
        {STORIES.map((s, i) => (
          <article key={s.id} className={`${styles.story} ${LAYOUT[i].cls}`} data-story>
            <Link href={s.href} prefetch={false} className={styles.link}>
              <MediaSlot
                tone={s.tone}
                ratio={LAYOUT[i].ratio}
                image={s.media.image}
                video={s.media.video ? { mp4: s.media.video } : null}
                alt=""
                hint={i === 0 ? "Story film · 21:10" : "Story image"}
                motif={i === 1 ? "horizon" : "none"}
                interactive
                className={styles.media}
              />
              <div className={styles.text}>
                <p className={styles.meta} data-fade>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.category}</span>
                  <span>{s.readTime}</span>
                </p>
                <SplitText as="h3" text={s.title} className={`t-display ${styles.title}`} start="top 90%" />
                <p className={styles.excerpt} data-fade>
                  {s.excerpt}
                </p>
                <span className={styles.read} data-fade>
                  Read the story <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          </article>
        ))}
      </div>

      <div className={styles.footer}>
        <ArrowLink href="/journal">All stories</ArrowLink>
      </div>
    </section>
  );
}
