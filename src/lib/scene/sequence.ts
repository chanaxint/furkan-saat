import type { Vec3 } from "./keyframes";
import { stepSpring, type Spring } from "./spring";

/**
 * Shared engine for scroll-driven model sequences (showcase, details, …).
 *
 * A sequence is a pure function `sample(p, out)` from section progress to a
 * pose (model transform + camera orbit). `createAdvance` wraps a critically
 * damped spring whose speed limit adapts to how much the *picture* changes,
 * so no scroll speed can make the model or the camera jump.
 */

export type SequencePose = {
  /** Model position (scene units). */
  position: Vec3;
  /** Model rotation [tilt, yaw, roll], Euler XYZ. */
  rotation: Vec3;
  /** Camera orbit around the look-at point. */
  camera: { azimuth: number; elevation: number; distance: number; target: Vec3 };
};

export type SequenceSampler = (p: number, out: SequencePose) => SequencePose;

export const createPose = (distance = 6.6): SequencePose => ({
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  camera: { azimuth: 0, elevation: 0, distance, target: [0, 0, 0] },
});

export type SpeedLimits = {
  /** Max visible rotation (model or camera orbit), degrees per second. */
  degreesPerSecond: number;
  /** Max travel of model, camera or look-at point, scene units per second. */
  unitsPerSecond: number;
  /** Absolute cap on progress speed (per second). */
  progressPerSecond: number;
};

export function createAdvance(sample: SequenceSampler, speed: SpeedLimits) {
  const a = createPose();
  const b = createPose();
  const e = 0.004;

  /** How much the picture changes per unit of progress around `p`. */
  function density(p: number) {
    sample(Math.max(0, p - e), a);
    sample(Math.min(1, p + e), b);
    let rot = Math.max(
      Math.abs(b.camera.azimuth - a.camera.azimuth),
      Math.abs(b.camera.elevation - a.camera.elevation),
    );
    let pos = Math.abs(b.camera.distance - a.camera.distance);
    for (let k = 0; k < 3; k++) {
      rot = Math.max(rot, Math.abs(b.rotation[k] - a.rotation[k]));
      pos = Math.max(
        pos,
        Math.abs(b.position[k] - a.position[k]),
        Math.abs(b.camera.target[k] - a.camera.target[k]),
      );
    }
    const span = 2 * e;
    return { degrees: (rot * 180) / Math.PI / span, units: pos / span };
  }

  return function advance(spring: Spring, target: number, dt: number) {
    const { degrees, units } = density(spring.value);
    const maxVelocity = Math.min(
      speed.progressPerSecond,
      degrees > 0 ? speed.degreesPerSecond / degrees : Infinity,
      units > 0 ? speed.unitsPerSecond / units : Infinity,
    );
    return stepSpring(spring, target, dt, { maxVelocity: Math.max(0.02, maxVelocity) });
  };
}
