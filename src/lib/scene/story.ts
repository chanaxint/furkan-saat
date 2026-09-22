import type { Keyframe, Vec3 } from "./keyframes";

/**
 * THE WATCH STORY — choreography for sections 01 → 03
 * ----------------------------------------------------------------------------
 * One continuous camera move across three chapters on a single sticky stage:
 *
 *   01 OPENING   hand turned away, watch hidden in shadow → hand rotates,
 *                camera approaches, watch catches the light, hand leaves frame
 *   02 REVEAL    the watch alone becomes the hero object; slow orbit + zoom
 *   03 FEATURES  watch holds centre while editorial annotations surround it
 *
 * All values are authored in normalised story progress (0 → 1). When the real
 * GLB/GLTF assets arrive, only these keyframes need tuning — the components
 * read them verbatim.
 */

export const CHAPTERS = {
  opening: [0, 0.34],
  reveal: [0.34, 0.62],
  features: [0.62, 1],
} as const satisfies Record<string, readonly [number, number]>;

/** Camera position / look-at / fov. */
export const CAMERA: {
  position: Keyframe<Vec3>[];
  target: Keyframe<Vec3>[];
  fov: Keyframe<number>[];
} = {
  // Distances are chosen so the ~2-unit placeholder reads at: ~35% of the
  // viewport height in the opening, ~70% in the reveal, ~55% for features.
  position: [
    { at: 0.0, value: [3.4, 1.7, 9.8] },
    { at: 0.16, value: [2.1, 0.95, 7.8] },
    { at: 0.34, value: [0.25, 0.2, 6.9] },
    { at: 0.47, value: [-2.2, 0.8, 6.4] },
    { at: 0.62, value: [0.0, 0.1, 8.6] },
    { at: 1.0, value: [0.0, 0.0, 9.0] },
  ],
  target: [
    { at: 0.0, value: [0.4, -0.2, 0] },
    { at: 0.34, value: [0, 0, 0] },
    { at: 1.0, value: [0, 0, 0] },
  ],
  fov: [
    { at: 0.0, value: 32 },
    { at: 0.34, value: 28 },
    { at: 0.62, value: 26 },
    { at: 1.0, value: 26 },
  ],
};

/**
 * Hand rig — the wrist carrying the watch. The watch is parented to the hand
 * until the hand leaves frame (see WATCH.detachAt).
 */
export const HAND = {
  rotation: [
    { at: 0.0, value: [0.25, Math.PI * 0.92, -0.18] }, // back of hand to camera
    { at: 0.18, value: [0.1, Math.PI * 0.35, -0.08] }, // wrist turning
    { at: 0.28, value: [0.0, 0.0, 0.0] }, // dial toward camera
  ] as Keyframe<Vec3>[],
  position: [
    { at: 0.0, value: [0.3, -0.35, 0] },
    { at: 0.26, value: [0, 0, 0] },
    { at: 0.3, value: [0, 0, 0] },
    { at: 0.4, value: [0.2, -3.2, -0.6] }, // hand exits frame downward
  ] as Keyframe<Vec3>[],
} as const;

export const WATCH = {
  /** Story progress at which the watch detaches from the hand. */
  detachAt: 0.3,
  rotation: [
    { at: 0.34, value: [0.0, 0.0, 0.0] },
    { at: 0.48, value: [0.32, -0.55, 0.08] }, // three-quarter profile
    { at: 0.62, value: [0.08, 0.18, 0.0] },
    { at: 0.82, value: [-0.12, -0.22, 0.0] },
    { at: 0.9, value: [-0.05, -0.1, 0.0] },
    // Hand-off to 04: settle into the tilted presentation pose of the exploded view.
    { at: 1.0, value: [-0.85, -0.45, 0.12] },
  ] as Keyframe<Vec3>[],
  scale: [
    { at: 0.0, value: 0.82 },
    { at: 0.34, value: 1.0 },
    { at: 0.62, value: 1.06 },
    { at: 0.9, value: 1.0 },
    { at: 1.0, value: 0.86 },
  ] as Keyframe<number>[],
  /** Idle breathing applied on top of the scroll pose (radians). */
  idleAmplitude: 0.035,
};

/** Key light intensity — the watch literally "catches the light". */
export const LIGHT = {
  key: [
    { at: 0.0, value: 0.15 },
    { at: 0.2, value: 1.1 },
    { at: 0.34, value: 2.2 },
    { at: 1.0, value: 2.0 },
  ] as Keyframe<number>[],
  surfaceOpacity: [
    { at: 0.0, value: 1 },
    { at: 0.3, value: 1 },
    { at: 0.42, value: 0 },
  ] as Keyframe<number>[],
};
