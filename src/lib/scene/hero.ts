"use client";

import { gsap } from "@/lib/gsap";
import { HERO_VIDEO } from "./heroTrack";
import { MOVEMENT_FILM } from "./movement";

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
 *                  turns (diagonally) to show that part (for the movement it
 *                  zooms onto a film that separates the parts on scroll):
 *                  Oyster Kasa → case flank · Perpetual Mekanizma → caseback
 *                  Cerachrom Çerçeve → bezel close-up · Oyster Bileklik → bracelet
 *   4  HANDOVER    one diagonal spin into the Patek Philippe with the line
 *                  "İstediğiniz her saat" and its name beneath it; then three
 *                  shorter Patek feature beats (sky chart, strap, platinum case)
 *   5  OUTRO       "ve daha fazlası": the watch spins away and the page continues
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

/** Shown with the handover: the line, then the Patek Philippe's name beneath it. */
export const HERO_FINALE = {
  line: "İstediğiniz her saat",
  accent: "saat",
  brand: "Patek Philippe",
  model: "Grand Complications Celestial",
  reference: "Ref. 6102P",
};

/**
 * Patek Philippe 6102P feature beats (shorter than the Rolex's). Facts from
 * patek.com and dealer listings: 44 mm platinum case, sapphire sky-chart dial
 * with moon phases and orbit, calibre 240 LU CL C (315 parts, 22k gold
 * mini-rotor), navy alligator strap with platinum fold-over clasp.
 * Yaw continues from the handover's front pose (−360°).
 */
export const PATEK_LINES: FeatureLine[] = [
  {
    id: "sky",
    title: "Gökyüzü Haritası",
    accent: "Haritası",
    text: "Safir kadranın ardında dönen yıldız haritası; Ay'ın evrelerini ve gökteki yolculuğunu gösterir.",
    side: "left",
    pose: { x: 0.36, y: -0.06, z: -1.65, yaw: deg(-372), pitch: deg(26), roll: deg(4) },
  },
  {
    id: "strap",
    title: "Timsah Deri Kordon",
    accent: "Kordon",
    text: "Parlak lacivert timsah derisi, platin katlanır tokayla.",
    side: "right",
    pose: { x: -0.92, y: 0.05, z: -4.0, yaw: deg(-488), pitch: deg(-14), roll: deg(8) },
  },
  {
    id: "platinum",
    title: "Platin Kasa",
    accent: "Kasa",
    text: "44 mm platin kasa; içinde 315 parçalı, altın mini rotorlu 240 LU CL C kalibre.",
    side: "left",
    pose: { x: 0.62, y: 0, z: -2.7, yaw: deg(-412), pitch: deg(16), roll: deg(-5) },
  },
];

/** Every feature line in order (Rolex, then Patek Philippe). */
export const ALL_LINES: FeatureLine[] = [...HERO_LINES, ...PATEK_LINES];

/** Closing line before the home page continues. */
export const HERO_OUTRO = { line: "ve daha fazlası", accent: "fazlası" };

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
  /** 0 → 1: zoom the camera onto the movement film's exact framing. */
  lock: number;
  /** Movement film frame (float, 0 → 119) and its visibility. */
  mech: number;
  mechFilm: number;
  /** 1 = hide the 3D watch (while the film is on screen). */
  hide: number;
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
  lock: 0,
  mech: 0,
  mechFilm: 0,
  hide: 0,
});

/** Timeline times (seconds). Scroll length ≈ 60svh per second, so a turn ≈ one scroll gesture. */
export const HERO_BEATS = {
  film: { at: 0.3, dur: 5.0 },
  lift: { at: 1.1, dur: 1.4 },
  toLens: { at: 2.0, dur: 2.4 },
  fade: { at: 4.0, dur: 1.2 },
  /** When each feature turn starts — ALL_LINES order (4 Rolex, 3 Patek). */
  features: { starts: [4.8, 7.2, 14.0, 16.4, 23.0, 25.4, 27.8], turn: 1.3 },
  movement: { swapIn: 8.55, explode: { at: 8.9, dur: 2.8 }, reassemble: { at: 12.0, dur: 1.5 }, swapOut: 13.55 },
  handover: { at: 19.0, dur: 1.8 },
  /** "ve daha fazlası": the watch spins away, the page continues. */
  outro: { at: 30.2, dur: 1.8 },
  end: 33.2,
} as const;

type Dom = {
  cue?: Element | null;
  lines?: (Element | null)[];
  finale?: Element | null;
  outro?: Element | null;
};

