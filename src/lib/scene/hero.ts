"use client";

import { gsap } from "@/lib/gsap";
import { HERO_VIDEO } from "./heroTrack";

/**
 * HERO FILM — the opening of the site
 * ----------------------------------------------------------------------------
 * A filmed shot (camera pulling back from the empty cushion of a watch box,
 * played frame-by-frame by scroll) with the real 3D watch composited into it.
 * One GSAP timeline, scrubbed by scroll (`scrub: 1`), animates a plain state
 * object; the 2D frame canvas, the WebGL scene and the DOM copy only read it.
 *
 *   1  SEATED      the watch sits on the cushion, tracked to the footage
 *                  (placement tuned on /kontrol, stored in seat.json)
 *   2  LIFT        as the camera pulls back, the watch rises off the cushion
 *                  and comes large to the lens; the footage dissolves into
 *                  the house green
 *   3  FEATURES    four lines arrive in turn, and for each one the watch
 *                  turns (diagonally) to show that part:
 *                  Oyster Kasa → case flank · Perpetual Mekanizma → caseback
 *                  Cerachrom Çerçeve → bezel close-up · Oyster Bileklik → bracelet
 *   4  HANDOVER    one diagonal spin into the Patek Philippe; its brand and
 *                  model appear beneath it
 *
 * Each turn is sized to roughly one scroll gesture; `scrub: 1` smooths it.
 *
 * Rotation rule: no pure horizontal or pure vertical turns. Spins run about
 * the two diagonal axes below; look-turns always combine yaw *and* pitch.
 */

const deg = (d: number) => (d * Math.PI) / 180;

/** Camera of the WebGL layer (sits at the origin, looking down −Z). */
export const HERO_FOV = 30;

/** Diagonal spin axes, in camera space. */
export const SPIN_AXIS_A: [number, number, number] = [0.68, 0.68, 0.27];
export const SPIN_AXIS_B: [number, number, number] = [-0.66, 0.7, 0.27];

type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number };

export type FeatureLine = {
  id: string;
  /** Name of the part; `accent` is set in italic champagne. */
  title: string;
  accent: string;
  text: string;
  /** Side of the screen the line sits on (the watch moves to the other side). */
  side: "left" | "right";
  /** Pose that shows this part to the camera. */
  pose: Pose;
};

/**
 * The feature beats. Yaw keeps turning the same way (0 → −52° → −128° →
 * −372°), so each change reads as one continuous diagonal turn.
 */
export const HERO_LINES: FeatureLine[] = [
  {
    id: "case",
    title: "Oyster Kasa",
    accent: "Kasa",
    text: "Tek blok çelikten işlenmiş, vidalı arka kapak ve kurma koluyla hermetik olarak kapalı.",
    side: "left",
    pose: { x: 0.62, y: 0, z: -2.7, yaw: deg(-52), pitch: deg(16), roll: deg(-5) },
  },
  {
    id: "movement",
    title: "Perpetual Mekanizma",
    accent: "Mekanizma",
    text: "Bileğin hareketiyle kurulan otomatik kalibre; kapalı arka kapağın ardında, hassasiyetle ayarlı.",
    side: "right",
    // Oblique enough that the clasp passes beside the caseback, not across it.
    pose: { x: -0.92, y: 0.05, z: -4.0, yaw: deg(-128), pitch: deg(-14), roll: deg(8) },
  },
  {
    id: "bezel",
    title: "Cerachrom Çerçeve",
    accent: "Çerçeve",
    text: "Tek yönlü dönen seramik çerçeve; rengi güneşte ve deniz suyunda solmaz.",
    side: "left",
    pose: { x: 0.36, y: -0.08, z: -1.6, yaw: deg(-372), pitch: deg(38), roll: deg(4) },
  },
  {
    id: "bracelet",
    title: "Oyster Bileklik",
    accent: "Bileklik",
    text: "Masif baklalar ve katlanır güvenlik kilidi; aletsiz uzatma sistemiyle.",
    side: "right",
    pose: { x: -0.55, y: 0.3, z: -2.6, yaw: deg(-385), pitch: deg(74), roll: 0 },
  },
];

