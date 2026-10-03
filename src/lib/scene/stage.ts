"use client";

import { gsap } from "@/lib/gsap";
import type { StageMotion, StagePoseDeg } from "@/lib/data/stages";
import { type Pose, pose } from "./pose";
import type { ShowcaseState } from "./showcase";

/**
 * BRAND STAGE — a brand page that opens on its watch in 3D (Casio)
 * ----------------------------------------------------------------------------
 *   OPENING   the watch seen from the side, crown to the lens, the brand's
 *             name above it
 *   LOGO      full diagonal turn(s) into the name on the dial; its line arrives
 *   BRACELET  full diagonal turn(s) onto the bracelet, with its line
 *   EXIT      the watch drifts back and fades as the collection arrives
 *
 * Poses, timings and turns come from lib/data/stages.json (/yonetim/donusler).
 */

export type StageState = ShowcaseState;
export const toPose = (p: StagePoseDeg): Pose => pose(p.x, p.y, p.z, p.yaw, p.pitch, p.roll);

export const createStageState = (m: StageMotion): StageState => ({
  ...toPose(m.poses.intro),
  spinA: 0,
  spinB: 0,
  scale: 1,
  show: 1,
});

export function buildStageTimeline(
  s: StageState,
  m: StageMotion,
  dom: { title?: HTMLElement | null; lines?: (HTMLElement | null)[] } = {},
) {
  const T = m.times;
  const P = { logo: toPose(m.poses.logo), bracelet: toPose(m.poses.bracelet), exit: toPose(m.poses.exit) };
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  const turn = Math.PI * 2;

  // The name above the watch lifts away as the first turn begins.
  if (dom.title) tl.to(dom.title, { autoAlpha: 0, y: -70, duration: 1, ease: "power2.in" }, Math.max(0, T.logo.at - 0.3));

  // A line slides in from its side as its turn settles, and leaves before the next.
  const line = (el: HTMLElement | null | undefined, side: "left" | "right", inAt: number, outAt: number) => {
    if (!el) return;
    const from = side === "left" ? -50 : 50;
    tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.8, ease: "power3.out" }, inAt);
    tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.6, ease: "power2.in" }, Math.max(inAt + 0.9, outAt));
  };

  // 1 Turn(s) into the name on the dial.
  tl.to(s, { ...P.logo, duration: T.logo.dur }, T.logo.at).to(s, { spinA: `+=${turn * m.spins.logo}`, duration: T.logo.dur }, T.logo.at);
  line(dom.lines?.[0], "left", T.logo.at + T.logo.dur - 0.6, T.bracelet.at - 0.3);

  // 2 Turn(s) onto the bracelet.
  tl.to(s, { ...P.bracelet, duration: T.bracelet.dur }, T.bracelet.at).to(
    s,
    { spinB: `+=${turn * m.spins.bracelet}`, duration: T.bracelet.dur },
    T.bracelet.at,
  );
  line(dom.lines?.[1], "right", T.bracelet.at + T.bracelet.dur - 0.6, T.exit.at - 0.2);

  // 3 Back and away, fading as the collection arrives.
  tl.to(s, { ...P.exit, duration: T.exit.dur }, T.exit.at).to(s, { show: 0, duration: T.exit.dur * 0.8, ease: "power1.in" }, T.exit.at + 0.2);

  tl.set({}, {}, Math.max(T.end, T.exit.at + T.exit.dur));
  return tl;
}
