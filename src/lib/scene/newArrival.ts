/**
 * NEW ARRIVAL FILM — the Jacob & Co. box opening
 * ----------------------------------------------------------------------------
 * public/assets/video/new-arrival/000–191.webp (1600×900, from a 1920×1080
 * clip) is scrubbed by scroll: the lid opens and the watch rises out.
 *
 * On the last frame the camera is still, so that frame is split in two:
 *   plate.webp  the box with the watch removed (filled from its surroundings)
 *   watch.webp  the watch alone, with a soft alpha edge
 * Put back together they are identical to the last frame — so the swap is
 * invisible — and only the watch layer follows the pointer.
 *
 * `layer` is where watch.webp sits, in source (1920×1080) pixels.
 */
export const NEW_ARRIVAL_FILM = {
  dir: "/assets/video/new-arrival",
  count: 192,
  ext: "webp",
  width: 1920,
  height: 1080,
  plate: "/assets/video/new-arrival/plate.webp",
  watch: "/assets/video/new-arrival/watch.webp",
  layer: { x: 748, y: 258, w: 469, h: 616 },
} as const;

export const newArrivalFrameSrc = (i: number) =>
  `${NEW_ARRIVAL_FILM.dir}/${String(i).padStart(3, "0")}.${NEW_ARRIVAL_FILM.ext}`;
