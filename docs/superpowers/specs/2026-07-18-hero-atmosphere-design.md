# Hero atmosphere — design

**Status:** approved in brainstorming (2026-07-18), recipe locked, ready to plan.

## Why

The v3 hero is stark by design — a cohesive-gradient wordmark on a plain canvas. It reads clean but lands flat: JONOKANE builds in and then "just sits there." This adds one moment of *wow* to the first screen without spending the restraint the rest of the site is built on: a subtle, ethereal, animated color wash **behind the hero only**, kept pale enough that the type still pops.

It is deliberately the single ambient effect on the whole site (the About/Work/Contact sections stay stark). It draws on the parked Cold Noon "living" instinct, re-expressed in the stark language: no scene, no clock — just the site's own three accents, drifting.

## What it is (the locked direction)

**"Aurora + Fold"** — two blurred depth planes behind the lockup:

- **Far plane — aurora haze:** large, soft, drifting blobs of the three accents, heavily blurred. The ambient color field.
- **Near plane — liquid folds:** flowing translucent ribbons (layered sine bands), less blurred, so they read as *nearer* silk over the far haze. This is the depth-of-field the visitor feels.
- **Reading lane:** a soft clearing in the canvas color behind the type, its own blur feathering the edges so it melts into the field — guarantees the kicker, wordmark, and tagline always keep contrast.
- **Cursor (desktop only):** a gentle push/pull — the folds bulge toward the pointer, and both planes parallax-lean a few pixels (near plane leads). Rests to center when the pointer leaves. No "follow blob."

It is confined to the hero (`#welcome`), full-bleed, and **fades to the canvas color before the fold** so it never bleeds into About.

### The locked recipe (tunables — go in `hero-atmosphere-config.ts`)

| Knob | Value | Meaning |
|---|---|---|
| `intensity` | `1.3` | overall alpha multiplier |
| `blur` | `33` | base blur (px) |
| `variation` | `0.75` | how far the two planes' blurs spread apart |
| `depth` | `0.3` | contrast between sheer and dense |
| `lane` | `0.8` | reading-lane strength (0 = off) |
| `cursor` | `0.5` | cursor push/pull + parallax strength (0 = none) |
| `balance` | `0.8` | aurora ↔ fold (0.8 = fold-forward) |
| palette | site accents | `--about` / `--work` / `--contact`, washed |

Derived (do not hardcode; compute from the above): `farBlur = blur * (1 + 0.9 * variation)` ≈ 55px, `nearBlur = blur * (1 − 0.75 * variation)` ≈ 14px.

### Color and theme

The field is drawn from the **live accent tokens** read off computed style (`--about`, `--work`, `--contact`) so it always matches the palette and any future hand-edit. Ground is the canvas color.

