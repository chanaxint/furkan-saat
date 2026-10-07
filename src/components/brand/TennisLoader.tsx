import styles from "./TennisLoader.module.css";

/**
 * The brand page's opening beat: a small see-through tennis ball (its outline
 * and seams only) spinning on its own axis, to the right, in the middle of the
 * screen for about a second, over the page. Pure CSS, so it is there from the
 * first paint and needs nothing to finish loading to go.
 */
export function TennisLoader() {
  return (
    <div className={styles.loader} aria-hidden>
      <svg className={styles.ball} viewBox="0 0 64 64">
        <defs>
          <clipPath id="tennis-ball">
            <circle cx="32" cy="32" r="29" />
          </clipPath>
        </defs>
        <circle cx="32" cy="32" r="29" />
        <g clipPath="url(#tennis-ball)">
          <path d="M9 12c10 8 10 32 0 40" />
          <path d="M55 12c-10 8-10 32 0 40" />
        </g>
      </svg>
    </div>
  );
}
