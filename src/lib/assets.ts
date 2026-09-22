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
  story: {
    /** 01 Cinematic Opening — realistic hand + wrist, rigged or baked. */
    hand: { src: null } as ModelAsset,
    /** 01 → 03 hero timepiece, shared by Opening / Reveal / Features. */
    watch: { src: null } as ModelAsset,
    /** Optional: dark surface / set piece for the opening shot. */
    surface: { src: null } as ModelAsset,
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
