import type { Keyframe, Vec3 } from "./keyframes";
import { scalarTrack, vec3Track } from "./spline";
import { createAdvance, type SequencePose } from "./sequence";

/**
 * WATCH SHOWCASE — choreography
 * ----------------------------------------------------------------------------
 * Sequence position in the product film:
 *
 *   [box opening] → [box exit] → ▶ SHOWCASE ◀ → [exploded view]
 *
 * Beats (active progress 0 → 1):
 *   1. ARRIVAL      the watch rises into frame and settles, dial to camera
 *   2. PRESENCE     it shows its face off — right, a touch right, a touch left
 *   3. REVERSE      it recedes while turning a full revolution:
 *                   caseback & bracelet → dial again
 *   4. PERSPECTIVE  it comes forward and tips its dial up, seen from a side angle
 *   5. HERO         it returns to the straight front pose and holds
 *
 * SHOWCASE_ENTRY_POSE is where the watch starts (below frame — the future
 * box-exit sequence replaces beat 1 by ending on SHOWCASE_ARRIVED_POSE).
 * SHOWCASE_HERO_POSE is the end pose the exploded view continues from.
 *
 * Angles in radians, Euler order XYZ, rotation around the watch head
 * (ASSETS.showcase.watch.pivot). Yaw is continuous: the full turn ends at
 * −2π, which is visually identical to the front pose.
 */

/** Positive yaw turns the dial to screen-right. */
export type ShowcasePose = SequencePose;

const deg = (d: number) => (d * Math.PI) / 180;
const TURN = -Math.PI * 2;

/** Portion of the scroll spent holding the first / last frame. */
export const SHOWCASE_TIMING = { holdIn: 0.02, holdOut: 0.08 };

/** Base camera distance — whole watch (with bracelet) ≈ 65% of the frame. */
export const SHOWCASE_DISTANCE = 6.6;
export const SHOWCASE_FOV = 24;

const FRONT_CAMERA = { azimuth: 0, elevation: deg(3), distance: SHOWCASE_DISTANCE, target: [0, -0.02, 0] as Vec3 };

export const SHOWCASE_ENTRY_POSE: ShowcasePose = {
  position: [0, -2.8, -1.2],
  rotation: [deg(22), deg(-34), deg(-4)],
  camera: FRONT_CAMERA,
};

/** Centre-frame, dial to camera — the hand-over point for a box-exit sequence. */
export const SHOWCASE_ARRIVED_POSE: ShowcasePose = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  camera: FRONT_CAMERA,
};

export const SHOWCASE_HERO_POSE: ShowcasePose = {
  position: [0, 0, 0],
  rotation: [0, TURN, 0],
  camera: FRONT_CAMERA,
};

/** Named beats (active progress) — also drive the DOM caption rail. */
export const SHOWCASE_BEATS = [
  { at: 0, label: "Arrival" },
  { at: 0.12, label: "Presence" },
  { at: 0.32, label: "Reverse" },
  { at: 0.6, label: "Perspective" },
  { at: 0.84, label: "Hero" },
] as const;

/* ------------------------------------------------------------------ keys */

const POSITION: Keyframe<Vec3>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.position },
  { at: 0.1, value: SHOWCASE_ARRIVED_POSE.position },
  { at: 0.3, value: [0, 0, 0] },
  { at: 0.44, value: [0, 0.06, -2.6] }, // furthest back, caseback to camera
  { at: 0.56, value: [0, 0.02, -1.6] },
  { at: 0.64, value: [-0.12, 0.22, -0.3] },
  { at: 0.72, value: [-0.3, 0.42, 0] }, // lifted: the tipped bracelet hangs below
  { at: 0.88, value: SHOWCASE_HERO_POSE.position },
  { at: 1, value: SHOWCASE_HERO_POSE.position },
];

const ROTATION: Keyframe<Vec3>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.rotation },
  { at: 0.1, value: SHOWCASE_ARRIVED_POSE.rotation },
  // Presence: right → a touch right → a touch left
  { at: 0.15, value: [deg(2), deg(22), deg(0.6)] },
  { at: 0.2, value: [deg(1), deg(9), 0] },
  { at: 0.26, value: [deg(2), deg(-15), deg(-0.6)] },
  { at: 0.31, value: [0, deg(-8), 0] },
  // Reverse: one full revolution while receding (caseback & bracelet → dial)
  { at: 0.44, value: [deg(4), -Math.PI, 0] },
  { at: 0.57, value: [deg(1), TURN + deg(-4), 0] },
  // Perspective: dial tipped up, seen from a side angle
  { at: 0.68, value: [deg(-58), TURN + deg(-30), deg(-3)] },
  { at: 0.76, value: [deg(-62), TURN + deg(-40), deg(-4)] },
  // Hero
  { at: 0.88, value: SHOWCASE_HERO_POSE.rotation },
  { at: 1, value: SHOWCASE_HERO_POSE.rotation },
];

