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
  /** Set by an on-demand canvas: request a frame (called on scroll). */
  wake?: () => void;
  /** Called by the render loop with the *smoothed* progress each frame, so
   *  DOM layers (captions, kinetic type) move in lock-step with the 3D. */
  onFrame?: (p: number) => void;
};

const make = (): ProgressChannel => ({ target: 0, current: 0, velocity: 0, active: false });

export const progress = {
  /** Box intro (scrubbed GSAP timeline; only `wake` is used). */
  intro: make(),
  /** Watch showcase (after the box exit, before the exploded view). */
  showcase: make(),
  /** Macro detail pass (stands in for the exploded view for now). */
  details: make(),
  /** 04 Exploded View. */
  exploded: make(),
};

export type ProgressKey = keyof typeof progress;
