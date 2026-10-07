import data from "./stages.json";

/**
 * The 3D openings of brand pages, scene by scene. Stored in stages.json and
 * edited at /yonetim/donusler.
 *
 * The watch moves from scene to scene: into each scene it turns for `move`
 * seconds of the scroll timeline (optionally with full diagonal turns), then
 * holds for `hold` seconds. The first scene is where the page opens.
 */
export type StageQuat = [number, number, number, number];

export type StageScene = {
  name: string;
  /** Position in camera space (scene units; z is negative, smaller = closer). */
  x: number;
  y: number;
  z: number;
  /** Orientation as a quaternion [x, y, z, w] — any angle, no gimbal lock. */
  q: StageQuat;
  /** Seconds of the turn into this scene (ignored for the first). */
  move: number;
  /** Seconds the watch stays here before the next scene. */
  hold: number;
  /** Full turns made on the way in (negative = the other way). */
  spins: number;
  /** Diagonal axis of those turns. */
  axis: "a" | "b";
  /** Line of the page shown while here (index into the brand's stage lines), or none. */
  line: number | null;
  /** The watch fades away on the way into this scene (use on the last). */
  fade: boolean;
  /**
   * How the turn into this scene runs: "inOut" starts and settles softly,
   * "in" leaves at speed (into a scene out of sight), "out" arrives already
   * turning (from a scene out of sight). Default "inOut".
   */
  ease?: StageEase;
  /** The brand's water splash crashes in as the watch arrives here (plays once, in real time). */
  splash?: boolean;
};

export type StageEase = "inOut" | "in" | "out";

export type StageMotion = {
  /** Scroll length per timeline second (svh); higher = slower on scroll. */
  speed: number;
  scenes: StageScene[];
  /** After the collection: the watch comes back, scene by scene, on its own stretch of scroll. */
  outro?: StageMotion;
};

export const STAGES = data as unknown as Record<string, StageMotion>;
