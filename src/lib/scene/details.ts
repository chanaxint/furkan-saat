import type { Keyframe, Vec3 } from "./keyframes";
import { createAdvance, type SequencePose } from "./sequence";
import { scalarTrack, vec3Track } from "./spline";

/**
 * WATCH DETAILS — macro close-up pass (replaces the exploded view for now)
 * ----------------------------------------------------------------------------
 * The watch stays still in its hero pose; the *camera* travels. It starts
 * exactly where the showcase ends (front hero, wide), moves in for five macro
 * shots around the case and bracelet, then pulls back out to the hero frame.
 *
 * Model space (after the pivot offset): watch head centre at the origin,
 * dial plane at z ≈ +0.135, crown at +x, bracelet clasp behind at z ≈ −1.5.
 */

const deg = (d: number) => (d * Math.PI) / 180;

export const DETAILS_FOV = 24;
export const DETAILS_TIMING = { holdIn: 0.03, holdOut: 0.06 };

export type DetailShot = {
  id: string;
  /** Active progress at which the shot is fully framed. */
  at: number;
  index: string;
  title: string;
  text: string;
  camera: { azimuth: number; elevation: number; distance: number; target: Vec3 };
};

const WIDE = { azimuth: 0, elevation: deg(3), distance: 6.6, target: [0, -0.02, 0] as Vec3 };

export const DETAIL_SHOTS: DetailShot[] = [
  {
    id: "dial",
    at: 0.14,
    index: "01",
    title: "The dial",
    text: "Sunburst green lacquer. Applied hour markers, each one filled with luminescent material that glows blue in the dark.",
    camera: { azimuth: deg(9), elevation: deg(7), distance: 1.9, target: [0.01, 0.05, 0.13] },
  },
  {
    id: "bezel",
    at: 0.31,
    index: "02",
    title: "Ceramic bezel",
    text: "Unidirectional 60-minute scale in scratch-resistant ceramic. The colour will not fade in sunlight or seawater.",
    camera: { azimuth: deg(-24), elevation: deg(26), distance: 1.6, target: [-0.12, 0.28, 0.12] },
  },
  {
    id: "date",
    at: 0.48,
    index: "03",
    title: "Cyclops lens",
    text: "A small magnifier set into the sapphire crystal enlarges the date at 3 o’clock two and a half times.",
    camera: { azimuth: deg(28), elevation: deg(9), distance: 1.3, target: [0.2, 0.0, 0.14] },
  },
  {
    id: "crown",
    at: 0.64,
    index: "04",
    title: "Screw-down crown",
    text: "Triple-sealed and screwed against the case, so the watch stays water resistant to 300 metres.",
    camera: { azimuth: deg(78), elevation: deg(6), distance: 1.35, target: [0.46, 0.0, 0.03] },
  },
  {
    id: "clasp",
    at: 0.82,
    index: "05",
    title: "Oyster bracelet",
    text: "Solid links and a folding safety clasp with a built-in extension, adjustable without tools.",
    camera: { azimuth: deg(172), elevation: deg(12), distance: 2.0, target: [0.0, -0.05, -1.45] },
  },
];

/* ---------------------------------------------------------------- keys */

type Cam = DetailShot["camera"];
const camKeys: { at: number; cam: Cam }[] = [
  { at: 0, cam: WIDE },
  ...DETAIL_SHOTS.map((s) => ({ at: s.at, cam: s.camera })),
  // Return: keep orbiting the same way round (172° → 360°) back to the front.
  { at: 0.95, cam: { ...WIDE, azimuth: Math.PI * 2 } },
  { at: 1, cam: { ...WIDE, azimuth: Math.PI * 2 } },
];

const scalar = (pick: (c: Cam) => number): Keyframe<number>[] => camKeys.map((k) => ({ at: k.at, value: pick(k.cam) }));

const tracks = {
  azimuth: scalarTrack(scalar((c) => c.azimuth)),
  elevation: scalarTrack(scalar((c) => c.elevation)),
  // Distance is interpolated in log space: a move from 6.6 to 1.5 feels like
  // a steady dolly instead of rushing in at the end.
  logDistance: scalarTrack(scalar((c) => Math.log(c.distance))),
  target: vec3Track(camKeys.map((k) => ({ at: k.at, value: k.cam.target }))),
};

/** Section progress (with holds) → active 0 → 1. */
export function detailsActive(p: number) {
  const { holdIn, holdOut } = DETAILS_TIMING;
  return Math.min(1, Math.max(0, (p - holdIn) / (1 - holdIn - holdOut)));
}

export function sampleDetailsPose(p: number, out: SequencePose): SequencePose {
  const a = detailsActive(p);
  out.position[0] = out.position[1] = out.position[2] = 0;
  // The watch holds its hero pose (−2π yaw from the showcase ≡ front).
  out.rotation[0] = 0;
  out.rotation[1] = 0;
  out.rotation[2] = 0;
  out.camera.azimuth = tracks.azimuth(a);
  out.camera.elevation = tracks.elevation(a);
  out.camera.distance = Math.exp(tracks.logDistance(a));
  tracks.target(a, out.camera.target);
  return out;
}

/** Index of the shot nearest to the current active progress (−1 while wide). */
export function activeShot(a: number) {
  let best = -1;
  let bestD = 0.075;
  DETAIL_SHOTS.forEach((s, i) => {
    const d = Math.abs(a - s.at);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Camera speed limits — slower than the showcase: macro moves read as heavy glass. */
export const advanceDetails = createAdvance(sampleDetailsPose, {
  degreesPerSecond: 90,
  unitsPerSecond: 1.6,
  progressPerSecond: 0.4,
});
