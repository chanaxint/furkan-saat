"use client";

import { useRef } from "react";
import { ProductShowcase } from "@/components/media/ProductShowcase";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { useGsap } from "@/hooks/useGsap";
import { ASSETS } from "@/lib/assets";
import { NEW_ARRIVAL } from "@/lib/data/watches";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import styles from "./NewArrival.module.css";

/**
 * 05 — NEW ARRIVAL
 * The assembly from 04 closes and a single new piece takes the stage.
 * Media slot accepts GLB, film or photography (see ASSETS.newArrival).
 */
export function NewArrival() {
  const root = useRef<HTMLElement>(null);

  useGsap(() => {
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(root);
    gsap.fromTo(
      q("[data-stage]"),
      { clipPath: "inset(18% 14% 18% 14%)", scale: 0.94 },
      {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: q("[data-stage]")[0], start: "top 95%", end: "center 55%", scrub: 1 },
      },
    );
    gsap.fromTo(
      q("[data-title] span"),
      { xPercent: (i) => (i === 0 ? -8 : 8) },
      {
        xPercent: (i) => (i === 0 ? 4 : -4),
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }, root);

  return (
    <section ref={root} className={styles.section} id="new-arrival" data-nav-theme="dark" aria-label="Yeni gelen">
      <div className={styles.top}>
        <SectionMarker index="05" label="Yeni geldi" className={styles.marker} />
        <p className={styles.ref}>Ref. {NEW_ARRIVAL.reference}</p>
      </div>

      <h2 className={`t-display ${styles.title}`} data-title aria-label="Yeni Gelen">
        <span>Yeni</span>
        <span>
          <em>Gelen</em>
        </span>
      </h2>

      <div className={styles.grid}>
        <div className={styles.stageWrap} data-stage>
          <ProductShowcase
            model={ASSETS.newArrival.model}
            film={ASSETS.newArrival.film}
            still={ASSETS.newArrival.still}
            tone="deep"
            className={styles.stage}
            hint="Ürün · GLB / film / fotoğraf"
          />
        </div>

        <Reveal className={styles.details} stagger={0.12}>
          <p className={styles.brand}>{NEW_ARRIVAL.brand}</p>
          <h3 className={`t-display ${styles.model}`}>{NEW_ARRIVAL.model}</h3>
          <p className={styles.description}>{NEW_ARRIVAL.description}</p>
          <dl className={styles.specs}>
            {NEW_ARRIVAL.details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <ArrowLink href={NEW_ARRIVAL.href}>Saati keşfedin</ArrowLink>
        </Reveal>
      </div>
    </section>
  );
}
