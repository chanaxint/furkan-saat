# Furkan Saat — Homepage (v1)

Multi-house luxury watch retailer. Cinematic editorial homepage built with
**Next.js 16 · React 19 · Three.js / React Three Fiber · GSAP ScrollTrigger · Lenis**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Page structure

| #  | Section            | Component                                              |
|----|--------------------|--------------------------------------------------------|
| 01 | Cinematic Opening  | `sections/story/CinematicOpening` (on shared 3D stage) |
| 02 | Watch Reveal       | `sections/story/WatchReveal`                           |
| 03 | Watch Features     | `sections/story/WatchFeatures`                         |
| —  | Watch Showcase     | `sections/showcase/WatchShowcase` + `three/showcase/*` (real GLB) |
| 04 | In Detail (macro)  | `sections/details/WatchDetails` + `lib/scene/details.ts` (real GLB) |
| —  | Exploded View      | *parked:* `sections/ExplodedView` (not on the page for now) |
| 05 | New Arrival        | `sections/NewArrival` + `media/ProductShowcase`        |
| 06 | Most Wanted        | `sections/MostWanted`                                  |
| 07 | The Collection     | `sections/collection/*` (filters: brand/type/material/movement/price) |
| 08 | The Houses         | `sections/Houses` (stacked sticky worlds)              |
| 09 | Editorial          | `sections/Editorial`                                   |
| 10 | Boutique           | `sections/Boutique`                                    |
| 11 | Final CTA          | `sections/FinalCTA` (green → ivory)                    |
| 12 | Footer             | `layout/Footer`                                        |

01–03 share **one sticky WebGL stage** (`sections/story/WatchStory`), so the
opening, reveal and features are a single continuous camera move, not three
separate blocks.

## Design system

- Tokens, type scale, spacing, motion curves: `src/app/globals.css`
- Palette: `#071A16` green · `#F2EDE3` ivory · `#C8B99A` champagne · `#5A1018` wine (used once — Cartier)
- Type: Cormorant Garamond (display) + Inter Tight (UI), self-hosted in `public/fonts`
- Reusable UI: `ArrowLink`, `SplitText`, `Reveal`, `SectionMarker`, `MediaSlot`

## Motion architecture

- `providers/SmoothScroll` — Lenis on GSAP's ticker (wheel only; touch stays native, no scroll-jacking)
- `lib/gsap.ts` — single plugin registration
- `lib/scene/progress.ts` — mutable progress channels written by ScrollTrigger, read by the R3F render loop (no React re-renders per frame)
- `lib/scene/story.ts` — **all** keyframes for 01–03 (camera, hand, watch, light)
- `lib/scene/exploded.ts` — part list, offsets, sequencing and camera for 04
- `three/CameraRig` — the only thing that moves a camera; damped, keyframed
- `prefers-reduced-motion` disables Lenis and scroll choreography

## Watch showcase (real model)

`public/assets/models/emerald-watch.glb`: the Rolex Submariner Date model. The mesh is
meshopt-compressed (23.6 MB → 10.8 MB) with full geometry kept. Textures and materials are untouched.

The sequence, driven entirely by scroll:
1. **Arrival**: the watch rises into frame and settles, dial to camera.
2. **Presence**: it shows its face off: right, a touch right, a touch left.
3. **Reverse**: it recedes through one full turn (caseback and bracelet, then the dial).
4. **Perspective**: it comes forward with the dial tipped up, seen from a side angle.
5. **Hero**: back to the straight front pose, where it holds.

Large type lines ("Water resistant to 300 metres", …) sweep across behind the
watch from the right and left. Edit them in `SHOWCASE_MESSAGES`.

- `lib/scene/showcase.ts`: every pose, the camera, the text lines, the speed
  limits and the hand-off poses (`SHOWCASE_ARRIVED_POSE` for a future box-exit
  sequence, `SHOWCASE_HERO_POSE` for the exploded view).
- `lib/scene/spline.ts`: monotone Hermite curves. Motion flows through the poses,
  eases like a pendulum where it changes direction, and never overshoots.
- `lib/scene/spring.ts` + `advanceShowcase()`: a critically damped spring whose
  speed limit follows how much the watch actually moves (max ~170°/s). A fast
  scroll or anchor jump never teleports it. It stops dead when scrolling stops.
- **Performance:** one render pass per frame (no post-processing, no shadow pass),
  pixel ratio ≤ 1.5, and **on-demand rendering**: the GPU only draws while the
  watch moves and is idle otherwise.
- QA: `window.__showcaseSnap = true` in the console disables the spring (for captures).

## In Detail (macro close-ups)

This section stands in for the exploded view for now. The watch holds its hero
pose and the camera moves: it starts on the showcase's closing frame, moves in
on the dial, ceramic bezel, cyclops lens, crown and clasp, then orbits back to
the front. Shots, camera positions and caption copy are all in
`lib/scene/details.ts` (`DETAIL_SHOTS`).

Both sections run on one shared engine, `lib/scene/sequence.ts`, with a generic
`SequenceRig` and `ModelSequenceScene`. A new model sequence is just a
`sample()` function plus speed limits.

Future box sequences go between `<WatchStory />` and `<WatchShowcase />` in
`src/app/page.tsx`. To bring the exploded view back, put `<ExplodedView />`
after `<WatchDetails />`.

## Adding real assets

Everything is referenced from **`src/lib/assets.ts`**. Every slot is `null`
today and renders a placeholder; set a path and the real asset replaces it.

| Asset | Where | Notes |
|---|---|---|
| Hand + wrist `.glb` | `ASSETS.story.hand` | +Z faces camera when dial visible; empty named `WatchMount` at the wrist |
| Hero watch `.glb` | `ASSETS.story.watch` | dial Ø ≈ 2 units, dial faces +Z (use `scale`/`rotation` to normalise) |
| Set surface `.glb` | `ASSETS.story.surface` | optional |
| Exploded watch `.glb` | `ASSETS.exploded.watch` | nodes named `Crystal, Bezel, Hands, Dial, Case, Movement, Caseback, Strap` (see `lib/scene/exploded.ts`) — they are driven along local Z automatically |
| New arrival | `ASSETS.newArrival.{model,film,still}` | model → film → still → placeholder |
| Boutique film | `ASSETS.boutique.film` | `.webm` + `.mp4` + poster |
| Product photos | `image` on each watch in `lib/data/watches.ts` | `.jpg/.png/.webp`, 4:5 |
| House / story media | `media` in `lib/data/houses.ts`, `lib/data/stories.ts` | image or video |

Put files under `public/assets/{models,video,images}`. Set
`SHOW_ASSET_HINTS = false` in `lib/assets.ts` to hide the small placeholder
captions. Draco-compressed models: set `draco: true` and copy the decoder to
`public/draco/`.

The placeholders are deliberately abstract (a disc proxy, schematic layers,
tonal fields) — no fake hands, no fake watch renders, no stock imagery.
