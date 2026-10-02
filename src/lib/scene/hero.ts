"use client";

import { gsap } from "@/lib/gsap";
import { HERO_VIDEO } from "./heroTrack";
import { MOVEMENT_FILM } from "./movement";

/**
 * HERO FILM — the opening of the site
 * ----------------------------------------------------------------------------
 * A filmed shot (camera pulling back from the empty cushion of a watch box,
 * played frame-by-frame by scroll) with the real 3D watch composited into it.
 * One GSAP timeline, scrubbed by scroll (`scrub: 1`), animates a plain state
 * object; the 2D frame canvas and the WebGL scene only read it. There is no
 * on-screen copy: the film and the watch carry the opening on their own.
 *
 *   1  SEATED      the watch sits on the cushion, tracked to the footage
 *                  (placement tuned on /kontrol, stored in seat.json)
 *   2  LIFT        as the camera pulls back, the watch rises off the cushion
 *                  and comes large to the lens; the footage dissolves into
 *                  the house green
 *   3  FEATURES    the watch turns (diagonally) four times to show its
 *                  parts — case flank, caseback (where it zooms onto a film
 *                  that separates the movement on scroll), bezel, bracelet
 *   4  HANDOVER    one diagonal spin into the second watch, then three
 *                  shorter turns of it
 *   5  OUTRO       the watch spins away and the page continues
 *
 * Each turn is sized to roughly one scroll gesture; `scrub: 1` smooths it.
 *
 * Rotation rule: no pure horizontal or pure vertical turns. Spins run about
 * the two diagonal axes below; look-turns always combine yaw *and* pitch.
 */

const deg = (d: number) => (d * Math.PI) / 180;

/** Camera of the WebGL layer (sits at the origin, looking down −Z). */
export const HERO_FOV = 30;

/** Diagonal spin axes, in camera space. */
export const SPIN_AXIS_A: [number, number, number] = [0.68, 0.68, 0.27];
export const SPIN_AXIS_B: [number, number, number] = [-0.66, 0.7, 0.27];

type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number };

/** One turn of the watch: the pose that shows a part of it to the camera. */
export type HeroBeat = { id: string; pose: Pose };

/**
 * The first watch's turns. Yaw keeps turning the same way (0 → −52° →
 * −128° → −372°), so each change reads as one continuous diagonal turn.
 * The movement turn is oblique enough that the clasp passes beside the
 * caseback, not across it.
 */
export const FIRST_BEATS: HeroBeat[] = [
  { id: "case", pose: { x: 0.62, y: 0, z: -2.7, yaw: deg(-52), pitch: deg(16), roll: deg(-5) } },
  { id: "movement", pose: { x: -0.92, y: 0.05, z: -4.0, yaw: deg(-128), pitch: deg(-14), roll: deg(8) } },
  { id: "bezel", pose: { x: 0.36, y: -0.08, z: -1.6, yaw: deg(-372), pitch: deg(38), roll: deg(4) } },
  { id: "bracelet", pose: { x: -0.55, y: 0.3, z: -2.6, yaw: deg(-385), pitch: deg(74), roll: 0 } },
];

/** The second watch's turns, after the handover. Yaw continues from the front pose (−360°). */
export const SECOND_BEATS: HeroBeat[] = [
  { id: "sky", pose: { x: 0.36, y: -0.06, z: -1.65, yaw: deg(-372), pitch: deg(26), roll: deg(4) } },
  { id: "strap", pose: { x: -0.92, y: 0.05, z: -4.0, yaw: deg(-488), pitch: deg(-14), roll: deg(8) } },
  { id: "platinum", pose: { x: 0.62, y: 0, z: -2.7, yaw: deg(-412), pitch: deg(16), roll: deg(-5) } },
];

/** Every turn in order. */
export const ALL_BEATS: HeroBeat[] = [...FIRST_BEATS, ...SECOND_BEATS];

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
  /** 0 = first watch, 1 = second watch (cross-fades around 0.5). */
  swap: number;
  /** Momentary light bloom during the handover. */
  flash: number;
  /** 0 → 1: zoom the camera onto the movement film's exact framing. */
  lock: number;
  /** Movement film frame (float, 0 → 119) and its visibility. */
  mech: number;
  mechFilm: number;
  /** 1 = hide the 3D watch (while the film is on screen). */
  hide: number;
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
  lock: 0,
  mech: 0,
  mechFilm: 0,
  hide: 0,
});

