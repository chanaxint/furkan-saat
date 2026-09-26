/**
 * ASSET REGISTRY
 * --------------------------------------------------------------------------
 * Every 3D model, film and photograph on the site is referenced from here.
 * All slots are intentionally empty (null) in this first version — the UI
 * renders premium placeholders until a real asset is dropped in.
 *
 * To integrate a real asset:
 *   1. Put the file in /public/assets/{models|video|images}/
 *   2. Replace `null` with the public path, e.g. "/assets/models/hand-watch.glb"
 *   3. (models) make sure node names match the `node` fields in
 *      src/lib/scene/exploded.ts if the model is used for the exploded view.
 *
 * Supported: .glb .gltf (models) · .mp4 .webm (film) · .jpg .png .webp (stills)
 */

export type ModelAsset = {
  src: string | null;
  /**
   * Point of the model (in its own units) that the showcase rotates around —
   * normally the centre of the watch head, not the centre of the bracelet.
   */
  pivot?: [number, number, number];
  /** Optional Draco decoder path if the file is Draco-compressed. */
  draco?: boolean;
  /** Uniform scale / offset to normalise an exported model into scene units. */
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

export type VideoAsset = {
  /** Provide both where possible — webm first, mp4 fallback. */
  webm: string | null;
  mp4: string | null;
  poster: string | null;
};

export type ImageAsset = {
  src: string | null;
  alt: string;
};

/** Show small, discreet captions inside empty placeholders (asset hints). */
export const SHOW_ASSET_HINTS = true;

export const ASSETS = {
  hero: {
    /**
     * Opening footage — camera pulling back from the empty cushion. Played as
     * a WebP frame sequence (public/assets/video/hero/000–239.webp) so scroll
     * scrubbing is exact in every browser.
     */
    frames: { dir: "/assets/video/hero", count: 240, ext: "webp" },
    /**
     * Patek Philippe Celestial (moon phase) — the watch the Rolex turns into at
     * the end of the opening. Single textured mesh, dial faces +Z, 12 o'clock
     * up; geometry meshopt-compressed (26.6 MB → 11.1 MB), textures untouched.
     * `pivot` = centre of the watch head; `scale` matches the Rolex on screen.
     */
    next: {
      src: "/assets/models/patek-celestial.glb",
      pivot: [-0.007, 0, 0.711],
      scale: 0.88,
    } as ModelAsset,
  },
  showcase: {
    /**
     * Rolex Submariner Date (green) — single textured mesh, dial faces +Z.
     * Geometry meshopt-compressed (23.6 MB → 10.8 MB); textures untouched.
     */
    watch: {
      src: "/assets/models/emerald-watch.glb",
      pivot: [0, 0, 0.695],
    } as ModelAsset,
  },
  exploded: {
    /** 04 Exploded View — a single GLB whose parts are named nodes. */
    watch: { src: null } as ModelAsset,
  },
  newArrival: {
    model: { src: null } as ModelAsset,
    film: { webm: null, mp4: null, poster: null } as VideoAsset,
    still: { src: null, alt: "" } as ImageAsset,
  },
  boutique: {
    film: { webm: null, mp4: null, poster: null } as VideoAsset,
  },
} as const;
