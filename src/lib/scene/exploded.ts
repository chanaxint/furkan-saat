/**
 * EXPLODED VIEW — part definitions
 * ----------------------------------------------------------------------------
 * `node` must match the object name inside the future GLB (Blender object
 * name). When ASSETS.exploded.watch.src is set, WatchExplodedView looks each
 * node up by name and drives it with the same offsets used by the placeholder.
 *
 * `offset` is the fully-separated displacement along the presentation axis
 * (scene units). Parts separate sequentially in `order`, never all at once —
 * it must read as a technical presentation, not an explosion.
 */

export type ExplodedPart = {
  id: string;
  node: string;
  label: string;
  caption: string;
  order: number;
  offset: number;
};

export const EXPLODED_PARTS: ExplodedPart[] = [
  {
    id: "crystal",
    node: "Crystal",
    label: "Crystal",
    caption: "Domed sapphire, anti-reflective on both faces.",
    order: 0,
    offset: 2.7,
  },
  {
    id: "bezel",
    node: "Bezel",
    label: "Bezel",
    caption: "Hand-finished, alternating polished and satin surfaces.",
    order: 1,
    offset: 2.0,
  },
  {
    id: "hands",
    node: "Hands",
    label: "Hands",
    caption: "Faceted, heat-blued and set by eye.",
    order: 2,
    offset: 1.35,
  },
  {
    id: "dial",
    node: "Dial",
    label: "Dial",
    caption: "Grand feu enamel, fired eleven times.",
    order: 3,
    offset: 0.7,
  },
  {
    id: "case",
    node: "Case",
    label: "Case",
    caption: "Forged from a single block of 18k white gold.",
    order: 4,
    offset: 0,
  },
  {
    id: "movement",
    node: "Movement",
    label: "Movement",
    caption: "Self-winding calibre, 42 jewels, Geneva stripes.",
    order: 5,
    offset: -0.8,
  },
  {
    id: "caseback",
    node: "Caseback",
    label: "Caseback",
    caption: "Sapphire display back, screwed and sealed.",
    order: 6,
    offset: -1.55,
  },
  {
    id: "strap",
    node: "Strap",
    label: "Strap",
    caption: "Hand-stitched alligator, deployant clasp.",
    order: 7,
    offset: -2.35,
  },
];

/** Portion of section progress reserved before/after the separation. */
export const EXPLODED_TIMING = {
  start: 0.08,
  end: 0.86,
  /** Per-part overlap. 0 = strictly one after another, 1 = all together. */
  overlap: 0.55,
};

/** Length of each part's travel window within the separation phase (0 → 1). */
const WINDOW = 1 - EXPLODED_TIMING.overlap * 0.9;

/**
 * Local 0 → 1 separation of one part at section progress `p`.
 * Shared by the WebGL scene and the DOM part index so both stay in sync.
 */
export function partProgress(order: number, p: number, count = EXPLODED_PARTS.length) {
  const t = Math.min(1, Math.max(0, (p - EXPLODED_TIMING.start) / (EXPLODED_TIMING.end - EXPLODED_TIMING.start)));
  const s = count > 1 ? (order / (count - 1)) * (1 - WINDOW) : 0;
  const local = Math.min(1, Math.max(0, (t - s) / WINDOW));
  return local * local * (3 - 2 * local);
}

/** Index of the part currently travelling (for the DOM index). */
export function activePartIndex(p: number) {
  let active = 0;
  EXPLODED_PARTS.forEach((part, i) => {
    if (partProgress(part.order, p) > 0.02) active = i;
  });
  return active;
}

/** Exploded-view camera path. */
export const EXPLODED_CAMERA = {
  position: [
    { at: 0, value: [6.4, 3.2, 9.4] as [number, number, number] },
    { at: 0.5, value: [8.0, 2.9, 7.6] as [number, number, number] },
    { at: 1, value: [9.2, 2.6, 5.8] as [number, number, number] },
  ],
  target: [
    { at: 0, value: [0, 0, 0] as [number, number, number] },
    { at: 1, value: [0, 0.1, 0] as [number, number, number] },
  ],
  fov: [
    { at: 0, value: 30 },
    { at: 1, value: 34 },
  ],
};