/** Timeline times (seconds). Scroll length ≈ 60svh per second, so a turn ≈ one scroll gesture. */
export const HERO_BEATS = {
  film: { at: 0.3, dur: 5.0 },
  lift: { at: 1.1, dur: 1.4 },
  toLens: { at: 2.0, dur: 2.4 },
  fade: { at: 4.0, dur: 1.2 },
  /** When each feature turn starts — ALL_BEATS order (4 first watch, 3 second). */
  features: { starts: [4.8, 7.2, 14.0, 16.4, 23.0, 25.4, 27.8], turn: 1.3 },
  movement: { swapIn: 8.55, explode: { at: 8.9, dur: 2.8 }, reassemble: { at: 12.0, dur: 1.5 }, swapOut: 13.55 },
  handover: { at: 19.0, dur: 1.8 },
  /** Outro: the watch spins away, the page continues. */
  outro: { at: 30.2, dur: 1.8 },
  end: 33.2,
} as const;

type Dom = {
  cue?: Element | null;
};

export function buildHeroTimeline(s: HeroState, dom: Dom = {}) {
  const B = HERO_BEATS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1–2 Footage: the camera pulls back; the watch lifts and comes to the lens.
  tl.to(s, { frame: HERO_VIDEO.frames - 1, duration: B.film.dur, ease: "power1.inOut" }, B.film.at);
  if (dom.cue) tl.to(dom.cue, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, B.film.at);
  tl.to(s, { lift: 0.9, duration: B.lift.dur, ease: "power2.out" }, B.lift.at)
    .to(s, { seat: 0, duration: B.toLens.dur }, B.toLens.at)
    .to(s, { film: 0, duration: B.fade.dur, ease: "power1.inOut" }, B.fade.at);

  // 3 Features (first watch, then the second): the watch turns to show each part.
  const F = B.features;
  const H = B.handover;
  ALL_BEATS.forEach((beat, i) => {
    tl.to(s, { ...beat.pose, duration: F.turn }, F.starts[i]);
  });

  // 3b Mechanism: the camera zooms onto the movement film's framing; the film
  //    swaps in, separates and reassembles the movement, then hands back.
  const M = B.movement;
  const last = MOVEMENT_FILM.count - 1;
  tl.to(s, { lock: 1, duration: F.turn }, F.starts[1])
    .to(s, { mechFilm: 1, duration: 0.2, ease: "none" }, M.swapIn)
    .to(s, { hide: 1, duration: 0.25, ease: "none" }, M.swapIn + 0.15)
    .to(s, { mech: last, duration: M.explode.dur, ease: "power1.inOut" }, M.explode.at)
    .to(s, { mech: 0, duration: M.reassemble.dur, ease: "power1.inOut" }, M.reassemble.at)
    .to(s, { hide: 0, duration: 0.25, ease: "none" }, M.swapOut)
    .to(s, { mechFilm: 0, duration: 0.2, ease: "none" }, M.swapOut + 0.2)
    .to(s, { lock: 0, duration: F.turn }, F.starts[2]);

  // 4 Handover: back to the front while spinning once on the diagonal; the
  //   models cross-fade at peak speed behind a soft bloom.
  const mid = H.at + H.dur / 2;
  tl.to(s, { x: 0, y: -0.08, z: -4.3, yaw: deg(-360), pitch: 0, roll: 0, duration: H.dur }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { scale: 0.82, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 1, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { swap: 1, duration: 0.36, ease: "none" }, mid - 0.18)
    .to(s, { flash: 1, duration: 0.25, ease: "power2.in" }, mid - 0.25)
    .to(s, { flash: 0, duration: 0.6, ease: "power2.out" }, mid);

  // 5 Outro: the watch returns to the front, spins once on the diagonal
  //   while it recedes, and the 3D layer fades into the page.
  const O = B.outro;
  tl.to(s, { x: 0, y: -0.75, z: -8.5, yaw: deg(-360), pitch: 0, roll: 0, duration: O.dur }, O.at)
    .to(s, { spinA: `+=${Math.PI * 2}`, duration: O.dur }, O.at)
    .to(s, { hide: 1, duration: 0.8, ease: "power1.in" }, O.at + O.dur + 0.3);

  tl.set({}, {}, B.end);
  return tl;
}
