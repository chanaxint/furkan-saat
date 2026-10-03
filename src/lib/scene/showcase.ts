"use client";

import { gsap } from "@/lib/gsap";
import { type Pose, pose, type ShowcaseBeat } from "./pose";

export type { Pose, ShowcaseBeat };

/**
 * BRAND SHOWCASE — a watch performed in 3D, scrubbed by scroll
 * ----------------------------------------------------------------------------
 * Comes after a brand page's film opening. One GSAP timeline animates a plain
 * state object; the WebGL scene only reads it (no React renders per frame).
 *
 *   1  ENTER     as the section scrolls in, the watch flies up out of the
 *                depth with one diagonal spin and settles facing the lens
 *   2  FEATURES  four turns, each showing one part as its line arrives on the
 *                other side of the screen
 *   3  SETTLE    one last turn back to the front, centred, as the page moves on
 *
 * Rotation rule (as in the earlier opening): no pure horizontal or vertical
 * turns. Spins run about two diagonal axes; look-turns mix yaw, pitch and roll.
 */

const deg = (d: number) => (d * Math.PI) / 180;

/** Camera of the WebGL layer (at the origin, looking down −Z). */
export const SHOWCASE_FOV = 30;
/** Diagonal spin axes, camera space. */
export const SPIN_AXIS_A: [number, number, number] = [0.68, 0.68, 0.27];
export const SPIN_AXIS_B: [number, number, number] = [-0.66, 0.7, 0.27];

export type ShowcaseState = Pose & {
  spinA: number;
  spinB: number;
  scale: number;
  /** 0 → 1: the 3D layer fades in as the watch arrives. */
  show: number;
};

const FRONT = pose(0, -0.02, -4.4, 0, 0, 0);

export const createShowcaseState = (): ShowcaseState => ({
  ...pose(0, -1.15, -9.5, -160, 34, 12),
  spinA: -Math.PI * 2,
  spinB: 0,
  scale: 0.72,
  show: 0,
});

/**
 * Timeline (seconds). The section is sized from END so that a feature turn
 * takes about one scroll gesture (see BrandShowcase: SVH_PER_SECOND).
 */
export const SHOWCASE_TIMES = {
  /** The first 2 s happen while the section scrolls into view. */
  enter: { at: 0, dur: 2.4 },
  features: { starts: [3.4, 5.9, 8.4, 10.9], turn: 1.3 },
  settle: { at: 13.4, dur: 1.8 },
  end: 15.8,
} as const;

export function buildShowcaseTimeline(
  s: ShowcaseState,
  beats: ShowcaseBeat[],
  lines: (HTMLElement | null)[] = [],
) {
  const T = SHOWCASE_TIMES;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1 Enter: out of the depth, one diagonal spin, settling to the front.
  tl.to(s, { show: 1, duration: 0.9, ease: "power1.out" }, T.enter.at)
    .to(s, { ...FRONT, scale: 1, duration: T.enter.dur, ease: "power3.out" }, T.enter.at)
    .to(s, { spinA: 0, duration: T.enter.dur, ease: "power2.out" }, T.enter.at);

  // 2 Features: turn to the part; the line slides in from its side, holds, leaves.
  const F = T.features;
  beats.slice(0, F.starts.length).forEach((beat, i) => {
    const at = F.starts[i];
    tl.to(s, { ...beat.pose, duration: F.turn }, at);
    const el = lines[i];
    if (!el) return;
    const from = beat.side === "left" ? -50 : 50;
    const out = (F.starts[i + 1] ?? T.settle.at) - 0.35;
    tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, at + F.turn * 0.55);
    tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.5, ease: "power2.in" }, out);
  });

  // 3 Settle: back to the front with one more diagonal spin.
  const S = T.settle;
  tl.to(s, { ...FRONT, yaw: deg(-720), duration: S.dur }, S.at)
    .to(s, { spinB: `+=${Math.PI * 2}`, duration: S.dur, ease: "power2.inOut" }, S.at);

  tl.set({}, {}, T.end);
  return tl;
}
