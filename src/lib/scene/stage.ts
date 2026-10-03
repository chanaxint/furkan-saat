"use client";

import { gsap } from "@/lib/gsap";
import type { Pose } from "./pose";
import type { ShowcaseState } from "./showcase";

/**
 * BRAND STAGE — a brand page that opens on its watch in 3D (Casio)
 * ----------------------------------------------------------------------------
 *   OPENING   the watch seen from the side, crown to the lens, the brand's
 *             name above it
 *   LOGO      one slow, full diagonal turn into the name on the dial; its
 *             line arrives beside it
 *   BRACELET  another slow, full diagonal turn onto the bracelet, with its line
 *   EXIT      the watch drifts back and fades as the collection arrives
 *
 * A full turn takes about two screens of scrolling, so it reads as a turn,
 * not a spin.
 */

export type StagePoses = { intro: Pose; logo: Pose; bracelet: Pose; exit: Pose };
export type StageLine = { side: "left" | "right"; title: string; accent: string; text: string };
export type StageState = ShowcaseState;

export const createStageState = (poses: StagePoses): StageState => ({
  ...poses.intro,
  spinA: 0,
  spinB: 0,
  scale: 1,
  show: 1,
});

/** Timeline (seconds); the opening section is sized from END. */
export const STAGE_TIMES = {
  logo: { at: 0.4, dur: 3.2 },
  bracelet: { at: 5.6, dur: 3.2 },
  exit: { at: 10.6, dur: 1.4 },
  end: 12.2,
} as const;

export function buildStageTimeline(
  s: StageState,
  poses: StagePoses,
  dom: { title?: HTMLElement | null; lines?: (HTMLElement | null)[] } = {},
) {
  const T = STAGE_TIMES;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  const turn = Math.PI * 2;

  // The name above the watch lifts away as the first turn begins.
  if (dom.title) tl.to(dom.title, { autoAlpha: 0, y: -70, duration: 1, ease: "power2.in" }, 0.1);

  // A line slides in from its side as its turn settles, and leaves before the next.
  const line = (el: HTMLElement | null | undefined, side: "left" | "right", inAt: number, outAt: number) => {
    if (!el) return;
    const from = side === "left" ? -50 : 50;
    tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" }, inAt);
    tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.6, ease: "power2.in" }, outAt);
  };

  // 1 A full diagonal turn into the name on the dial.
  tl.to(s, { ...poses.logo, duration: T.logo.dur }, T.logo.at).to(s, { spinA: `+=${turn}`, duration: T.logo.dur }, T.logo.at);
  line(dom.lines?.[0], "left", T.logo.at + T.logo.dur - 0.6, T.bracelet.at - 0.3);

  // 2 Another full diagonal turn, onto the bracelet.
  tl.to(s, { ...poses.bracelet, duration: T.bracelet.dur }, T.bracelet.at).to(
    s,
    { spinB: `+=${turn}`, duration: T.bracelet.dur },
    T.bracelet.at,
  );
  line(dom.lines?.[1], "right", T.bracelet.at + T.bracelet.dur - 0.6, T.exit.at - 0.2);

  // 3 The watch drifts back and fades as the collection arrives.
  tl.to(s, { ...poses.exit, duration: T.exit.dur }, T.exit.at).to(
    s,
    { show: 0, duration: T.exit.dur * 0.8, ease: "power1.in" },
    T.exit.at + 0.2,
  );

  tl.set({}, {}, T.end);
  return tl;
}
