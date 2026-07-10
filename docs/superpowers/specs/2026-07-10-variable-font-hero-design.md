# Variable-Font Hero Wordmark — Design

_2026-07-10 · Status: approved (brainstorm with Jono, validated in live browser prototypes)_

## Overview

The homepage hero's "Jono Kane" wordmark becomes the site's "wow" moment: each
letter independently animates through the weight axis of **TotalBlack
Variable** (Adobe Fonts), from Thin 170 to Display 1000. Two drivers compose:

1. **Ambient loop** — every letter perpetually eases toward a new target
   weight, rests, and retargets, on randomized desynchronized timing.
2. **Cursor interaction ("carve")** — pointer proximity presses letters toward
   Thin with a radial falloff and a liquid response lag; the ambient motion
   keeps living underneath and resumes seamlessly.

The layout **breathes**: letters keep natural spacing, so the word expands and
contracts organically as glyph widths change (validated against a fixed-slot
alternative and preferred).

This is the hero **for now**; a 3D layer (R3F) stays parked in `PLAN.md` as a
possible future evolution. The wordmark must therefore be a self-contained
component that something could later sit behind.

## The font

- Family: `totalblack-variable`, Adobe Fonts kit `aqv1jgr`
  (`https://use.typekit.net/aqv1jgr.css`).
- One variable axis: `wght` 170–1000 (named instances Thin 170 → Display 1000),
  default 400. ~31 KB woff2, 203 glyphs.
- **License requires serving from Adobe's CDN.** No self-hosting. The woff2
  downloaded during brainstorming (`.superpowers/…/totalblack.woff2`) is a
  prototype artifact only and must not ship.
- Kit domain list must allow `localhost`, `*.vercel.app`, and `jonokane.com`
  (Jono to verify in Adobe Fonts settings at implementation time).

## Tuned parameters (validated in the live playground)

These are the approved starting values; they live in `hero-config.ts` and are
expected to drift as Jono tunes.

```ts
ambient: {
  duration: 1800,     // ms per weight move
  variancePct: 70,    // ± tempo randomness per move
  hold: 950,          // avg ms rest at a weight (actual: hold × (0.5 + rand))
  biasPct: 70,        // probability a move swings to the opposite extreme
  wmin: 170,          // weight floor
  wmax: 1000,         // weight ceiling
  ease: 'cubicInOut',
  staggerMs: 140,     // per-letter start offset when the loop wakes
},
hover: {
  mode: 'carve',      // cursor presses letters toward Thin ('swell' = toward Display)
  radius: 240,        // px influence radius from letter center
  strengthPct: 100,   // influence at distance 0
  lagMs: 220,         // exponential smoothing time-constant for influence
  falloff: 'smooth',  // cosine shoulder ('linear' | 'sharp' also supported)
},
reducedMotion: {
  weights: [1000, 300, 700, 170, 900, 400, 1000, 250], // frozen J,o,n,o,K,a,n,e — tunable
},
```

## Architecture

```
src/lib/hero-config.ts                 Typed config (above) — single source of truth
src/lib/wordmark-engine.ts             Engine: pure TS, no React, no DOM queries beyond
                                       the letter elements it is handed
src/components/hero-wordmark.tsx       Client component: spans, pointer tracking,
                                       font gating, engine lifecycle
src/components/wordmark-tune-panel.tsx Dev-only slider panel
src/app/page.tsx                       Hero h1 renders <HeroWordmark />
```

### Engine (`wordmark-engine.ts`)

Direct port of the validated prototype math.

- Per-letter state: `{ from, to, startTime, duration, ambientWeight, influence }`.
- `retarget(letter, now)`: with probability `biasPct`, the next target is the
  extreme (wmin/wmax) *farther* from the current weight, ±4% jitter; otherwise
  uniform random in [wmin, wmax]. Duration = `duration × (1 − v/2 + rand·v)`
  where `v = variancePct/100`. Next start = `now + hold × (0.5 + rand)`.
