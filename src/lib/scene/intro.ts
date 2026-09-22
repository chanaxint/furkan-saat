"use client";

import type { Vec3 } from "./keyframes";
import { gsap } from "@/lib/gsap";

/**
 * BOX INTRO — cinematic opening sequence
 * ----------------------------------------------------------------------------
 * One GSAP timeline (scrubbed by scroll, `scrub: 1`) animates a plain state
 * object; the R3F scene reads that object every frame and applies it to the
 * camera, the lid pivot and the watch. Nothing in the scene animates itself.
 *
 *   0  Top-down view on the closed box (invisible table, soft contact shadow)
 *   1  Camera descends to a front-diagonal three-quarter view — box closed
 *   2  Lid swings open about its hinge (X axis)
 *   3  Camera eases in on the watch resting on the cushion
 *   4  The watch lifts out, comes to the lens until it almost fills the frame,
 *      turns right (right profile), then left (left profile)
 *   5  It spins (+4π on Y) while flying back, away from the camera
 *   →  The last frame equals the first frame of the Showcase section
 *      (SHOWCASE_ENTRY_POSE), which continues the sequence from there.
 *
 * World units: the box is scaled by ASSETS.intro.box.scale (2.7) so the watch
 * keeps scale 1 — the same scale as in the Showcase.
 */

const deg = (d: number) => (d * Math.PI) / 180;

/** Absolute lid angles about the hinge's X axis (radians). */
export const LID = { closed: 1.42, open: -0.12 };

/** Watch head resting on the cushion: dial up, bracelet around the cushion. */
export const WATCH_IN_BOX = { position: [0, -0.94, 0.675] as Vec3, rotation: [-Math.PI / 2, 0, 0] as Vec3 };

/** Where the lifted watch hovers in front of the lens. */
export const WATCH_HOVER: Vec3 = [0, 0.9, 1.8];

/** How far the watch flies back during the spin (scene units). */
export const RETREAT = 3.4 + 2.5 + 1.7;

export const INTRO_FOV = 24;

export type IntroState = {
  /** Orbit around (tx, ty, tz). `follow` 0 → 1 slides the aim from that point onto the watch. */
  cam: { azimuth: number; elevation: number; distance: number; tx: number; ty: number; tz: number; follow: number };
  lid: number;
  /** Box opacity — fades out while the watch fills the frame, so the retreat
   *  happens in clear space instead of through the open lid. */
  box: number;
  watch: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
};

export const createIntroState = (): IntroState => ({
  // Frame 0 — bird's-eye view straight down on the closed box.
  cam: { azimuth: 0, elevation: deg(89.2), distance: 19, tx: 0, ty: -1.3, tz: 0.15, follow: 0 },
  lid: LID.closed,
  box: 1,
  watch: {
    x: WATCH_IN_BOX.position[0],
    y: WATCH_IN_BOX.position[1],
    z: WATCH_IN_BOX.position[2],
    rx: WATCH_IN_BOX.rotation[0],
    ry: 0,
    rz: 0,
  },
});

/**
 * Step timing (timeline seconds). Every step is placed at an explicit time so
 * no step can start early — the ScrollTrigger maps the whole timeline onto
 * the section's scroll length.
 */
export const INTRO_STEPS = {
  descent: { at: 0.4, dur: 2.4 },
  open: { at: 2.95, dur: 1.7 },
  zoom: { at: 4.7, dur: 1.9 },
  rise: { at: 6.65, dur: 2.2 },
  right: { at: 8.95, dur: 1.1 },
  left: { at: 10.05, dur: 1.5 },
  retreat: { at: 11.6, dur: 2.3 },
  end: 14.3,
} as const;

/** Build the master timeline. */
export function buildIntroTimeline(
  s: IntroState,
  dom: { title?: Element | null; cue?: Element | null; captions?: Element[] } = {},
) {
  const T = INTRO_STEPS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1 — Camera descent: top-down → front-diagonal. Box stays closed.
  tl.to(
    s.cam,
    { elevation: deg(27), azimuth: deg(24), distance: 15, ty: -1.4, tz: 0.35, duration: T.descent.dur },
    T.descent.at,
  );
  const intro = [dom.title, dom.cue].filter(Boolean) as Element[];
  if (intro.length) tl.to(intro, { autoAlpha: 0, y: -24, duration: 0.8, ease: "power1.in" }, T.descent.at);

  // 2 — Lid opens, lying back about its hinge (X axis). Camera holds.
  tl.to(s, { lid: LID.open, duration: T.open.dur }, T.open.at);

  // 3 — Slow push-in on the watch resting on the cushion.
  tl.to(
    s.cam,
    {
      azimuth: deg(12),
      elevation: deg(42),
      distance: 3.6,
      tx: WATCH_IN_BOX.position[0],
      ty: WATCH_IN_BOX.position[1],
      tz: WATCH_IN_BOX.position[2],
      duration: T.zoom.dur,
    },
    T.zoom.at,
  );

  // 4 — Lift-out: up first, then toward the lens; the dial turns to camera.
  tl.to(s.watch, { y: WATCH_HOVER[1], duration: T.rise.dur }, T.rise.at)
    .to(s.watch, { z: WATCH_HOVER[2], duration: T.rise.dur - 0.2, ease: "power3.inOut" }, T.rise.at + 0.2)
    .to(s.watch, { rx: 0, duration: T.rise.dur - 0.2 }, T.rise.at + 0.15)
    .to(
      s.cam,
      {
        azimuth: 0,
        elevation: deg(8),
        distance: 2.5, // watch head ≈ 90% of the frame height
        tx: WATCH_HOVER[0],
        ty: WATCH_HOVER[1],
        tz: WATCH_HOVER[2],
        duration: T.rise.dur,
      },
      T.rise.at,
    );

  // 4b — Detail show: right profile, then left profile.
  tl.to(s.watch, { ry: deg(36), duration: T.right.dur, ease: "sine.inOut" }, T.right.at).to(
    s.watch,
    { ry: deg(-36), duration: T.left.dur, ease: "sine.inOut" },
    T.left.at,
  );

  // The box quietly leaves while the watch fills the frame.
  tl.to(s, { box: 0, duration: T.left.dur, ease: "power1.inOut" }, T.right.at + 0.3);

  // 5 — Spin (+4π) while flying back, away from the lens. The camera stays
  //     put and only re-aims onto the watch, which ends centred ~10 units
  //     away, dial front — the Showcase entry frame.
  tl.to(s.watch, { ry: Math.PI * 4, duration: T.retreat.dur }, T.retreat.at)
    .to(s.watch, { z: WATCH_HOVER[2] - RETREAT, duration: T.retreat.dur, ease: "power2.in" }, T.retreat.at)
    .to(s.cam, { follow: 1, duration: T.retreat.dur, ease: "power2.in" }, T.retreat.at);

  // Hold the hand-off frame briefly.
  tl.set({}, {}, T.end);

  // Captions (optional DOM): each shows during its step.
  const beats: [number, number][] = [
    [T.open.at, T.open.dur],
    [T.rise.at, T.rise.dur],
    [T.right.at, T.right.dur + T.left.dur],
  ];
  beats.forEach(([at, len], i) => {
    const el = dom.captions?.[i];
    if (!el) return;
    tl.fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power1.out" }, at);
    tl.to(el, { autoAlpha: 0, y: -8, duration: 0.4, ease: "power1.in" }, at + len - 0.3);
  });

  return tl;
}