- **Light:** blobs/folds drawn `source-over` at low alpha → pale tints on white.
- **Dark:** drawn with `globalCompositeOperation = "lighter"` (additive) → luminous glows on black.
- The two accent triples differ per theme (they already do in `globals.css`), so the component **re-reads the accents when `data-theme` changes** (a `MutationObserver` on `<html>`'s `data-theme`), and redraws.

## Architecture

A single decorative client component mounted inside the hero, painting two `<canvas>` planes plus a reading-lane div, driven off the **existing shared GSAP ticker** (never a second RAF loop — CLAUDE.md), throttled and paused aggressively.

```
Hero (#welcome, existing)
├─ HeroAtmosphere         (new, position:absolute; inset:0; z-index:0; aria-hidden)
│  ├─ canvas.far          (aurora haze — heavy blur)
│  ├─ canvas.near         (folds — light blur)
│  ├─ div.lane            (reading lane — canvas-color radial, blurred edges)
│  └─ div.fade            (bottom veil → canvas color before the fold)
└─ content wrapper        (existing kicker / wordmark / tagline / — position:relative; z-index:1)
```

The wordmark's now-cohesive gradient sits over the lane, which mutes the busy field behind it — the two changes reinforce each other.

### Files

- **Create `src/components/hero/hero-atmosphere.tsx`** (client) — the component: canvas refs, sizing, the ticker subscription, cursor tracking, theme re-read, IntersectionObserver/visibility pausing, reduced-motion + low-power gating. Renders the four layers. `aria-hidden`.
- **Create `src/components/hero/hero-atmosphere.module.css`** — layer positioning (overscan on the canvases so blur bleeds off-frame, not into a hard edge), the `.lane` and `.fade`, the fade-in, and the reduced-motion rule.
- **Create `src/components/hero/hero-atmosphere-config.ts`** — the recipe table above + the perf constants (`RENDER_SCALE`, `FPS`, `FADE_IN_MS`, breakpoints), each a named export with a one-line comment. The single place to tune by feel (spec §14 discipline).
- **Create `src/components/hero/atmosphere-engine.ts`** — the *pure* maths, unit-tested and free of canvas/DOM: hex→rgb parse, the plane-blur split (`planeBlurs(blur, variation)`), the aurora/fold alpha derivations from `intensity`/`depth`/`balance`, the fold displacement (`foldOffset(x, cursorX, cursorY, amp, strength)`), and the cursor easing. The component imports these; the canvas drawing (imperative `ctx` calls) stays in the component. Mirrors `gallery-engine.ts` / `work-lists.ts` house style.
- **Modify `src/components/hero/hero.tsx`** — render `<HeroAtmosphere />` as the first child of the section; wrap the existing kicker/wordmark/tagline so they layer above it.
- **Modify `src/components/hero/hero.module.css`** — give the hero content its `position: relative; z-index: 1` (or wrap), so the lockup sits over the atmosphere. No change to the build-in.

No content strings (decorative). No new dependencies.

## The performance contract (load-bearing — this is why the fans won't spin)

Jono's Mac fans spun on the *comparison mockups* (up to four full-screen retina canvases redrawing at 60fps, always on). The production effect is a fraction of that, by contract:

1. **Reduced-resolution render.** The canvases' backing stores are `RENDER_SCALE` (~0.65) × CSS size, DPR capped at ~1.5. The field is blurred 14–55px, so sub-native resolution is invisible. This is the single biggest saving (fill-rate scales with pixel count).
2. **~30fps, not 60.** The drift is slow ambient motion; 30fps is indistinguishable and halves the redraw work. Throttled inside the ticker callback.
3. **One ticker, no second loop.** Draw from the app's existing `gsap.ticker` (the one that drives Lenis). Subscribe with `gsap.ticker.add` while the hero is on screen; **`gsap.ticker.remove` when it isn't** — so the effect costs *nothing* once the visitor scrolls past the hero (i.e. most of the session). The ticker itself keeps running for Lenis regardless.
4. **Pause on `visibilitychange`.** Remove the callback when the tab is hidden.
5. **Reduced motion → one static frame.** No ticker subscription at all; draw a single pleasant still and stop. (Respects `prefers-reduced-motion`, spec §11.)
6. **Low-power / touch downgrade.** On a coarse pointer or a narrow viewport (no cursor to interact with, likely a phone), render a **single static frame** rather than animating — saves battery and GPU where the ambient drift matters least. The cursor interaction is fine-pointer-only regardless. (Threshold in the config; tune in the browser.)
7. **Fade in, don't pop.** On mount the field fades `opacity 0→1` over `FADE_IN_MS` (~1.2s) so it doesn't fight the wordmark build-in. Immediate under reduced motion.

The intent: on the hero, a couple of low-res canvases at 30fps with GPU-composited CSS blur; everywhere else, zero.

## Cursor interaction (fine pointer only)

- A `pointermove` on the hero sets a target (0..1); the component eases the live cursor toward it each frame, resting at center when the pointer leaves.
- **Folds push/pull:** near the cursor's x, each fold's y is displaced toward the cursor (a Gaussian falloff on horizontal distance, signed by whether the cursor is above/below center). Strength = `cursor`.
- **Parallax lean:** both planes translate a few px toward the cursor (`~14px * cursor`), the near plane leading the far, for depth. Applied as a canvas `transform` (composited, cheap) — never redraws.
- Disabled (with the low-power path) on coarse pointers.

## Reading-lane geometry

An elliptical radial gradient in the **canvas color**, centered on the lockup and blurred so its edge feathers into the field. It tracks the real lockup (which is left-aligned at `6vw`, vertically centered): the hero already measures the wordmark for the tagline lock, so reuse that to place the lane's center and horizontal extent; vertical extent covers kicker→tagline. Strength (`lane`, ~0.8) is the center opacity, fading to 0 by ~66% radius. In light it lightens toward white; in dark, darkens toward black — either way restoring type contrast without reading as a hard patch.

## Accessibility

The whole atmosphere is decorative: `aria-hidden="true"`, no focusable elements, no semantic content, no effect on the accessible name of the hero or the wordmark. Reduced motion is a first-class path (static frame). Contrast of the type over the field is *guaranteed* by the reading lane, not left to chance.

## Testing

- **Unit (`atmosphere-engine.test.ts`):** the pure helpers — hex→rgb parsing (incl. the token values), `planeBlurs` split (far > near, spread grows with variation, never negative), the alpha derivations (aurora falls / folds rise with balance; both scale with intensity/depth), `foldOffset` (zero far from the cursor, signed by cursor y, scales with strength), cursor easing (monotonic toward target, rests at center). These are the decisions that must stay correct; canvas drawing itself is verified by eye.
- **Browser (controller-run, both themes):** the field renders and drifts; the type stays legible (reading lane); the cursor pushes/pulls the folds and the planes lean; **the ticker callback is removed when the hero scrolls off-screen and on tab-hide** (the perf contract — verify the callback count / that no draw happens); reduced-motion shows a static frame; a narrow/touch viewport shows the static downgrade; the fade-in doesn't fight the build-in.
- Gates unchanged: `pnpm build && pnpm test && pnpm lint` green; no dead tokens; content discipline (n/a — decorative).

## Risks and mitigations

- **Performance (the headline risk).** Mitigated by the contract above; the browser pass explicitly verifies the off-screen `gsap.ticker.remove`. If a target machine still struggles, `RENDER_SCALE` and `FPS` are single-number dials, and the low-power path can widen.
- **A second RAF loop.** Explicitly avoided — the effect rides the existing GSAP ticker. This is the CLAUDE.md rule that has silently locked scrolling before; the plan must not introduce `requestAnimationFrame` or `autoRaf`.
- **Theme color drift.** The canvas must re-read accents on `data-theme` change (MutationObserver), or a dark-mode toggle leaves light-mode colors until resize. Covered.
- **Blur edges at the frame.** The canvases overscan the hero (~10% each side) so the heavy blur bleeds outside the clipped box, never showing a hard edge; the bottom `.fade` closes the seam to About.
- **Reading lane tracking.** It must follow the lockup across viewport sizes; measured placement (reusing the hero's existing measurement) rather than a hardcoded position.
- **Build-in interaction.** The fade-in keeps the field from popping during the ~1.5s wordmark build; the atmosphere never transforms or gates the lockup.

## Out of scope (for now)

- Any atmosphere on sections other than the hero.
- A "warm" palette (the mockup carried it for comparison; production ships the site accents).
- **A richer cursor model.** The gentle push/pull + parallax lean is the version we ship. We explored a lot further in mockups (2026-07-18) — flow-field domain warp, a persistent vortex/lens/tilt, light-based bloom/trail/ripple, and finally a two-plane particle "Motes" treatment (soft **bokeh** orbs behind + crisp **sparks** in front, gathering and swirling toward the cursor over the aurora bed). The Motes direction was the clear winner and is genuinely beautiful, **but Jono parked it deliberately: a live particle field pulls against v3's core value of beautiful simplicity, where the type should lead and the background should stay quiet.** It is preserved intact as the vetted "if we ever want more" option — mockup artifact: `https://claude.ai/code/artifact/5a6079b6-1474-4692-a54e-ddacf61f96df` (studio last left on Motes · bokeh + spark). This is a hold, not a rejection; do not rebuild the exploration, and do not add particles to the shipped hero unless Jono re-opens it.