- `update(now, dt)`, registered on **`gsap.ticker`** (the repo's single
  canonical RAF loop — no second loop, per `CLAUDE.md`):
  1. Advance `ambientWeight` along the eased move (cubic in-out).
  2. Compute raw cursor influence from pointer→letter-center distance
     (`getBoundingClientRect` per letter per frame — fine at 8 letters),
     falloff-shaped, scaled by `strengthPct`. Zero when pointer inactive.
  3. Smooth: `influence += (raw − influence) × (1 − e^(−dt/lagMs))`.
  4. Blend: `w = ambientWeight + (hoverTarget − ambientWeight) × influence`
     where `hoverTarget` is wmin (carve) or wmax (swell); clamp to [170, 1000];
     write `font-variation-settings: 'wght' <w>` to the span.
- API: `createWordmarkEngine(letterEls, config) → { start, stop, updateConfig }`.
  RNG and clock injectable for unit testing. No React imports.

### Component (`hero-wordmark.tsx`)

- Splits "Jono Kane" into per-letter `<span aria-hidden>` inside the existing
  hero `<h1 aria-label="Jono Kane">`; real text stays in the DOM for SEO;
  screen readers announce the name exactly once.
- Tracks `pointermove`/`pointerleave` on the hero section, feeds the engine.
- Skips the pointer layer entirely when `matchMedia('(hover: none)')` — touch
  devices get ambient-only.
- Owns engine start/stop lifecycle (mount, unmount, visibility — see below).

### Config + dev tune panel

- `hero-config.ts` exports the typed, commented config object.
- `wordmark-tune-panel.tsx`: floating panel with the same sliders as the
  brainstorm playground (both ambient and hover groups), mutating the live
  engine via `updateConfig`, plus a **copy-JSON** button to paste final values
  back into `hero-config.ts`. Gated behind `process.env.NODE_ENV ===
  "development"` so it is tree-shaken from production builds.

## Font loading

- Kit stylesheet in `layout.tsx` with a `<link rel="preload" as="style">` hint
  ahead of the stylesheet link.
- The wordmark mounts invisible and the entrance is gated on `document.fonts`
  confirming TotalBlack is ready — it must never appear in a fallback font with
  variation settings applied.
- Timeout fallback (~3 s): if the font never arrives, show the name static in
  the fallback stack and never start the engine. A broken animation is worse
  than none.

## Entrance

The hero keeps its current Motion fade/rise choreography. Letters mount at
weight 400; after the entrance completes, the ambient loop wakes with the
140 ms per-letter stagger — the wordmark arrives composed, then comes alive.

## Reduced motion

`prefers-reduced-motion: reduce` → engine never starts; letters render the
static `reducedMotion.weights` composition (a designed frozen frame that still
shows the font's range). A live media-query listener switches modes if the OS
setting changes mid-visit. This satisfies the `CLAUDE.md` accessibility bar.

## Performance

- 8 letters × one inline-style write per frame; breathing layout means reflow
  is inherent and accepted — trivial at this node count.
- RAF stops in background tabs (browser behavior).
- IntersectionObserver stops the engine while the hero is scrolled out of
  view, so it never competes with scroll choreography further down the page.

## Out of scope

- Scroll-driven weight changes and load-in "scramble" choreography
  (considered, rejected as drivers).
- Fixed-slot layout (rejected in A/B).
- 3D hero layer (parked in `PLAN.md`).
- Using the wordmark outside the hero (engine is reusable by design, but no
  other placement ships now).

## Verification

1. `pnpm build` passes clean.
2. Real-browser pass: ambient feel matches the approved playground settings;
   carve interaction matches; touch device (or DevTools emulation) gets
   ambient-only; `prefers-reduced-motion` shows the frozen composition;
   throttled/blocked font shows the static fallback after ~3 s.
3. Reduced-motion and font-fallback paths never flash a broken state.

## Follow-ups recorded in PLAN.md

- Hero concept: **decided** — variable-font wordmark (this spec).
- 3D/R3F: moves from "open decision" to "parked — possible future layer
  behind the wordmark."
- Jono: verify Adobe Fonts kit domain list (`localhost`, `*.vercel.app`,
  `jonokane.com`).
