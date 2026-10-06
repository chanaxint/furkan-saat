"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { SceneMusic } from "@/components/effects/SceneMusic";
import type { Brand } from "@/lib/data/types";
import styles from "./BrandFilmHero.module.css";

/**
 * The opening of a brand page that has a film: it loops silently, full screen,
 * behind the brand's logo. It only plays while some of it is on screen; once
 * scrolled fully out of view (or the tab is hidden) it pauses, and picks up
 * again on the way back.
 *
 * A brand with a `scene` instead opens on a still photograph that stays put
 * while the page rises over it, with its music's small switch (the petals
 * are the page's own).
 */
export function BrandFilmHero({ brand, next }: { brand: Brand; next: string }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const el = root.current;
    const v = video.current;
    if (!el || !v) return;

    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) v.play().catch(() => {});
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const { film, scene } = brand;
  return (
    <section
      ref={root}
      className={styles.hero}
      data-theme={brand.theme}
      data-scene={scene ? "" : undefined}
      data-nav-theme="dark"
      aria-label={brand.name}
    >
      {scene ? (
        <>
          <Image src={scene.image} alt={scene.alt} fill priority sizes="100vw" className={styles.video} />
          {/* The music's switch lives on the photograph only (the music plays on). */}
          <SceneMusic src={scene.music} label={`${brand.name} müziği`} className={styles.music} />
        </>
      ) : (
        film && (
          <video
            ref={video}
            className={styles.video}
            poster={film.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
          >
            {film.webm && <source src={film.webm} type="video/webm" />}
            <source src={film.mp4} type="video/mp4" />
          </video>
        )
      )}
      <div className={styles.grade} aria-hidden />
      {/* The foot of the film goes out of focus and dissolves into the page below. */}
      {!scene && <div className={styles.fade} aria-hidden />}

      <div className={styles.content}>
        <h1 className={styles.logo}>
          <Image src={brand.pageLogo ?? brand.logo} alt={brand.name} fill priority sizes="(max-width: 767px) 60vw, 340px" />
        </h1>
        <p className={styles.signature}>{brand.signature}</p>
      </div>

      <dl className={styles.facts}>
        <div>
          <dt>Kuruluş</dt>
          <dd>{brand.founded}</dd>
        </div>
        <div>
          <dt>Köken</dt>
          <dd>{brand.origin}</dd>
        </div>
      </dl>

      <button type="button" className={styles.cue} onClick={() => scrollTo(next)}>
        Aşağı kaydırın
        <span className={styles.cueLine} aria-hidden />
      </button>
    </section>
  );
}
