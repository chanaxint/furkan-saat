"use client";

import { useEffect, useRef } from "react";
import styles from "./BrandDropFilm.module.css";

/**
 * The foot of a brand page: a film that plays once each time it comes into
 * view (and is set back to its start once it is out of sight again), sitting
 * a little beneath the collection above it, so what falls into it seems to
 * fall from under that layer.
 */
export function BrandDropFilm({ film, label }: { film: { mp4: string; mobile: string; webm: string; poster: string }; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.45) {
          if (v.paused && (v.ended || v.currentTime === 0)) {
            v.currentTime = 0;
            v.play().catch(() => {});
          }
        } else if (!e.isIntersecting) {
          v.pause();
          v.currentTime = 0;
        }
      },
      { threshold: [0, 0.45] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className={styles.foot}>
      <video ref={video} className={styles.video} muted playsInline preload="metadata" poster={film.poster} aria-label={label}>
        <source src={film.mobile} type="video/mp4" media="(max-width: 767px)" />
        <source src={film.mp4} type="video/mp4" />
        <source src={film.webm} type="video/webm" />
      </video>
    </div>
  );
}
