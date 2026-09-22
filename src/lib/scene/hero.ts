"use client";

import { gsap } from "@/lib/gsap";
import { HERO_VIDEO } from "./heroTrack";

/**
 * HERO FILM — the opening of the site
 * ----------------------------------------------------------------------------
 * A filmed shot (camera pulling back from the empty cushion of a watch box,
 * played frame-by-frame by scroll) with the real 3D watch composited into it.
 * One GSAP timeline, scrubbed by scroll (`scrub: 1`), animates a plain state
 * object; the 2D frame canvas, the WebGL scene and the DOM copy only read it.
 *
 *   1  SEATED     the watch sits on the cushion, tracked to the footage
 *   2  LIFT       as the camera pulls back, the watch rises off the cushion
 *   3  TO LENS    it comes to the lens, turns right, then left (diagonal tilts)
 *   4  AWAY       it spins away on a diagonal axis; the footage dissolves
 *                 into the house green
 *   5  COPY       lines arrive one by one; each time, the watch turns —
 *                 quick and diagonal — to look at the line
 *   6  HANDOVER   on "Every model you desire" the Rolex starts a fast
 *                 diagonal spin and comes out of it as the Jacob & Co.
 *
 * Rotation rule: no pure horizontal or pure vertical turns. Spins run about
 * the two diagonal axes below; look-turns always combine yaw *and* pitch.
 */

const deg = (d: number) => (d * Math.PI) / 180;

/** Camera of the WebGL layer (sits at the origin, looking down −Z). */
export const HERO_FOV = 30;

/** Camera elevation of the footage (how steeply it looks down at the box). */
export const FOOTAGE_ELEVATION = deg(52);

/**
 * Real size of the cushion in scene units (watch case ≈ 0.93 units ≈ 40 mm,
 * so the cushion is ≈ 56 mm wide). Its depth matches the inside of the
 * bracelet loop, so the bracelet hugs it front and back.
 */
export const CUSHION_WIDTH = 1.3;
export const CUSHION_DEPTH = 1.62;

/** Diagonal spin axes, in camera space. */
export const SPIN_AXIS_A: [number, number, number] = [0.68, 0.68, 0.27];
export const SPIN_AXIS_B: [number, number, number] = [-0.66, 0.7, 0.27];

export type CopyLine = { id: string; text: string; accent: string; side: "left" | "right"; yaw: number; pitch: number };

/** The copy beats, where they sit, and where the watch looks for each. */
export const HERO_LINES: CopyLine[] = [
  { id: "water", text: "Water resistant to 300 metres", accent: "300 metres", side: "right", yaw: deg(34), pitch: deg(14) },
  { id: "quality", text: "Uncompromising quality", accent: "quality", side: "left", yaw: deg(-34), pitch: deg(-12) },
  { id: "models", text: "Every model you desire", accent: "you desire", side: "right", yaw: deg(28), pitch: deg(-10) },
];

export type HeroState = {
  /** Footage frame (float, 0 → frames − 1). */
  frame: number;
  /** Footage visibility (1 = film, 0 = house green). */
  film: number;
  /** 1 = watch on the cushion (tracked), 0 = free in camera space. */
  seat: number;
  /** Rise off the cushion along the table normal (scene units). */
  lift: number;
  /** Free pose, camera space. */
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Spins about the diagonal axes (radians, multiples of 2π at rest). */
  spinA: number;
  spinB: number;
  scale: number;
  /** 0 = Rolex, 1 = Jacob & Co. (cross-fades around 0.5). */
  swap: number;
  /** Momentary light bloom during the handover. */
  flash: number;
};

export const createHeroState = (): HeroState => ({
  frame: 0,
  film: 1,
  seat: 1,
  lift: 0,
  x: 0,
  y: 0.05,
  z: -2.9,
  yaw: 0,
  pitch: 0,
  roll: 0,
  spinA: 0,
  spinB: 0,
  scale: 1,
  swap: 0,
  flash: 0,
});

/** Timeline times (seconds) — each beat is pinned so nothing can drift. */
export const HERO_BEATS = {
  film: { at: 0.4, dur: 8.2 },
  lift: { at: 2.2, dur: 1.8 },
  toLens: { at: 3.3, dur: 2.6 },
  right: { at: 6.0, dur: 0.9 },
  left: { at: 6.9, dur: 1.1 },
  away: { at: 8.1, dur: 1.6 },
  lines: [10.0, 12.2, 14.4],
  handover: { at: 14.8, dur: 2.2 },
  end: 18.4,
} as const;

