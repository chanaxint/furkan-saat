/**
 * MOVEMENT FILM — the scroll-scrubbed exploded view of the Rolex movement
 * ----------------------------------------------------------------------------
 * The clip (public/assets/video/movement/000–119.webp, 1920×1080, from a
 * 3840×2160 source) starts on a frame of our own 3D mechanism beat. Its
 * first frame relates to that render (1440×900, fov 30) by a similarity
 * measured with SIFT + RANSAC (median error ≈ 2 px at 4K):
 *
 *     video_px = scale · render_px + (tx, ty)          (4K pixels)
 *
 * HeroWatchScene uses this to zoom the 3D camera onto exactly the video's
 * framing (on any screen shape) before the handover, so the swap from 3D to
 * film — and back — is invisible.
 */
export const MOVEMENT_FILM = {
  dir: "/assets/video/movement",
  count: 120,
  ext: "webp",
  /** Source resolution the alignment is expressed in. */
  width: 3840,
  height: 2160,
  /** Reference render the clip was made from. */
  ref: { width: 1440, height: 900 },
  align: { scale: 4.0603, tx: -497.17, ty: -590.93 },
} as const;

export const movementFrameSrc = (i: number) =>
  `${MOVEMENT_FILM.dir}/${String(i).padStart(3, "0")}.${MOVEMENT_FILM.ext}`;
