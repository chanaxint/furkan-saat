import type { Keyframe, Vec3 } from "./keyframes";
import { scalarTrack, vec3Track } from "./spline";

/**
 * WATCH SHOWCASE — choreography
 * ----------------------------------------------------------------------------
 * Sequence position in the (future) product film:
 *
 *   [box opening] → [box exit] → ▶ SHOWCASE ◀ → [exploded view]
 *
 * The showcase starts in SHOWCASE_ENTRY_POSE — the pose the box-exit sequence
 * must hand over — and ends in SHOWCASE_HERO_POSE, the balanced front hero
 * from which the exploded view will continue. Both are exported so adjacent
 * sequences can be authored against them without touching this file.
 *
 * Motion path (section progress 0 → 1):
 *   hold front → ¾ (crown toward camera) → side profile → ¾ (return path
 *   slightly lower, so it is not a mechanical reverse) → front hero → hold
 *
 * Angles are radians. Rotation order XYZ, applied around the watch head
 * (ASSETS.showcase.watch.pivot), so the dial never leaves the frame.
 */

export type ShowcasePose = {
  /** Watch rotation [tilt, yaw, roll]. */
  rotation: Vec3;
  /** Camera orbit around the watch head. */
  camera: { azimuth: number; elevation: number; distance: number; target: Vec3 };
};

const deg = (d: number) => (d * Math.PI) / 180;

/** Portion of the scroll spent holding the entry / hero poses. */
export const SHOWCASE_TIMING = { holdIn: 0.08, holdOut: 0.12 };

/** Base camera distance — whole watch (with bracelet) ≈ 65% of the frame. */
export const SHOWCASE_DISTANCE = 6.6;
export const SHOWCASE_FOV = 24;

export const SHOWCASE_ENTRY_POSE: ShowcasePose = {
  rotation: [0, 0, 0],
  camera: { azimuth: 0, elevation: deg(3), distance: SHOWCASE_DISTANCE, target: [0, -0.02, 0] },
};

export const SHOWCASE_HERO_POSE: ShowcasePose = {
  rotation: [0, 0, 0],
  camera: { azimuth: 0, elevation: deg(3), distance: SHOWCASE_DISTANCE, target: [0, -0.02, 0] },
};

/** Named beats — also used by the DOM caption rail. */
export const SHOWCASE_BEATS = [
  { at: 0, label: "Face" },
  { at: 0.25, label: "Three-quarter" },
  { at: 0.5, label: "Profile" },
  { at: 0.75, label: "Three-quarter" },
  { at: 1, label: "Face" },
] as const;

/* Keyframes are authored on the *active* range (0 → 1 after the holds). */

const ROTATION: Keyframe<Vec3>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.rotation },
  { at: 0.25, value: [deg(4), deg(-40), deg(1.2)] },
  { at: 0.5, value: [deg(2), deg(-86), 0] },
  { at: 0.75, value: [deg(-3), deg(-38), deg(-0.8)] },
  { at: 1, value: SHOWCASE_HERO_POSE.rotation },
];

const AZIMUTH: Keyframe<number>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.camera.azimuth },
  { at: 0.25, value: deg(7) },
  { at: 0.5, value: deg(10) },
  { at: 0.75, value: deg(4) },
  { at: 1, value: SHOWCASE_HERO_POSE.camera.azimuth },
];

const ELEVATION: Keyframe<number>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.camera.elevation },
  { at: 0.25, value: deg(7) },
  { at: 0.5, value: deg(4) },
  { at: 0.75, value: deg(-1) },
  { at: 1, value: SHOWCASE_HERO_POSE.camera.elevation },
];

/** Gentle dolly: slightly closer on the ¾ views, a touch wider for the profile. */
const DISTANCE: Keyframe<number>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.camera.distance },
  { at: 0.25, value: SHOWCASE_DISTANCE * 0.93 },
  { at: 0.5, value: SHOWCASE_DISTANCE * 1.02 },
  { at: 0.75, value: SHOWCASE_DISTANCE * 0.95 },
  { at: 1, value: SHOWCASE_HERO_POSE.camera.distance },
];

/**
 * In profile the bracelet loop extends behind the head (to screen-right);
 * the look-at point drifts toward it so the composition stays balanced while
 * the head remains the optical centre.
 */
const TARGET: Keyframe<Vec3>[] = [
  { at: 0, value: SHOWCASE_ENTRY_POSE.camera.target },
  { at: 0.25, value: [0.14, -0.02, 0] },
  { at: 0.5, value: [0.3, -0.02, 0] },
  { at: 0.75, value: [0.12, -0.02, 0] },
  { at: 1, value: SHOWCASE_HERO_POSE.camera.target },
];

const tracks = {
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
  tracks.rotation(a, out.rotation);
  out.camera.azimuth = tracks.azimuth(a);
  out.camera.elevation = tracks.elevation(a);
  out.camera.distance = tracks.distance(a);
  tracks.target(a, out.camera.target);
  return out;
}

export const createPose = (): ShowcasePose => ({
  rotation: [0, 0, 0],
  camera: { azimuth: 0, elevation: 0, distance: SHOWCASE_DISTANCE, target: [0, 0, 0] },
});