const AZIMUTH: Keyframe<number>[] = [
  { at: 0, value: 0 },
  { at: 0.26, value: deg(-3) },
  { at: 0.44, value: deg(5) },
  { at: 0.72, value: deg(8) },
  { at: 0.88, value: 0 },
  { at: 1, value: 0 },
];

const ELEVATION: Keyframe<number>[] = [
  { at: 0, value: deg(1) },
  { at: 0.1, value: FRONT_CAMERA.elevation },
  { at: 0.44, value: deg(5) },
  { at: 0.72, value: deg(11) }, // look down onto the upturned dial
  { at: 0.88, value: FRONT_CAMERA.elevation },
  { at: 1, value: FRONT_CAMERA.elevation },
];

const DISTANCE: Keyframe<number>[] = [
  { at: 0, value: SHOWCASE_DISTANCE * 1.04 },
  { at: 0.1, value: SHOWCASE_DISTANCE },
  { at: 0.23, value: SHOWCASE_DISTANCE * 0.94 }, // lean in while it shows off
  { at: 0.44, value: SHOWCASE_DISTANCE },
  { at: 0.72, value: SHOWCASE_DISTANCE * 0.97 },
  { at: 0.88, value: SHOWCASE_DISTANCE },
  { at: 1, value: SHOWCASE_DISTANCE },
];

const TARGET: Keyframe<Vec3>[] = [
  { at: 0, value: [0, -0.4, 0] },
  { at: 0.1, value: FRONT_CAMERA.target },
  { at: 0.44, value: [0, 0, -1.4] }, // follow the watch back
  { at: 0.64, value: [0, 0.02, -0.2] },
  { at: 0.88, value: FRONT_CAMERA.target },
  { at: 1, value: FRONT_CAMERA.target },
];

const tracks = {
  position: vec3Track(POSITION),
  rotation: vec3Track(ROTATION),
  azimuth: scalarTrack(AZIMUTH),
  elevation: scalarTrack(ELEVATION),
  distance: scalarTrack(DISTANCE),
  target: vec3Track(TARGET),
};

/** Section progress (with holds) → active 0 → 1. */
export function showcaseActive(p: number) {
  const { holdIn, holdOut } = SHOWCASE_TIMING;
  return Math.min(1, Math.max(0, (p - holdIn) / (1 - holdIn - holdOut)));
}

/** Sample the full pose at section progress `p` (writes into `out`). */
export function sampleShowcasePose(p: number, out: ShowcasePose): ShowcasePose {
  const a = showcaseActive(p);
  tracks.position(a, out.position);
  tracks.rotation(a, out.rotation);
  out.camera.azimuth = tracks.azimuth(a);
  out.camera.elevation = tracks.elevation(a);
  out.camera.distance = tracks.distance(a);
  tracks.target(a, out.camera.target);
  return out;
}


/* ------------------------------------------------------- kinetic type */

export type ShowcaseMessage = {
  text: string;
  /** Italic accent word(s) inside `text`, rendered in champagne. */
  accent?: string;
  /** Side the line enters from; it crosses the full width. */
  from: "left" | "right";
  /** Active-progress window in which it crosses the screen. */
  range: [number, number];
  /** Vertical position (% of viewport height). */
  top: number;
};

/** Lines that sweep across the frame (behind the watch) during the showcase. */
export const SHOWCASE_MESSAGES: ShowcaseMessage[] = [
  { text: "Water resistant to 300 metres", accent: "300 metres", from: "right", range: [0.08, 0.36], top: 20 },
  { text: "Uncompromising quality", accent: "quality", from: "left", range: [0.28, 0.58], top: 70 },
  { text: "Every timepiece you desire", accent: "you desire", from: "right", range: [0.5, 0.8], top: 22 },
  { text: "Authenticated · Guaranteed", accent: "Guaranteed", from: "left", range: [0.66, 0.98], top: 72 },
];

/* ------------------------------------------------------------- motion */

/** Visible speed limits — whatever the scroll does, the watch never exceeds these. */
export const SHOWCASE_SPEED = {
  degreesPerSecond: 170,
  unitsPerSecond: 2.4,
  progressPerSecond: 0.5,
};

/**
 * Advance the showcase spring one frame. Where the watch turns fast per
 * scroll (the full revolution) the speed limit tightens, so even a violent
 * scroll or an anchor jump plays back as a smooth, bounded move.
 */
export const advanceShowcase = createAdvance(sampleShowcasePose, SHOWCASE_SPEED);

export { createPose } from "./sequence";
