/**
 * Critically-damped spring — the "physical" feel of the showcase.
 *
 * Scroll writes a target; the spring carries the displayed value there with
 * inertia and no overshoot. When scrolling stops the value settles exactly on
 * the target and stays there (no idle motion). A velocity cap guarantees that
 * even a violent scroll or an anchor jump never makes the object "teleport".
 */
export type Spring = { value: number; velocity: number };

export const createSpring = (value = 0): Spring => ({ value, velocity: 0 });

export function stepSpring(
  s: Spring,
  target: number,
  dt: number,
  { frequency = 5, maxVelocity = 0.5 }: { frequency?: number; maxVelocity?: number } = {},
) {
  // Sub-step for stability on long frames (tab switches, slow devices).
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const w = frequency;
  for (let i = 0; i < steps; i++) {
    const accel = w * w * (target - s.value) - 2 * w * s.velocity;
    s.velocity += accel * h;
    if (s.velocity > maxVelocity) s.velocity = maxVelocity;
    if (s.velocity < -maxVelocity) s.velocity = -maxVelocity;
    s.value += s.velocity * h;
  }
  // Snap when visually at rest so the frame is truly still.
  if (Math.abs(target - s.value) < 1e-4 && Math.abs(s.velocity) < 1e-3) {
    s.value = target;
    s.velocity = 0;
  }
  return s.value;
}
