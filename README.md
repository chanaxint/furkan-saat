# Furkan Saat — Homepage (v1)

Multi-house luxury watch retailer. Cinematic editorial homepage built with
**Next.js 16 · React 19 · GSAP ScrollTrigger · Lenis**.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
```

## Page structure

| #  | Section            | Component                                  |
|----|--------------------|--------------------------------------------|
| —  | Opening film       | `sections/intro/HeroIntro`                 |
| 01 | Selected watches   | `sections/FeaturedWatches`                 |
| 02 | Brands             | `sections/BrandReels`                      |
| 03 | Collections        | `sections/CollectionsSection`              |
| 04 | Trust              | `sections/TrustSection`                    |
| 05 | Private viewing    | `sections/Boutique`                        |
| 06 | Journal            | `sections/JournalSection`                  |
| —  | Final CTA · Footer | `sections/FinalCTA` · `layout/Footer`      |

## Design system

- Tokens, type scale, spacing, motion curves: `src/app/globals.css`
- Palette: `#071A16` green · `#F2EDE3` ivory · `#C8B99A` champagne · `#5A1018` wine
- Type: Cormorant Garamond (display) + Inter Tight (UI), self-hosted in `public/fonts`
- Reusable UI: `ArrowLink`, `SplitText`, `Reveal`, `SectionMarker`, `MediaSlot`

## Motion architecture

- `providers/SmoothScroll` — Lenis on GSAP's ticker (wheel only; touch stays native)
- `lib/gsap.ts` — single plugin registration
- `prefers-reduced-motion` disables Lenis, scroll choreography and the opening hold

## Opening film

`sections/intro/HeroIntro` — the film is `public/assets/video/intro/`
(`intro-1080.mp4` + `intro-1080.webm`, `intro-720.mp4` for phones, `intro-poster.webp` = first frame),
registered in `ASSETS.intro.film`.

1. **idle** — the first frame, "Aşağı kaydırın" at the bottom. The page is held at the top.
2. **playing** — the first scroll (wheel, swipe, ↓/Space or a tap on the cue) plays the film once.
3. **line** — as it ends the film dims and *İstediğiniz her saat* fades in (blur → sharp).
4. **mark** — the line leaves and *Furkan Saat* arrives, with a hairline beneath.
5. **done** — the page is released; the navigation returns once it scrolls on. Scrolling continues through
   the blend band, where drifting mists of black and green mix before the green site.

Timings are `LINE_MS` / `MARK_MS` in the component. Arriving mid-page (back button)
or with reduced motion skips the hold. To change the film, replace the three files
(same names) or update `ASSETS.intro.film`.

## Adding real assets

Everything is referenced from **`src/lib/assets.ts`**; a `null` slot renders a placeholder.

| Asset | Where | Notes |
|---|---|---|
| Opening film | `ASSETS.intro.film` | `.mp4` (H.264, no sound) + phone version + poster |
| Boutique film | `ASSETS.boutique.film` | `.webm` + `.mp4` + poster |
| Product photos | `images` on each watch in `lib/data/products.json` | `.webp`, 4:5 |

Set `SHOW_ASSET_HINTS = false` in `lib/assets.ts` to hide the small placeholder captions.

