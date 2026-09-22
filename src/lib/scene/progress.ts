/**
 * Minimal mutable progress channels shared between the DOM (GSAP ScrollTrigger)
 * and the WebGL render loop (R3F useFrame). Writing to these never triggers a
 * React render — the render loop reads them every frame and damps towards them.
 */

export type ProgressChannel = {
  /** Raw scroll progress 0 → 1 written by ScrollTrigger. */
  target: number;
  /** Damped value, owned by the render loop. */
  current: number;
  /** Scroll velocity (px/s), useful for subtle inertia. */
  velocity: number;
  /** Whether the owning section is in (or near) the viewport. */
  active: boolean;
};

const make = (): ProgressChannel => ({ target: 0, current: 0, velocity: 0, active: false });

export const progress = {
  /** 01 Opening → 02 Reveal → 03 Features (one continuous stage). */
  story: make(),
  /** Watch showcase (after the box exit, before the exploded view). */
  showcase: make(),
  /** 04 Exploded View. */
  exploded: make(),
};

export type ProgressKey = keyof typeof progress;
