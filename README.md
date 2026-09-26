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
| 01 | Hero film          | `sections/hero/HeroFilm` + `three/hero/HeroWatchScene` + `lib/scene/hero.ts` |
| —  | In Detail (macro)  | *parked:* `sections/details/WatchDetails` (not on the page for now) |
| —  | Exploded View      | *parked:* `sections/ExplodedView` (not on the page for now) |
| 05 | New Arrival        | `sections/NewArrival` + `media/ProductShowcase`        |
| 06 | Most Wanted        | `sections/MostWanted`                                  |
| 07 | The Collection     | `sections/collection/*` (filters: brand/type/material/movement/price) |
| 08 | The Houses         | `sections/Houses` (stacked sticky worlds)              |
| 09 | Editorial          | `sections/Editorial`                                   |
| 10 | Boutique           | `sections/Boutique`                                    |
| 11 | Final CTA          | `sections/FinalCTA` (green → ivory)                    |
| 12 | Footer             | `layout/Footer`                                        |

The opening ends in the house green, so the film flows straight into the
rest of the page.
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
- `lib/scene/hero.ts`: the opening as **one GSAP timeline** (scrubbed, `scrub: 1`)
- `lib/scene/exploded.ts` — part list, offsets, sequencing and camera for 04
- `three/CameraRig` — the only thing that moves a camera; damped, keyframed
- `prefers-reduced-motion` disables Lenis and scroll choreography

## Hero film (opening)

The opening is filmed footage with the real 3D watch composited into it, all
driven by scroll through **one GSAP timeline** (`buildHeroTimeline`, `scrub: 1`).

- **Footage:** `public/assets/video/hero/000–239.webp` (from the 10 s, 24 fps clip).
  `FrameSequence` draws it to a canvas, loading coarse to fine and blending
  neighbouring frames. A `<video>` element can't scrub frame-accurately.
- **Seating the watch:** `lib/scene/heroTrack.ts` holds the cushion's position and
  size in every frame, tracked from the footage (SIFT + RANSAC homographies).
  `HeroWatchScene` turns that into a 3D anchor (cover-fit aware) and places the
  watch on it, dial up and 12 o'clock toward the lid. An invisible cushion
  shape hides the bracelet where it wraps behind the cushion and catches the
  watch's shadow.
- **Sequence:** seated → lifts off and comes large to the lens as the footage dissolves
  into the house green → four feature lines, and for each one the watch turns
  (diagonally) to show that part: *Oyster Kasa* (case flank), *Perpetual Mekanizma*
  (caseback), *Cerachrom Çerçeve* (bezel close-up), *Oyster Bileklik* (bracelet) → one
  diagonal spin into the Patek Philippe, with its brand and model beneath it.
  Lines and poses are in `HERO_LINES`, the closing text in `HERO_FINALE`.
- **Pacing:** ≈ 60svh of scroll per timeline second, so each turn takes about
  one scroll gesture; `scrub: 1` smooths it.
- **Rotation rule:** spins only run about the two diagonal axes
  (`SPIN_AXIS_A/B`), and every look-turn mixes yaw, pitch and roll. There are
  no pure horizontal or pure vertical turns.
- **Second watch:** Patek Philippe Celestial (`ASSETS.hero.next`, `patek-celestial.glb`), placed on its
  watch-head `pivot` and scaled to match the Rolex. Swap `src`/`pivot`/`scale` to use another model.
- Copy line, look direction and timing are in `HERO_LINES` / `HERO_BEATS`.

The whole site is in Turkish (`lang="tr"`, `tr-TR` number formatting).

## Movement film (mechanism beat)

In the *Perpetual Mekanizma* beat the watch turns while the camera zooms onto the
exact framing of `public/assets/video/movement/000–119.webp`. The film then swaps
in invisibly, separates the movement as you scroll, reassembles it, and hands back
to the 3D watch, which continues to the bezel.

- The clip was made from one of our own 3D frames. `lib/scene/movement.ts` stores
  how it relates to that frame (4.06× crop, measured with SIFT + RANSAC).
  `applyFilmLock()` in `HeroWatchScene` turns this into a camera view offset, so
  the 3D matches the film on any screen shape.
- A caption baked into the right edge of the clip was removed (inpainted) during export.
- Frames start loading only once the opening is underway (about 9 MB).

## Placing the watch on the cushion — `/kontrol`

Open **http://localhost:4321/kontrol** while `npm run dev -- -p 4321` is running.

- Left: the first frame of the footage with the 3D watch on it. The *Video karesi*
  slider (or *Oynat*) scrubs the footage to check that the watch stays on the cushion.
- *Gizli şekilleri göster* shows the invisible helpers: **red** = the cushion that
  hides the bracelet behind it, **blue** = the insert around it, **green** = the well floor.
- Right: every value with a slider, −/+ buttons and a number field.
- Keyboard: ← → left/right · ↑ ↓ forward/back · Page Up/Down up/down ·
  Q/E turn · W/S tilt · A/D roll · +/− size · hold Shift for 10× steps.
- **Kaydet** writes `src/lib/scene/seat.json` (development only). Commit that file to
  publish. **Kopyala** copies the values, and **Sıfırla** returns to the saved file.

## In Detail (macro close-ups, parked)

Both sections run on one shared engine, `lib/scene/sequence.ts`, with a generic
`SequenceRig` and `ModelSequenceScene`. A new model sequence is just a
`sample()` function plus speed limits.

## Adding real assets

Everything is referenced from **`src/lib/assets.ts`**. Every slot is `null`
today and renders a placeholder; set a path and the real asset replaces it.

| Asset | Where | Notes |
|---|---|---|
| Opening footage | `ASSETS.hero.frames` | WebP frame sequence (re-export frames + re-run the cushion track if the clip changes) |
| Second watch `.glb` | `ASSETS.hero.next` | dial toward +Z; `pivot` = watch-head centre, `scale` to match the Rolex |
| Watch `.glb` | `ASSETS.showcase.watch` | dial faces +Z; `pivot` = watch-head centre (shared by the hero film and details) |
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
