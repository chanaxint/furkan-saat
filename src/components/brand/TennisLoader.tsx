import styles from "./TennisLoader.module.css";

/**
 * The brand page's opening beat: a small felt tennis ball spinning in the
 * middle of the screen for about a second, then the page. Pure CSS, so it is
 * there from the first paint and needs nothing to finish loading to go.
 */
export function TennisLoader() {
  return (
    <div className={styles.loader} aria-hidden>
      <div className={styles.ball}>
        <svg viewBox="0 0 64 64">
          <defs>
            <radialGradient id="tennis-felt" cx="38%" cy="32%" r="70%">
              <stop offset="0" stopColor="#fbf7ef" />
              <stop offset="0.6" stopColor="#ece2d0" />
              <stop offset="1" stopColor="#cfc1aa" />
            </radialGradient>
            <clipPath id="tennis-ball">
              <circle cx="32" cy="32" r="30" />
            </clipPath>
          </defs>
          <circle cx="32" cy="32" r="30" fill="url(#tennis-felt)" />
          {/* Only the seams turn: the light on the felt stays where it is. */}
          <g clipPath="url(#tennis-ball)">
            <g className={styles.seams}>
              <path d="M9 12c10 8 10 32 0 40" />
              <path d="M55 12c-10 8-10 32 0 40" />
            </g>
          </g>
        </svg>
      </div>
      <span className={styles.shadow} />
    </div>
  );
}
