"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Brand } from "@/lib/data/types";
import styles from "./BrandReels.module.css";

/**
 * One brand tile. With a reel, hovering plays the clip and leaving rewinds it;
 * on touch screens it plays once the tile is in view. Without a reel the tile
 * shows the brand's photograph. Clicking opens the brand page.
 */
export function BrandTile({ brand }: { brand: Brand }) {
  const video = useRef<HTMLVideoElement>(null);
  const reel = brand.reel;

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

  // Touch screens: play when the tile comes into view.
  useEffect(() => {
    const v = video.current;
    if (!v || window.matchMedia("(hover: hover)").matches) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.6 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      href={`/markalar/${brand.slug}`}
      prefetch={false}
      className={styles.tile}
      data-reel={reel ? "" : undefined}
      onPointerEnter={(e) => reel && e.pointerType === "mouse" && play()}
      onPointerLeave={(e) => reel && e.pointerType === "mouse" && stop()}
      onFocus={() => reel && play()}
      onBlur={() => reel && stop()}
    >
      <span className={styles.frame}>
        {reel ? (
          <video
            ref={video}
            className={styles.video}
            poster={reel.poster ?? brand.cover}
            muted
            playsInline
            preload="metadata"
            aria-hidden
          >
            {reel.webm && <source src={reel.webm} type="video/webm" />}
            <source src={reel.mp4} type="video/mp4" />
          </video>
        ) : (
          <Image src={brand.cover} alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className={styles.image} />
        )}
      </span>
      <span className={styles.caption}>
        <span className={styles.brand}>{brand.name}</span>
        <span className={styles.cta}>
          Markayı keşfedin <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}
