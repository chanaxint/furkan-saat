"use client";

import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import type { StageMotion, StageQuat, StageScene } from "@/lib/data/stages";
import type { ShowcaseState } from "./showcase";

/**
 * BRAND STAGE — a brand page that opens on its watch in 3D, scene by scene
 * ----------------------------------------------------------------------------
 * The scroll position is a time on the stage's timeline; `sampleStage` turns
 * that time into the watch's pose, its visibility, and the opacity of the
 * page's title and lines. The same function drives the page and the editor
 * (/yonetim/donusler), so what is set there is exactly what the page shows.
 *
 * Between two scenes the orientation is interpolated along the shortest arc
 * (slerp) and any full turns are added about a diagonal axis, so the watch
 * can be set at any angle at all.
 */

export type StageState = ShowcaseState & { q: StageQuat };
export type StageOverlay = {
  /** 0–1: the brand's name above the watch (first scene only). */
  title: number;
  /** Per line of the page: opacity 0–1 and sideways shift in px. */
  lines: { opacity: number; shift: number }[];
};

// Diagonal axes lying in the screen plane, so a full turn reads as one clean
// 360° flip (an axis tilted toward the camera mixes in a roll and blurs it).
const AXES = { a: new Vector3(1, 1, 0).normalize(), b: new Vector3(-1, 1, 0).normalize() };
// Sine curves: softer than power2, so a turn never peaks at a whip.
// "in" leaves at speed (a scene that turns away out of sight), "out" arrives
// already turning (a scene that comes in from out of sight).
const EASES = {
  inOut: (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  in: (t: number) => 1 - Math.cos((Math.PI * t) / 2),
  out: (t: number) => Math.sin((Math.PI * t) / 2),
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/** When each scene's turn starts, when it arrives, and when it leaves. */
export function sceneTimes(m: StageMotion) {
  let t = 0;
  const times = m.scenes.map((s, i) => {
    const start = t;
    const arrive = i === 0 ? 0 : start + s.move;
    const leave = arrive + s.hold;
    t = leave;
    return { start, arrive, leave };
  });
  return { times, total: Math.max(0.5, t) };
}

/** Start of the last scene's turn: on the page this is when the collection starts rising over the watch. */
export const exitStart = (m: StageMotion) => sceneTimes(m).times[m.scenes.length - 1].start;

export const createStageState = (m: StageMotion): StageState => {
  const s = m.scenes[0];
  return { x: s.x, y: s.y, z: s.z, yaw: 0, pitch: 0, roll: 0, spinA: 0, spinB: 0, scale: 1, show: 1, q: [...s.q] as StageQuat };
};

const qa = new Quaternion();
const qb = new Quaternion();
const qs = new Quaternion();

/** Pose of the watch and the page's overlay at time `t` (seconds). */
export function sampleStage(m: StageMotion, t: number, out: StageState, lineCount = 0): StageOverlay {
  const { times } = sceneTimes(m);
  const scenes = m.scenes;
  const overlay: StageOverlay = { title: 1, lines: Array.from({ length: lineCount }, () => ({ opacity: 0, shift: 0 })) };

  // Which scene are we in (or turning into)?
  let i = scenes.length - 1;
  for (let k = 1; k < scenes.length; k++) {
    if (t < times[k].arrive) {
      i = k;
      break;
    }
  }
  const to = scenes[i];
  const from = scenes[Math.max(0, i - 1)];
  const span = times[i].arrive - times[i].start;
  const raw = i === 0 || span <= 0 ? 1 : clamp01((t - times[i].start) / span);
  const k = EASES[to.ease ?? "inOut"](raw);

  out.x = MathUtils.lerp(from.x, to.x, k);
  out.y = MathUtils.lerp(from.y, to.y, k);
  out.z = MathUtils.lerp(from.z, to.z, k);
  qa.fromArray(from.q).normalize();
  qb.fromArray(to.q).normalize();
  qa.slerp(qb, k);
  if (to.spins && raw < 1) {
    qs.setFromAxisAngle(AXES[to.axis], Math.PI * 2 * to.spins * k);
    qa.premultiply(qs);
  }
  out.q = qa.toArray() as StageQuat;

  // Visibility: a fading scene takes the watch away on its way in, and keeps it away.
  let show = 1;
  scenes.forEach((s, n) => {
    if (n === 0 || !s.fade) return;
    const d = Math.max(0.1, times[n].arrive - times[n].start);
    show = Math.min(show, 1 - smooth((t - times[n].start - d * 0.15) / (d * 0.8)));
  });
  out.show = show;

  // The title leaves as the first turn begins.
  if (scenes.length > 1) overlay.title = 1 - smooth((t - times[1].start + 0.3) / 1);

  // A scene's line slides in as its turn settles and leaves as the next turn begins.
  scenes.forEach((s, n) => {
    if (s.line === null || s.line >= lineCount || n === 0) return;
    const inAt = times[n].arrive - 0.6;
    const outAt = Math.max(inAt + 0.9, times[n].leave - 0.3);
    const a = smooth((t - inAt) / 0.8);
    const b = smooth((t - outAt) / 0.6);
    const opacity = a * (1 - b);
    const l = overlay.lines[s.line];
    if (opacity > l.opacity) overlay.lines[s.line] = { opacity, shift: (1 - a) * -50 + b * 25 };
  });

  return overlay;
}

/** Put the overlay onto the page's elements. */
export function applyOverlay(o: StageOverlay, title: HTMLElement | null, lines: (HTMLElement | null)[], sides: ("left" | "right")[]) {
  if (title) {
    title.style.opacity = String(o.title);
    title.style.visibility = o.title < 0.01 ? "hidden" : "visible";
    title.style.translate = `0 ${(1 - o.title) * -70}px`;
  }
  o.lines.forEach((l, i) => {
    const el = lines[i];
    if (!el) return;
    el.style.opacity = String(l.opacity);
    el.style.visibility = l.opacity < 0.01 ? "hidden" : "visible";
    el.style.translate = `${sides[i] === "right" ? -l.shift : l.shift}px 0`;
  });
}

/* ------------------------------------------------- angles for the editor */

const e = new Euler();
const q = new Quaternion();

/** Degrees (yaw, pitch, roll as the earlier openings used them) → quaternion. */
export function quatFromDeg(yaw: number, pitch: number, roll: number): StageQuat {
  e.set(MathUtils.degToRad(-pitch), MathUtils.degToRad(yaw), MathUtils.degToRad(roll), "YXZ");
  return q.setFromEuler(e).toArray() as StageQuat;
}

/** Quaternion → readable degrees (yaw, pitch, roll). */
export function degFromQuat(v: StageQuat) {
  e.setFromQuaternion(q.fromArray(v).normalize(), "YXZ");
  const r = (x: number) => Math.round(MathUtils.radToDeg(x) * 10) / 10;
  return { yaw: r(e.y), pitch: r(-e.x), roll: r(e.z) };
}

/** Turn a quaternion by `deg` about a screen axis ("x" across, "y" up, "z" toward you). */
export function turnOnScreen(v: StageQuat, axis: "x" | "y" | "z", deg: number): StageQuat {
  const ax = axis === "x" ? new Vector3(1, 0, 0) : axis === "y" ? new Vector3(0, 1, 0) : new Vector3(0, 0, 1);
  qs.setFromAxisAngle(ax, MathUtils.degToRad(deg));
  return q.fromArray(v).premultiply(qs).normalize().toArray() as StageQuat;
}

export const blankScene = (from: StageScene, n: number): StageScene => ({
  ...from,
  name: n > 0 ? `Ara sahne ${n}` : "Ara sahne",
  q: [...from.q] as StageQuat,
  move: 2.5,
  hold: 1,
  spins: 0,
  line: null,
  fade: false,
  ease: "inOut",
});