type Dom = { title?: Element | null; cue?: Element | null; lines?: (Element | null)[] };

export function buildHeroTimeline(s: HeroState, dom: Dom = {}) {
  const B = HERO_BEATS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // Footage: the camera pulls back from the cushion.
  tl.to(s, { frame: HERO_VIDEO.frames - 1, duration: B.film.dur, ease: "power1.inOut" }, B.film.at);
  const intro = [dom.title, dom.cue].filter(Boolean) as Element[];
  if (intro.length) tl.to(intro, { autoAlpha: 0, y: -20, duration: 0.9, ease: "power1.in" }, B.film.at);

  // Lift off the cushion (still tracked to the footage), then free to the lens.
  tl.to(s, { lift: 0.9, duration: B.lift.dur, ease: "power2.out" }, B.lift.at)
    .to(s, { seat: 0, duration: B.toLens.dur, ease: "power2.inOut" }, B.toLens.at);

  // Show off: right, then left — every turn mixes yaw, pitch and roll.
  tl.to(s, { yaw: deg(38), pitch: deg(10), roll: deg(7), duration: B.right.dur, ease: "sine.inOut" }, B.right.at).to(
    s,
    { yaw: deg(-38), pitch: deg(-9), roll: deg(-7), duration: B.left.dur, ease: "sine.inOut" },
    B.left.at,
  );

  // Spin away on the diagonal; footage dissolves into the house green.
  tl.to(s, { spinA: Math.PI * 4, duration: B.away.dur, ease: "power2.inOut" }, B.away.at)
    .to(s, { z: -7.4, y: 0, yaw: 0, pitch: 0, roll: 0, duration: B.away.dur, ease: "power2.inOut" }, B.away.at)
    .to(s, { film: 0, duration: 1.4, ease: "power1.inOut" }, B.away.at + 0.2);

  // Copy beats: each line arrives, the watch snaps to look at it with a quick
  // diagonal turn (a full spin about axis B on the way, except the first).
  HERO_LINES.forEach((line, i) => {
    const at = B.lines[i];
    const el = dom.lines?.[i];
    const shift = line.side === "right" ? -0.75 : 0.75; // lean away from the copy
    if (el) {
      const from = line.side === "right" ? 60 : -60;
      tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, at);
      if (i < HERO_LINES.length - 1) tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.5, ease: "power2.in" }, B.lines[i + 1] - 0.1);
    }
    if (i === HERO_LINES.length - 1) return; // the last line belongs to the handover
    const turn = 0.75;
    tl.to(s, { yaw: line.yaw, pitch: line.pitch, roll: line.side === "right" ? deg(6) : deg(-6), x: shift, duration: turn, ease: "power3.out" }, at + 0.1);
    if (i > 0) tl.to(s, { spinB: `+=${Math.PI * 2}`, duration: turn, ease: "power3.out" }, at + 0.1);
  });

  // Handover: the Rolex accelerates into a fast diagonal spin, shrinks a touch
  // at peak speed while it cross-fades into the Jacob & Co., which decelerates
  // out of the same spin and settles, looking at the last line.
  const H = B.handover;
  const mid = H.at + H.dur / 2;
  tl.to(s, { spinA: `+=${Math.PI * 3}`, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { spinA: `+=${Math.PI * 3}`, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { x: 0.55, yaw: 0, pitch: 0, roll: 0, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 0.8, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 1, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { swap: 1, duration: 0.36, ease: "none" }, mid - 0.18)
    .to(s, { flash: 1, duration: 0.25, ease: "power2.in" }, mid - 0.25)
    .to(s, { flash: 0, duration: 0.6, ease: "power2.out" }, mid)
    .to(
      s,
      { yaw: HERO_LINES[2].yaw * 0.6, pitch: HERO_LINES[2].pitch * 0.6, roll: deg(4), duration: 0.9, ease: "power3.out" },
      H.at + H.dur,
    );

  // Close: back to a straight hero, copy leaves, hold.
  const last = dom.lines?.[HERO_LINES.length - 1];
  tl.to(s, { yaw: 0, pitch: 0, roll: 0, x: 0, duration: 0.9 }, B.end - 1.3);
  if (last) tl.to(last, { autoAlpha: 0, y: -16, duration: 0.6, ease: "power2.in" }, B.end - 1.3);
  tl.set({}, {}, B.end);

  return tl;
}
