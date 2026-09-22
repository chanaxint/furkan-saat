/**
 * Scroll-keyframe utilities shared by every 3D scene.
 * Keyframes are authored against a normalised progress value (0 → 1)
 * and sampled with a smooth ease between neighbours.
 */

export type Vec3 = [number, number, number];

export type Keyframe<T> = { at: number; value: T };

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Hermite ease — slow in / slow out, used between keyframes. */
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Map `p` into the local 0 → 1 range of [start, end]. */
export const range = (p: number, start: number, end: number) =>
  clamp01((p - start) / (end - start));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function locate<T>(keys: Keyframe<T>[], p: number) {
  if (p <= keys[0].at) return { a: keys[0], b: keys[0], t: 0 };
  const last = keys[keys.length - 1];
  if (p >= last.at) return { a: last, b: last, t: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p >= a.at && p <= b.at) {
      return { a, b, t: smooth((p - a.at) / (b.at - a.at || 1)) };
    }
  }
  return { a: last, b: last, t: 0 };
}

export function sampleScalar(keys: Keyframe<number>[], p: number) {
  const { a, b, t } = locate(keys, p);
  return lerp(a.value, b.value, t);
}

export function sampleVec3(keys: Keyframe<Vec3>[], p: number, out: Vec3 = [0, 0, 0]): Vec3 {
  const { a, b, t } = locate(keys, p);
  out[0] = lerp(a.value[0], b.value[0], t);
  out[1] = lerp(a.value[1], b.value[1], t);
  out[2] = lerp(a.value[2], b.value[2], t);
  return out;
}
