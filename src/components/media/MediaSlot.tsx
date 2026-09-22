"use client";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties, type ReactNode, type PointerEvent } from "react";
import { SHOW_ASSET_HINTS } from "@/lib/assets";
import type { Tone } from "@/lib/data/types";
import styles from "./MediaSlot.module.css";

export type VideoSource = { webm?: string | null; mp4?: string | null; poster?: string | null };

export type MediaSlotProps = {
  /** Photograph (jpg/png/webp). */
  image?: string | null;
  alt?: string;
  /** Film (webm/mp4). Takes precedence over `image` when provided. */
  video?: VideoSource | null;
  /** CSS aspect-ratio, e.g. "4 / 5". Omit to fill the parent. */
  ratio?: string;
  tone?: Tone;
  /** Discreet caption shown while the slot is empty. */
  hint?: string;
  /** Placeholder composition. `stage` suggests a studio plinth for products. */
  motif?: "none" | "stage" | "horizon";
  /** Pointer-driven light + parallax (for hover-able product media). */
  interactive?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const hasVideo = (v?: VideoSource | null) => !!(v && (v.webm || v.mp4));

/**
 * The single media primitive of the site. Renders real media when a source
 * exists, otherwise a calm tonal placeholder that holds the layout exactly as
 * the final asset will. Inner layer `[data-media-inner]` is oversized so
 * sections can drive scroll parallax on it without revealing edges.
 */
export function MediaSlot({
  image,
  alt = "",
  video,
  ratio,
  tone = "green",
  hint,
  motif = "none",
  interactive = false,
  priority = false,
  sizes = "100vw",
  className = "",
  style,
  children,
}: MediaSlotProps) {
  const root = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const empty = !image && !hasVideo(video);

  // Only play films while visible.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), {
      threshold: 0.05,
    });
    io.observe(v);
    return () => io.disconnect();
  }, [video]);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!interactive || !root.current || e.pointerType !== "mouse") return;
    const r = root.current.getBoundingClientRect();
    root.current.style.setProperty("--mx", ((e.clientX - r.left) / r.width).toFixed(3));
    root.current.style.setProperty("--my", ((e.clientY - r.top) / r.height).toFixed(3));
  };
  const onLeave = () => {
    root.current?.style.setProperty("--mx", "0.5");
    root.current?.style.setProperty("--my", "0.5");
  };

  return (
    <div
      ref={root}
      className={`${styles.slot} ${styles[`tone_${tone}`]} ${interactive ? styles.interactive : ""} ${className}`}
      style={{ aspectRatio: ratio, ...style }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-empty={empty || undefined}
    >
      <div className={styles.inner} data-media-inner>
        {hasVideo(video) ? (
          <video
            ref={videoRef}
            className={styles.media}
            muted
            loop
            playsInline
            preload="metadata"
            poster={video?.poster ?? undefined}
          >
            {video?.webm && <source src={video.webm} type="video/webm" />}
            {video?.mp4 && <source src={video.mp4} type="video/mp4" />}
          </video>
        ) : image ? (
          <Image src={image} alt={alt} fill sizes={sizes} priority={priority} className={styles.media} />
        ) : (
          <div className={styles.placeholder} aria-hidden>
            <span className={styles.softbox} />
            {motif === "stage" && <span className={styles.stage} />}
            {motif === "horizon" && <span className={styles.horizon} />}
            <span className={styles.grain} />
          </div>
        )}
        {interactive && <span className={styles.sheen} aria-hidden />}
      </div>

      {empty && hint && SHOW_ASSET_HINTS && (
        <span className={styles.hint} aria-hidden>
          <span className={styles.hintDot} />
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}