/** Shown beneath the Patek Philippe after the handover. */
export const HERO_FINALE = { brand: "Patek Philippe", model: "Grand Complications Celestial", reference: "Ref. 6102P" };

export type HeroState = {
  /** Footage frame (float, 0 → frames − 1). */
  frame: number;
  /** Footage visibility (1 = film, 0 = house green). */
  film: number;
  /** 1 = watch on the cushion (tracked), 0 = free in camera space. */
  seat: number;
  /** Rise off the cushion along the table normal (scene units). */
  lift: number;
  /** Free pose, camera space. */
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  /** Spins about the diagonal axes (radians, multiples of 2π at rest). */
  spinA: number;
  spinB: number;
  scale: number;
  /** 0 = Rolex, 1 = Patek Philippe (cross-fades around 0.5). */
  swap: number;
  /** Momentary light bloom during the handover. */
  flash: number;
};

export const createHeroState = (): HeroState => ({
  frame: 0,
  film: 1,
  seat: 1,
  lift: 0,
  x: 0,
  y: 0,
  z: -3.5,
  yaw: 0,
  pitch: 0,
  roll: 0,
  spinA: 0,
  spinB: 0,
  scale: 1,
  swap: 0,
  flash: 0,
});

/** Timeline times (seconds). Scroll length ≈ 60svh per second, so a turn ≈ one scroll gesture. */
export const HERO_BEATS = {
  film: { at: 0.3, dur: 5.0 },
  lift: { at: 1.1, dur: 1.4 },
  toLens: { at: 2.0, dur: 2.4 },
  fade: { at: 4.0, dur: 1.2 },
  /** Feature beats: the watch turns (dur), the line shows while it holds. */
  features: { first: 4.8, every: 2.4, turn: 1.3 },
  handover: { at: 14.6, dur: 1.8 },
  end: 18.2,
} as const;

type Dom = { cue?: Element | null; lines?: (Element | null)[]; finale?: Element | null };

export function buildHeroTimeline(s: HeroState, dom: Dom = {}) {
  const B = HERO_BEATS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1–2 Footage: the camera pulls back; the watch lifts and comes to the lens.
  tl.to(s, { frame: HERO_VIDEO.frames - 1, duration: B.film.dur, ease: "power1.inOut" }, B.film.at);
  if (dom.cue) tl.to(dom.cue, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, B.film.at);
  tl.to(s, { lift: 0.9, duration: B.lift.dur, ease: "power2.out" }, B.lift.at)
    .to(s, { seat: 0, duration: B.toLens.dur }, B.toLens.at)
    .to(s, { film: 0, duration: B.fade.dur, ease: "power1.inOut" }, B.fade.at);

  // 3 Features: turn to the part, then the line arrives and holds.
  const F = B.features;
  HERO_LINES.forEach((line, i) => {
    const at = F.first + i * F.every;
    tl.to(s, { ...line.pose, duration: F.turn }, at);
    const el = dom.lines?.[i];
    if (!el) return;
    const from = line.side === "left" ? -50 : 50;
    tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, at + F.turn * 0.55);
    tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.5, ease: "power2.in" }, at + F.every - 0.35);
  });

  // 4 Handover: back to the front while spinning once on the diagonal; the
  //   models cross-fade at peak speed behind a soft bloom.
  const H = B.handover;
  const mid = H.at + H.dur / 2;
  tl.to(s, { x: 0, y: 0.22, z: -3.4, yaw: deg(-360), pitch: 0, roll: 0, duration: H.dur }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { scale: 0.82, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 1, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { swap: 1, duration: 0.36, ease: "none" }, mid - 0.18)
    .to(s, { flash: 1, duration: 0.25, ease: "power2.in" }, mid - 0.25)
    .to(s, { flash: 0, duration: 0.6, ease: "power2.out" }, mid);
  if (dom.finale)
    tl.fromTo(dom.finale, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, mid + 0.2);

  // Hold on the Patek Philippe with its name.
  tl.set({}, {}, B.end);
  return tl;
}
