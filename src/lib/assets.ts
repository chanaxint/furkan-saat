/**
 * ASSET REGISTRY
 * --------------------------------------------------------------------------
 * Films and photographs used by the home page are referenced from here.
 * A `null` slot renders a premium placeholder until a real asset is dropped in.
 *
 * To integrate a real asset: put the file in /public/assets/{video|images}/
 * and replace `null` with its public path.
 *
 * Supported: .mp4 .webm (film) · .jpg .png .webp (stills)
 */

export type VideoAsset = {
  /** Provide both where possible — webm first, mp4 fallback. */
  webm: string | null;
  mp4: string | null;
  poster: string | null;
};

/** Show small, discreet captions inside empty placeholders (asset hints). */
export const SHOW_ASSET_HINTS = false;

export const ASSETS = {
  intro: {
    /**
     * Opening film — watches changing on a wrist against black (5 s, no sound).
     * Plays once on the first scroll; 720p for phones, 1080p elsewhere
     * (H.264, with a VP9 WebM for browsers without it).
     */
    film: {
      mp4: "/assets/video/intro/intro-1080.mp4",
      webm: "/assets/video/intro/intro-1080.webm",
      mobile: "/assets/video/intro/intro-720.mp4",
      poster: "/assets/video/intro/intro-poster.webp",
      /** The same film reversed (30 fps), played when scrolling back up rewinds the opening. */
      reverse: {
        mp4: "/assets/video/intro/intro-1080-reverse.mp4",
        webm: "/assets/video/intro/intro-1080-reverse.webm",
        mobile: "/assets/video/intro/intro-720-reverse.mp4",
      },
    },
  },
  boutique: {
    film: { webm: null, mp4: null, poster: null } as VideoAsset,
  },
} as const;
