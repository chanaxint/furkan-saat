import styles from "./TennisLoader.module.css";

/**
 * The brand page's opening beat: a small see-through tennis ball, its seam
 * drawn on the sphere and showing at its sides, turning to the right about an
 * upright axis in the
 * middle of the screen for about a second. The near side of the seam is
 * bright, the far side faint (it shows through). The turn is drawn here as a
 * run of frames that CSS steps through, so it plays from the first paint
 * with no script to wait for.
 */
const FRAMES = 36;
const SAMPLES = 180;
const R = 29;
// The seam: a closed curve on the unit sphere (a + b = 1).
const A = 0.72;
const B = 0.28;
const C = 2 * Math.sqrt(A * B);
// Set so the near side of the seam shows as two arcs at the left and right
// (the ball as it is usually drawn), with a slight lean.
const SET_Y = Math.PI / 4;
const SET_X = Math.PI / 2;
const LEAN = (8 * Math.PI) / 180;

const f = (n: number) => n.toFixed(2);

function frame(phi: number) {
  const pts: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * Math.PI * 2;
    // The seam on the sphere…
    let x = A * Math.cos(t) + B * Math.cos(3 * t);
    let z = A * Math.sin(t) - B * Math.sin(3 * t);
    let y = C * Math.sin(2 * t);
    // …set with its arcs at the sides…
    [x, z] = [x * Math.cos(SET_Y) + z * Math.sin(SET_Y), -x * Math.sin(SET_Y) + z * Math.cos(SET_Y)];
    [y, z] = [y * Math.cos(SET_X) - z * Math.sin(SET_X), y * Math.sin(SET_X) + z * Math.cos(SET_X)];
    // …turned about the upright axis, the near side moving right…
    [x, z] = [x * Math.cos(phi) + z * Math.sin(phi), -x * Math.sin(phi) + z * Math.cos(phi)];
    // …and leaning a little.
    [x, y] = [x * Math.cos(LEAN) - y * Math.sin(LEAN), x * Math.sin(LEAN) + y * Math.cos(LEAN)];
    pts.push({ x: 32 + x * R, y: 32 - y * R, z });
  }
  let near = "";
  let far = "";
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = `M${f(a.x)} ${f(a.y)}L${f(b.x)} ${f(b.y)}`;
    if (a.z + b.z >= 0) near += seg;
    else far += seg;
  }
  return { near, far };
}

const TURN = Array.from({ length: FRAMES }, (_, k) => frame((k / FRAMES) * Math.PI * 2));

export function TennisLoader() {
  return (
    <div className={styles.loader} aria-hidden>
      <svg className={styles.ball} viewBox="0 0 64 64" style={{ "--frames": FRAMES } as React.CSSProperties}>
        <circle className={styles.rim} cx="32" cy="32" r={R} />
        {TURN.map((p, k) => (
          <g key={k} className={styles.frame} style={{ "--k": k } as React.CSSProperties}>
            <path className={styles.far} d={p.far} />
            <path className={styles.near} d={p.near} />
          </g>
        ))}
      </svg>
    </div>
  );
}