export function buildHeroTimeline(s: HeroState, dom: Dom = {}) {
  const B = HERO_BEATS;
  const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

  // 1–2 Footage: the camera pulls back; the watch lifts and comes to the lens.
  tl.to(s, { frame: HERO_VIDEO.frames - 1, duration: B.film.dur, ease: "power1.inOut" }, B.film.at);
  if (dom.cue) tl.to(dom.cue, { autoAlpha: 0, duration: 0.6, ease: "power1.in" }, B.film.at);
  tl.to(s, { lift: 0.9, duration: B.lift.dur, ease: "power2.out" }, B.lift.at)
    .to(s, { seat: 0, duration: B.toLens.dur }, B.toLens.at)
    .to(s, { film: 0, duration: B.fade.dur, ease: "power1.inOut" }, B.fade.at);

  // 3 Features (Rolex, then Patek Philippe): turn to the part, the line holds.
  const F = B.features;
  const H = B.handover;
  const lineEnd = (i: number) => {
    if (i === HERO_LINES.length - 1) return H.at; // last Rolex line leaves as the spin starts
    if (i + 1 < F.starts.length) return F.starts[i + 1];
    return B.outro.at;
  };
  ALL_LINES.forEach((line, i) => {
    const at = F.starts[i];
    tl.to(s, { ...line.pose, duration: F.turn }, at);
    const el = dom.lines?.[i];
    if (!el) return;
    const from = line.side === "left" ? -50 : 50;
    tl.fromTo(el, { autoAlpha: 0, x: from }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, at + F.turn * 0.55);
    tl.to(el, { autoAlpha: 0, x: -from / 2, duration: 0.5, ease: "power2.in" }, lineEnd(i) - 0.35);
  });

  // 3b Mechanism: the camera zooms onto the movement film's framing; the film
  //    swaps in, separates and reassembles the movement, then hands back.
  const M = B.movement;
  const last = MOVEMENT_FILM.count - 1;
  tl.to(s, { lock: 1, duration: F.turn }, F.starts[1])
    .to(s, { mechFilm: 1, duration: 0.2, ease: "none" }, M.swapIn)
    .to(s, { hide: 1, duration: 0.25, ease: "none" }, M.swapIn + 0.15)
    .to(s, { mech: last, duration: M.explode.dur, ease: "power1.inOut" }, M.explode.at)
    .to(s, { mech: 0, duration: M.reassemble.dur, ease: "power1.inOut" }, M.reassemble.at)
    .to(s, { hide: 0, duration: 0.25, ease: "none" }, M.swapOut)
    .to(s, { mechFilm: 0, duration: 0.2, ease: "none" }, M.swapOut + 0.2)
    .to(s, { lock: 0, duration: F.turn }, F.starts[2]);

  // 4 Handover: back to the front while spinning once on the diagonal; the
  //   models cross-fade at peak speed behind a soft bloom. "İstediğiniz her
  //   saat" and the Patek Philippe's name hold until its first feature turn.
  const mid = H.at + H.dur / 2;
  // Slightly further back and lower than the features, leaving room for the line above.
  tl.to(s, { x: 0, y: -0.08, z: -4.3, yaw: deg(-360), pitch: 0, roll: 0, duration: H.dur }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { spinB: `+=${Math.PI}`, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { scale: 0.82, duration: H.dur / 2, ease: "power2.in" }, H.at)
    .to(s, { scale: 1, duration: H.dur / 2, ease: "power2.out" }, mid)
    .to(s, { swap: 1, duration: 0.36, ease: "none" }, mid - 0.18)
    .to(s, { flash: 1, duration: 0.25, ease: "power2.in" }, mid - 0.25)
    .to(s, { flash: 0, duration: 0.6, ease: "power2.out" }, mid);
  if (dom.finale)
    tl.fromTo(dom.finale, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, mid + 0.2).to(
      dom.finale,
      { autoAlpha: 0, y: -16, duration: 0.5, ease: "power2.in" },
      F.starts[HERO_LINES.length] - 0.1,
    );

  // 5 Outro: "ve daha fazlası" — the watch returns to the front, spins once on
  //   the diagonal while it recedes, and the 3D layer fades into the page.
  const O = B.outro;
  // Recedes below the line (which sits in the upper half).
  tl.to(s, { x: 0, y: -0.75, z: -8.5, yaw: deg(-360), pitch: 0, roll: 0, duration: O.dur }, O.at)
    .to(s, { spinA: `+=${Math.PI * 2}`, duration: O.dur }, O.at)
    .to(s, { hide: 1, duration: 0.8, ease: "power1.in" }, O.at + O.dur + 0.3);
  if (dom.outro)
    tl.fromTo(dom.outro, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, O.at + 0.5).to(
      dom.outro,
      { autoAlpha: 0, y: -20, duration: 0.6, ease: "power2.in" },
      B.end - 0.7,
    );

  tl.set({}, {}, B.end);
  return tl;
}
