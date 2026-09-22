import type { Keyframe, Vec3 } from "./keyframes";

/**
 * Smooth keyframe curves (cubic Hermite, Catmull-Rom tangents).
 *
 * Unlike per-segment smoothstep — which brakes to a stop at every key and
 * reads as mechanical — a Hermite curve passes *through* each key with a
 * continuous velocity, so a move from front → ¾ → profile flows like a single
 * camera/product move. The first and last keys get zero tangents, so the
 * sequence eases out of its start pose and settles into its end pose.
 */

function tangent(keys: Keyframe<number>[], i: number) {
  if (i === 0 || i === keys.length - 1) return 0;
  const a = keys[i - 1];
  const b = keys[i + 1];
  return (b.value - a.value) / (b.at - a.at || 1);
}

export function hermiteScalar(keys: Keyframe<number>[], p: number) {
  const n = keys.length;
  if (p <= keys[0].at) return keys[0].value;
  if (p >= keys[n - 1].at) return keys[n - 1].value;
  let i = 0;
  while (i < n - 2 && p > keys[i + 1].at) i++;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const h = k1.at - k0.at || 1;
  const t = (p - k0.at) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  const m0 = tangent(keys, i) * h;
  const m1 = tangent(keys, i + 1) * h;
  return (
    (2 * t3 - 3 * t2 + 1) * k0.value + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * k1.value + (t3 - t2) * m1
  );
}

/** Splits a Vec3 track into three scalar tracks once, then samples them. */
export function vec3Track(keys: Keyframe<Vec3>[]) {
  const axes = [0, 1, 2].map((a) => keys.map((k) => ({ at: k.at, value: k.value[a] })));
  return (p: number, out: Vec3 = [0, 0, 0]): Vec3 => {
    out[0] = hermiteScalar(axes[0], p);
    out[1] = hermiteScalar(axes[1], p);
    out[2] = hermiteScalar(axes[2], p);
    return out;
  };
}

export function scalarTrack(keys: Keyframe<number>[]) {
  return (p: number) => hermiteScalar(keys, p);
}
