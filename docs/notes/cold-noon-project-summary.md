# jonokane.com — "Cold Noon" Project Summary

> A high-level snapshot of the cyberpunk visual pivot: the aesthetic, how things
> are styled and animated, what we've explored, what worked and what didn't.
> **Date:** 2026-07-15 · **Branch:** `cold-noon-visual-language` (not merged)

---

## What it is

**jonokane.com** — Jono Kane's personal design/career portfolio, mid-pivot from a
bright "living sky" into a cyberpunk register we call **"Cold Noon."** It's a
one-pager (Welcome → About → Work → Contact) plus dedicated `/work/[slug]` detail
pages.

**Stack:** Next 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4
(CSS-first, tokens in `globals.css`) · MDX content via Velite · Motion + GSAP +
Lenis · pnpm · Vercel.

---

## The aesthetic — "Cold Noon"

The thesis: **two kinds of beautiful, both wrong.**

- **NIGHT = the street** (Ash Thorp / Neuromancer): grimy, neon-bleed, haze-glow,
  seductive and filthy — *alive*.
- **DAY = the lab** (Chris Cunningham's *All Is Full of Love*): high-key,
  blown-out, clinical, silent — *not built for people*.

The clock *means* something — midnight seduces you, noon exposes you. The anchor
reference is the *Blade Runner 2049* sea-wall: near-monochrome, luminous gray,
colossal, desolate. The insight that made it tractable: **brightness was never
the enemy — cuteness was.** Ambiguity, not villainy. Certainly not cute.

---

## How it's styled (the architecture)

- **The living sky is the engine.** 8 time-of-day keyframes → one pure function
  (`applySceneToRoot`) interpolates them and writes ~24 CSS custom properties
  onto `<html>`, sampled once a minute. **Everything scene-colored reads those
  vars.** No RAF anywhere in this system.
- **Materials flip with the clock.** The slab is *one* material that turns over:
  near-solid dark "street" slab by night, light frosted "lab" panel by day —
  with text (`--slab-ink`/`--slab-sub`) computed to contrast the *slab itself*,
  so in-slab copy reads at every hour (this was the fix for text going invisible
  at daytime).
- **Sky FX layer:** fine film grain (analog signal-decay), god rays from the
  sun/moon, drifting smog + clouds, a celestial veil that dissolves the disc
  into the haze. All CSS-animated, gated by per-hour weights (`--w-*`) × global
  tune knobs (`--fx-*`).
- **Two `?tune` panels** (dev-only, `localhost:3000/?tune`): scene colors +
  sky FX. Dial live, "copy values," paste into config — same workflow for both.
- **Conventions:** design decisions live in **CSS tokens**; content lives in
  **MDX / `site-content.ts`**, never in JSX.

---

## How it's animated

- **One RAF loop.** Lenis (smooth scroll) + GSAP ScrollTrigger share a single
  ticker. "No second RAF loop" is a hard rule — a stray one has silently locked
  scrolling on this site before.
- **The decode / terminal language:** text scrambles in with a cyan block cursor
  (`JONOKANE_`) — the signal motif that threads the whole thing together, echoed
  by the ambient sky grain.
- **Slab build-in:** two tiers — hero slabs *Split* open from a cyan seam then
  decode their content; secondary slabs *Sweep* in quietly. Uses
  `transform: scaleX` via the Web Animations API (clip-path was proven to jump).
- Reveals **fire on settle** (central-viewport band) and **slower**, so you can
  actually watch them. Reduced-motion is respected throughout.

---

## What we explored — what worked, what didn't

| Explored | Verdict |
|---|---|
| Muted-gray "Cold Noon" noon vs a bright day | ✅ Landed here — gray is more captivating than cheerful |
| Dark-always slab material | ❌ Text invisible at day → replaced with the **frosted-flip** slab (✅) |
| Flat CSS-vector megastructure / city | ❌ Read as "weird slashes" / bar-chart — flat vectors can't fake a city → **parked for real 3D post-launch** |
| Transports (flying craft) | ❌ "Slashes with dots" → parked |
| God rays / smog / clouds / grain / veil | ✅ The stars of the sky — but rays needed a day/night split, sun-tracking, irregular shafts, disc-occlusion; the veil needed to be sky-colored (dark-ring bug) |
| The Pass (rare light streak) | ⚠️ Built + fully gate-able; lukewarm, so it can go to zero |
| Horizontal pinned "shelf" for Work | ❌ Scroll-jacked, disorienting, reveals missed → replaced with a **vertical stacked read** |
| On-sky text at dawn/dusk (wordmark, titles) | 🔧 **Unsolved** — floats muddy on the open bright sky; needs a legible "ground." Current open problem |

---

## The most important lesson

Early on, verification checked **mechanism** (DOM state, clean console, "tests
pass") and called things done — and shipped code that was *correct* but looked
*awful* at daytime, because nobody looked at the actual pixels. The corrected
process, used since: **build → render at day *and* night → look at the pixels →
adjust**, with screenshots shown to Jono. Lighter ceremony for visual work;
heavyweight code-review is blind to craft.

---

## Where it stands / open threads

- **Shipped & working:** the living sky, Cold Noon palette, frosted-flip
  materials (slab legibility fixed), sky FX + tune panels, decode + slab
  reveals, the vertical Work section.
- **Open right now:**
  - Whether 7 full studies stacked (~20k px) stays, or trims to intros +
    "read the full study →" links to the detail pages.
  - The intro title/impact on-sky legibility (same problem as the hero wordmark).
- **Parked / next — the hero ("Plan B2"):**
  - the arrival choreography (boot-static → signal-collapse → wordmark assembles),
  - the **Config** wordmark + centered width-justified lockup,
  - the on-sky **legibility ground**.
- **Deploy blockers (on Jono):** Adobe font-kit domains, `RESEND_API_KEY`,
  résumé URL, real case-study content, and the merge decision.

---

## Governing docs

- Spec: `docs/superpowers/specs/2026-07-14-cyberpunk-visual-language-design.md`
- Prior spec (superseded in part): `docs/superpowers/specs/2026-07-11-site-experience-design.md`
- Repo guide: `CLAUDE.md` · Roadmap: `PLAN.md`
