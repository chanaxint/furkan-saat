# Furkan Saat — Homepage (v1)

Multi-house luxury watch retailer. Cinematic editorial homepage built with
**Next.js 16 · React 19 · Three.js / React Three Fiber · GSAP ScrollTrigger · Lenis**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run preview    # production build on http://localhost:4321 — judge smoothness here, not in dev
npm run typecheck
```

## Page structure

| #  | Section            | Component                                  |
|----|--------------------|--------------------------------------------|
| —  | Opening film       | `sections/intro/HeroIntro`                 |
| 01 | Featured brands    | `sections/BrandReels` + `BrandTile` (4 logo tiles) |
| —  | Campaign           | `sections/home/CampaignHero` (photo, "FURKAN" behind the model via a cut-out) |
| —  | Name band          | `sections/home/Marquee`                    |
| —  | Haftanın Saatleri  | `sections/home/ShopRow` (featured, 5 edge to edge) |
| —  | Yeni Gelenler      | `sections/home/ShopRow variant="centred"` (collection) |
| 02 | Collections        | `sections/CollectionsSection`              |
| 03 | Trust              | `sections/TrustSection`                    |
| —  | Private viewing    | `sections/Boutique`                        |
| 05 | Journal            | `sections/JournalSection`                  |
| —  | Final CTA · Footer | `sections/FinalCTA` · `layout/Footer`      |

The campaign photo is `public/assets/images/campaign/zamansiz.webp`; `zamansiz-model.webp` is the
same photo with the wall made transparent (GrabCut), laid on top so the giant name passes behind
the model. To change the photo, replace both files (or drop the cut-out to keep the name in front).

## Design system

- Tokens, type scale, spacing, motion curves: `src/app/globals.css`
- Palette: `#071A16` green · `#F2EDE3` ivory · `#C8B99A` champagne · `#5A1018` wine
- Type: Playfair Display (display, italic for accents) + Jost (UI, body, prices), self-hosted in
  `public/fonts`; the ₺ sign comes from a one-glyph subset (`lira-sign.woff2`), as neither face
  draws it. Lining figures throughout.
- Reusable UI: `ArrowLink`, `SplitText`, `Reveal`, `SectionMarker`, `MediaSlot`

## Motion architecture

- `providers/SmoothScroll` — Lenis on GSAP's ticker (wheel only; touch stays native)
- `lib/gsap.ts` — single plugin registration
- `prefers-reduced-motion` disables Lenis, scroll choreography and the opening hold
- Performance rules: no blur filters or blend modes on large or moving layers (soft shapes are
  drawn with gradients); backdrop blurs only while an element is visible; ambient motion is
  transform-only. Lenis uses `lerp` so the wheel is answered at once.

## Site loader

`layout/SiteLoader`, on the first load of every page (not /yonetim): "Furkan Saat", then a
hairline ring with "Loading" that fills as the fonts, the opening film's first frame and the
film itself load (at least 2.8 s, at most 9 s). On the home page the ring then travels onto
the bezel of the watch in the film's first frame as the black lifts
(`ASSETS.intro.film.dial`, measured on the poster); elsewhere it fades. The intro cannot be
started while it is up.

## Opening film

`sections/intro/HeroIntro` — the film is `public/assets/video/intro/`
(`intro-1080.mp4` + `.webm`, `intro-720.mp4` for phones, `intro-poster.webp` = first frame,
and the same film reversed: `intro-*-reverse.*`), registered in `ASSETS.intro.film`.

1. **idle** — the first frame, "Aşağı kaydırın" at the bottom. The page is held at the top.
2. **playing** — the first scroll (wheel, swipe, ↓/Space or a tap on the cue) plays the film once.
3. **line** — on the last frame the film cuts to black and *İstediğiniz her saat* is there at once.
4. **mark** — the line gives way to *Furkan Saat*, with a hairline beneath.
5. **done** — the page is released; the navigation returns once it scrolls on. Scrolling continues
   through the blend band (black clouds and green clouds mixing) which ends on exactly
   `--green-900`, the ground of the first section, so the site continues in the same green.
6. **rewinding** — scrolling back up at the top removes the titles and plays the reversed film
   (2× speed) back to the first frame; the next scroll down plays it again.

**Sound** (`lib/sound/introSound.ts`, synthesised with Web Audio, no files): watch ticks that
keep accelerating with the film over a rising swell and a low drone, a deep hit on the cut to
black, a soft chime with the name, and the ticks slowing down on the rewind. No controls and no
text about it anywhere. Browsers only allow sound after the visitor has clicked, tapped or
pressed a key (a mouse-wheel scroll alone does not count; on phones a swipe on the held intro
counts as a tap); from then on it joins the film where it is.

**Brand tiles:** each shows the brand's logo (`logo` in `lib/data/brands.ts`, ivory on
transparent PNGs in `public/assets/images/brands/`). The section rises into the blend (`--overlap` in `BrandReels.module.css`), so its title sits
among the clouds.

**Scrollbar:** on mouse/trackpad screens the browser's bar is hidden and `layout/ScrollLine`
draws a hairline on the right (drag the thumb, or click the line to jump). Touch screens
keep their own. Dragging it during the intro hold starts the film.

Timings are `LINE_MS` / `MARK_MS` / `REWIND_RATE` in the component. Arriving mid-page
(back button) or with reduced motion skips the hold. To change the film, replace the
files (same names) or update `ASSETS.intro.film`.

## Brand pages: film opening, 3D showcase, gold theme

Set on the brand in `lib/data/brands.ts` (Freelook has the film and the gold theme; the 3D
showcase is ready but not used on any brand for now):

- `film` — loops silently, full screen, behind the logo (`components/brand/BrandFilmHero`);
  pauses once scrolled fully out of view. The watches follow it directly (the story block is
  only shown on brand pages without a film).
- `showcase` — after the film the watch flies in and makes four turns, each with its line
  (`components/brand/BrandShowcase` + `three/ShowcaseWatchScene`, timeline in
  `lib/scene/showcase.ts`). `model` is a meshopt-compressed `.glb` in `public/assets/models/`,
  `pivot` the centre of the watch head, `beats` the four poses (`pose(x, y, z, yaw°, pitch°, roll°)`)
  and their lines. The 3D layer loads a screen ahead and only renders while on screen.
- `theme: "gold"` + `pageLogo` — white and gold page, gold logo.

Models are compressed with gltf-transform:
`gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp --texture-size 2048 --simplify-ratio 0.5 --simplify-error 0.0004`

## Adding real assets

Everything is referenced from **`src/lib/assets.ts`**; a `null` slot renders a placeholder.

| Asset | Where | Notes |
|---|---|---|
| Opening film | `ASSETS.intro.film` | `.mp4` (H.264, no sound) + phone version + poster |
| Boutique film | `ASSETS.boutique.film` | `.webm` + `.mp4` + poster |
| Product photos | `images` on each watch in `lib/data/products.json` | `.webp`, 4:5 |

Set `SHOW_ASSET_HINTS = false` in `lib/assets.ts` to hide the small placeholder captions.

