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

/** A presentation box with a hinged lid (see lib/scene/intro.ts). */
export type BoxAsset = ModelAsset & {
  src: string;
  /** Lid node names to look for, in order (Blender name first, then export fallbacks). */
  lidNodes: string[];
  /** Hinge axis position in the model's original units (lid rotates about +X here). */
  hinge: [number, number, number];
  /** Lid X-angle as modelled in the file (radians). */
  modelledLidAngle: number;
};

export type ImageAsset = {
  src: string | null;
  alt: string;
};

/** Show small, discreet captions inside empty placeholders (asset hints). */
export const SHOW_ASSET_HINTS = true;

export const ASSETS = {
  intro: {
    /**
     * Rolex presentation box. Meshopt-compressed (9.5 MB → 6.2 MB). Compression
     * re-bakes node transforms, so the hinge is rebuilt in code from `hinge`.
     */
    box: {
      src: "/assets/models/rolex-box.glb",
      lidNodes: ["BoxLid", "Mesh_0002", "Mesh_0.002"],
      hinge: [0.0744, -0.4457, -0.5269],
      modelledLidAngle: 0.1733,
      scale: 2.7,
    } as BoxAsset,
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
