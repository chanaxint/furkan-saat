import seatJson from "./seat.json";

/**
 * SEAT — how the 3D watch sits on the cushion of the opening footage.
 * ----------------------------------------------------------------------------
 * Values live in seat.json so the /kontrol page can tune them live and save
 * them back (in development). Distances are scene units (watch case ≈ 0.93),
 * angles are degrees.
 *
 * Table frame: X = right, Y = up (table normal), Z = toward the front of the box.
 */
export type SeatConfig = {
  /** Watch offset from the cushion's top centre, in the table frame. */
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  /** Extra rotation on top of "dial up, 12 o'clock to the lid". */
  tilt: number;
  yaw: number;
  roll: number;
  /** Watch scale while seated (1 = same size as in the rest of the film). */
  scale: number;
  /** Real cushion width — sets how far away the cushion is from the camera. */
  cushionWidth: number;
  /** Invisible cushion (hides the bracelet behind it) — depth and height. */
  cushionDepth: number;
  cushionHeight: number;
  /** How much smaller the hiding shape is than the bracelet loop. */
  occluderInset: number;
  /** Insert surface around the cushion, and the well in front of / behind it. */
  insertTop: number;
  wellFront: number;
  wellBack: number;
  /** How steeply the footage camera looks down at the box. */
  footageElevation: number;
  /** Darkness of the watch's shadow on the cushion (0 – 1). */
  shadowOpacity: number;
};

export const SEAT_DEFAULTS: SeatConfig = seatJson as SeatConfig;

/** Control-page definition of every value: range, step and Turkish label. */
export const SEAT_FIELDS: { key: keyof SeatConfig; label: string; min: number; max: number; step: number; group: string }[] = [
  { key: "offsetX", label: "Sağa / sola", min: -0.6, max: 0.6, step: 0.005, group: "Konum" },
  { key: "offsetY", label: "Yukarı / aşağı", min: -0.4, max: 0.6, step: 0.005, group: "Konum" },
  { key: "offsetZ", label: "İleri / geri", min: -0.8, max: 0.8, step: 0.005, group: "Konum" },
  { key: "scale", label: "Boyut", min: 0.6, max: 1.5, step: 0.005, group: "Konum" },
  { key: "tilt", label: "Öne / arkaya eğim", min: -40, max: 40, step: 0.25, group: "Açı" },
  { key: "yaw", label: "Kendi etrafında", min: -45, max: 45, step: 0.25, group: "Açı" },
  { key: "roll", label: "Yana yatma", min: -30, max: 30, step: 0.25, group: "Açı" },
  { key: "footageElevation", label: "Kamera bakış açısı", min: 30, max: 80, step: 0.25, group: "Açı" },
  { key: "cushionWidth", label: "Yastık genişliği (mesafe)", min: 0.9, max: 1.8, step: 0.005, group: "Yastık" },
  { key: "cushionDepth", label: "Yastık derinliği", min: 1, max: 2.4, step: 0.005, group: "Yastık" },
  { key: "cushionHeight", label: "Yastık yüksekliği", min: 0.4, max: 1.4, step: 0.005, group: "Yastık" },
  { key: "occluderInset", label: "Kordon gizleme payı", min: 0, max: 0.5, step: 0.005, group: "Yastık" },
  { key: "insertTop", label: "Taban yüksekliği", min: -0.9, max: 0, step: 0.005, group: "Yastık" },
  { key: "wellFront", label: "Ön boşluk kenarı", min: 0.2, max: 1.4, step: 0.005, group: "Yastık" },
  { key: "wellBack", label: "Arka boşluk kenarı", min: -1.6, max: -0.2, step: 0.005, group: "Yastık" },
  { key: "shadowOpacity", label: "Gölge koyuluğu", min: 0, max: 1, step: 0.01, group: "Gölge" },
];
