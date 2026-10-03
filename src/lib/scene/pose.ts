/**
 * Shared, framework-free pieces of the 3D showcase (usable from data files and
 * server components; the timeline itself lives in showcase.ts).
 */

/** Watch pose in camera space: position (scene units) and yaw / pitch / roll (radians). */
export type Pose = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number };

/** A feature turn: where the watch goes, and the line that comes with it. */
export type ShowcaseBeat = {
  id: string;
  /** Side of the screen the line sits on (the watch moves to the other side). */
  side: "left" | "right";
  title: string;
  /** The word of the title set in the accent colour. */
  accent: string;
  text: string;
  pose: Pose;
};

const deg = (d: number) => (d * Math.PI) / 180;

/** Pose with angles in degrees. */
export const pose = (x: number, y: number, z: number, yaw: number, pitch: number, roll: number): Pose => ({
  x,
  y,
  z,
  yaw: deg(yaw),
  pitch: deg(pitch),
  roll: deg(roll),
});
