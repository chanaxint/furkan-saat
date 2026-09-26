"use client";

import { useRef } from "react";
import { MediaSlot } from "@/components/media/MediaSlot";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { SplitText } from "@/components/ui/SplitText";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { BOUTIQUE } from "@/lib/data/navigation";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Boutique.module.css";

/**
 * 10 — BOUTIQUE
 * Full-bleed boutique film (ASSETS.boutique.film). The frame opens from an
 * inset window to full width, then settles — calm, wide, unhurried.
 */
export function Boutique() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    gsap.fromTo(
      q("[data-frame]"),
      { clipPath: "inset(12% 10% 12% 10%)" },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: true },
      },
    );
    gsap.fromTo(
      q("[data-media-inner]"),
      { scale: 1.18 },
      { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
    );
    gsap.from(q("[data-fade]"), {
      autoAlpha: 0,
      y: 20,
      duration: 1.6,
      stagger: 0.12,
      ease: "expo.out",
      scrollTrigger: { trigger: root.current, start: "top 30%", once: true },
    });
  }, root);

  const film = ASSETS.boutique.film;

  return (
    <section ref={root} className={styles.section} id="boutique" data-nav-theme="dark" aria-label="Butiği ziyaret edin">
      <div className={styles.frame} data-frame>
        <MediaSlot
          tone="deep"
          video={film.webm || film.mp4 ? film : null}
          hint="Butik filmi · tam genişlik"
          motif="horizon"
          className={styles.media}
        />
        <div className={styles.scrim} aria-hidden />

        <div className={styles.content}>
          <p className={`t-eyebrow ${styles.eyebrow}`} data-fade>
            10 — Butik · {BOUTIQUE.city}
          </p>
          <SplitText text={"Furkan *Saat*\nButiği"} className={`t-display ${styles.heading}`} start="top 70%" />
          <p className={styles.support} data-fade>
            Seçkin saatler için özel bir deneyim.
          </p>
          <div data-fade>
            <ArrowLink href="/appointment" variant="frame" className={styles.cta}>
              Randevu alın
            </ArrowLink>
          </div>
        </div>

        <dl className={styles.facts}>
          <div data-fade>
            <dt>Konum</dt>
            <dd>{BOUTIQUE.city}</dd>
          </div>
          <div data-fade>
            <dt>Saatler</dt>
            <dd>{BOUTIQUE.hours}</dd>
          </div>
          <div data-fade>
            <dt>Danışma</dt>
            <dd>
              <a href={`mailto:${BOUTIQUE.email}`}>{BOUTIQUE.email}</a>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
