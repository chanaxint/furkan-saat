"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { BRAND_REELS, type BrandReel } from "@/lib/data/brandReels";
import styles from "./BrandReels.module.css";

/**
 * BRANDS — four equal tiles. Each shows its logo; hovering plays the clip in
 * which the logo becomes a watch, leaving rewinds it. Clicking opens that watch.
 * On touch screens (no hover) a tile plays when it scrolls into view.
 */
export function BrandReels() {
  return (
    <section
      className={styles.section}
      id="markalar"
      data-nav-theme="dark"
      aria-label="Markalar"
    >
      <header className={styles.header}>
        <SectionMarker index="04" label="Markalar" className={styles.marker} />
        <h2 className={styles.title}>
          Dünyanın en seçkin <em>markaları</em>
        </h2>
      </header>
      <Reveal as="ul" className={styles.grid} stagger={0.1}>
        {BRAND_REELS.map((r) => (
          <li key={r.id}>
            <Tile reel={r} />
          </li>
        ))}
      </Reveal>
    </section>
  );
}

function Tile({ reel }: { reel: BrandReel }) {
  const video = useRef<HTMLVideoElement>(null);

  const play = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const stop = () => {
    const v = video.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  // Touch screens: play once when the tile comes into view.
  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? play() : stop()),
      { threshold: 0.6 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      href={reel.href}
      prefetch={false}
      className={styles.tile}
      onPointerEnter={(e) => e.pointerType === "mouse" && play()}
      onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
      onFocus={play}
      onBlur={stop}
    >
      <span className={styles.frame}>
        <video
          ref={video}
          className={styles.video}
          poster={reel.poster}
          muted
          playsInline
          preload="metadata"
          aria-hidden
        >
          <source src={reel.webm} type="video/webm" />
          <source src={reel.video} type="video/mp4" />
        </video>
      </span>
      <span className={styles.caption}>
        <span className={styles.brand} lang="en">
          {reel.brand}
        </span>
        <span className={styles.watch}>{reel.watch}</span>
        <span className={styles.cta}>
          Saati keşfedin <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}
