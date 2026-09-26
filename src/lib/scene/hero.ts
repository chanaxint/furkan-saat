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
 *   1  SEATED      the watch sits on the cushion, tracked to the footage
 *   2  LIFT        as the camera pulls back, the watch rises off the cushion
 *                  and comes to the lens (large, dial front); the footage
 *                  dissolves into the house green
 *   3  PUSH-IN     slow move in to a macro of the dial, drifting across the hands
 *   4  CROWN       orbit round to the crown side at a low angle
 *   5  PROFILE     settle on a level side profile of the case
 *   6  RETURN      one diagonal turn back to the front
 *   7  HANDOVER    the only copy line arrives; the Rolex spins on a diagonal
 *                  and comes out of it as the Jacob & Co., which looks at it
 *
 * No copy appears before the handover. Each turn is sized to roughly one
 * scroll gesture; `scrub: 1` smooths it so it reads fluid, never snappy.
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

/** The single copy line, shown with the handover to the Jacob & Co. */
export const HERO_LINES: CopyLine[] = [
  { id: "models", text: "İstediğiniz her model", accent: "her model", side: "right", yaw: deg(24), pitch: deg(-9) },
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
  y: 0,
  z: -3.5,
  yaw: 0,
  pitch: 0,
  roll: 0,
  spinA: 0,
  spinB: 0,
  scale: 1,
  swap: 0,
  flash: 0,
});

/** Timeline times (seconds). Scroll length ≈ 60svh per second, so a turn ≈ one scroll gesture. */
export const HERO_BEATS = {
  film: { at: 0.3, dur: 5.0 },
  lift: { at: 1.1, dur: 1.4 },
  toLens: { at: 2.0, dur: 2.4 },
  fade: { at: 4.0, dur: 1.2 },
  pushIn: { at: 4.6, dur: 1.8 },
  drift: { at: 6.4, dur: 1.1 },
  crown: { at: 7.5, dur: 1.3 },
  profile: { at: 8.8, dur: 1.4 },
  back: { at: 10.3, dur: 1.3 },
  handover: { at: 11.9, dur: 1.8 },
  end: 15.2,
} as const;

type Dom = { cue?: Element | null; lines?: (Element | null)[] };

export function buildHeroTimeline(s: HeroState, dom: Dom = {}) {
  const B = HERO_BEATS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1–2 Footage: the camera pulls back; the watch lifts and comes to the lens.
  tl.to(s, { frame: HERO_VIDEO.frames - 1, duration: B.film.dur, ease: "power1.inOut" }, B.film.at);
  if (dom.cue) tl.to(dom.cue, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, B.film.at);
  tl.to(s, { lift: 0.9, duration: B.lift.dur, ease: "power2.out" }, B.lift.at)
    .to(s, { seat: 0, duration: B.toLens.dur }, B.toLens.at)
    .to(s, { film: 0, duration: B.fade.dur, ease: "power1.inOut" }, B.fade.at);

  // 3 Push-in to a macro of the dial, then drift across the hands.
  tl.to(s, { z: -1.35, x: -0.1, y: -0.04, yaw: deg(-8), pitch: deg(7), roll: deg(3), duration: B.pushIn.dur, ease: "power1.inOut" }, B.pushIn.at)
    .to(s, { x: 0.16, y: 0.02, yaw: deg(-18), pitch: deg(15), roll: deg(-2), duration: B.drift.dur, ease: "sine.inOut" }, B.drift.at);

  // 4 Orbit to the crown side, low angle.
  tl.to(s, { z: -1.9, x: -0.24, y: -0.06, yaw: deg(-60), pitch: deg(26), roll: deg(-6), duration: B.crown.dur }, B.crown.at);

  // 5 Level side profile of the case (6 o'clock edge, crown to the right).
  tl.to(s, { z: -2.5, x: 0, y: 0.26, yaw: deg(-10), pitch: deg(76), roll: 0, duration: B.profile.dur }, B.profile.at);

  // 6 One diagonal turn back to the front, at hero distance.
  tl.to(s, { z: -3.5, x: 0, y: 0, yaw: 0, pitch: 0, roll: 0, duration: B.back.dur }, B.back.at)
    .to(s, { spinA: `+=${Math.PI * 2}`, duration: B.back.dur }, B.back.at);

  // 7 Handover: one diagonal spin, accelerating then decelerating; the models
  //   cross-fade at peak speed behind a soft bloom. The copy line arrives.
  const H = B.handover;
  const mid = H.at + H.dur / 2;
  const line = dom.lines?.[0];
  // The line arrives with the new watch, once the spin has passed its peak.
  if (line) tl.fromTo(line, { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" }, mid + 0.15);
  tl.to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { x: -0.72, duration: H.dur, ease: "power2.inOut" }, H.at)
    .to(s, { scale: 0.78, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 1, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { swap: 1, duration: 0.36, ease: "none" }, mid - 0.18)
    .to(s, { flash: 1, duration: 0.25, ease: "power2.in" }, mid - 0.25)
    .to(s, { flash: 0, duration: 0.6, ease: "power2.out" }, mid)
    // The Jacob & Co. turns to look at the line (diagonal: yaw + pitch + roll).
    .to(s, { yaw: HERO_LINES[0].yaw, pitch: HERO_LINES[0].pitch, roll: deg(4), duration: 0.9, ease: "power3.out" }, H.at + H.dur);

  // Close: back to straight, copy leaves, short hold.
  tl.to(s, { yaw: 0, pitch: 0, roll: 0, x: 0, duration: 0.9 }, B.end - 1.3);
  if (line) tl.to(line, { autoAlpha: 0, y: -16, duration: 0.6, ease: "power2.in" }, B.end - 1.3);
  tl.set({}, {}, B.end);

  return tl;
}
