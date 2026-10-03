import data from "./stages.json";

/**
 * The 3D openings of brand pages: poses (angles in degrees), timings (seconds
 * of the scroll timeline) and how many full turns each move makes. Stored in
 * stages.json and edited live from /yonetim/donusler.
 */
export type StagePoseDeg = { x: number; y: number; z: number; yaw: number; pitch: number; roll: number };
export type StageStep = { at: number; dur: number };
export type StageMotion = {
  /** Scroll length per timeline second (svh); higher = slower on scroll. */
  speed: number;
  poses: { intro: StagePoseDeg; logo: StagePoseDeg; bracelet: StagePoseDeg; exit: StagePoseDeg };
  times: { logo: StageStep; bracelet: StageStep; exit: StageStep; end: number };
  /** Full diagonal turns on the way to the name and to the bracelet. */
  spins: { logo: number; bracelet: number };
};

export const STAGES = data as Record<string, StageMotion>;
