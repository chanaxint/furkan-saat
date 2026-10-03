"use client";

import { gsap } from "@/lib/gsap";
import type { Pose } from "./pose";
import type { ShowcaseState } from "./showcase";

/**
 * BRAND STAGE — a brand page that opens on its watch in 3D (Casio)
 * ----------------------------------------------------------------------------
 *   OPENING   the watch seen from the side, crown to the lens, the brand's
 *             name above it
 *   LOGO      one full diagonal turn into a close-up of the name on the dial
 *   BRACELET  another full diagonal turn, onto the bracelet
 *   AT REST   it settles to one side and sways gently by itself, behind the
 *             watches of the collection, which scroll in over it
 */

export type StagePoses = { intro: Pose; logo: Pose; bracelet: Pose; rest: Pose };
export type StageState = ShowcaseState & { idle: number };

export const createStageState = (poses: StagePoses): StageState => ({
  ...poses.intro,
  spinA: 0,
  spinB: 0,
  scale: 1,
  show: 1,
  idle: 0,
});

/** Timeline (seconds); the opening section is sized from END. */
export const STAGE_TIMES = { end: 7.6 } as const;

export function buildStageTimeline(s: StageState, poses: StagePoses, title?: HTMLElement | null) {
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  const turn = Math.PI * 2;

  // The name above the watch lifts away as the first turn begins.
  if (title) tl.to(title, { autoAlpha: 0, y: -70, duration: 1, ease: "power2.in" }, 0.1);

  // 1 One full diagonal turn into the close-up of the name on the dial.
  tl.to(s, { ...poses.logo, duration: 2 }, 0.3).to(s, { spinA: `+=${turn}`, duration: 2 }, 0.3);

  // 2 Another full diagonal turn, onto the bracelet.
  tl.to(s, { ...poses.bracelet, duration: 2 }, 3.2).to(s, { spinB: `+=${turn}`, duration: 2 }, 3.2);

  // 3 To one side, at rest, and the sway begins as the collection scrolls in.
  tl.to(s, { ...poses.rest, duration: 1.6 }, 5.9).to(s, { idle: 1, duration: 1.2, ease: "power1.inOut" }, 6.4);

  tl.set({}, {}, STAGE_TIMES.end);
  return tl;
}
