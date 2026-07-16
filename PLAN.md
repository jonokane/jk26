# jonokane.com — Rebuild Plan

_Last updated: 2026-07-16_

## Goals

A rebuild of jonokane.com, Jono's personal design/career portfolio. The old site's content had drifted — rambly, unfocused, out of date. Three goals drive this rebuild:

1. **Content.** Rewrite everything. Sharpen the story, add focused new case studies, cut the ramble.
2. **Design.** Raise the craft bar well above the old site.
3. **Motion.** A "wow" experience — a hero that makes visitors stop scrolling. Motion is essential, not decoration.

Constraint: no CMS or database. Content is version-controlled MDX.

## Stack (decided & scaffolded)

Next.js 16 on Vercel · TypeScript · Tailwind v4 · MDX via Velite · GSAP/ScrollTrigger + Lenis · pnpm. See `CLAUDE.md` for how it all fits together.

## The design — jk26-v3, "stark"

The governing spec is **`docs/superpowers/specs/2026-07-16-stark-visual-language-design.md`**. It implements the handoff in `docs/notes/jk26-v3-handoff/` (prototypes + design system, authored with Claude Design).

Stark white (light) / pure black (dark), carried entirely by type and motion. One accent per section — green (About), violet (Work), teal (Contact) — never mixed. Almost no chrome; no icons or illustrations, the design is type-only by rule.

**Why the pivot.** Two prior directions are parked. The second, "Cold Noon", derived every colour from the visitor's clock and was killed on sight: layout read amateur, colours went muddy and illegible, motion stayed clunky, and it read "video game like". The diagnosis that governs v3: **a design that must hold at every hour is optimised for no hour.** There is no clock in this codebase now.

The site is a one-pager — **Welcome → About → Work → Contact** — with `/work/[slug]` case study pages as the canonical share/SEO surface and the reduced-motion reading path. (The old time-aware Farewell section is cut; its premise was the clock.)

## Current state (2026-07-16)

**Phase 1 — foundation (complete, on branch `jk26-v3`, unmerged).** The entire time-of-day system removed (60+ files: sky layers, scene engine, keyframes, collector, shelf, old hero engines). In its place: two hand-authored locked palettes, a three-face type system (Mae / Config Mono / Config Variable, kit `aqv1jgr`), and a theme system — OS default, nav toggle, choice persisted, and an inline `<head>` script so dark never flashes white. Every real word still renders; case studies needed no migration. 56 tests, build + lint clean. Plan: `docs/superpowers/plans/2026-07-16-jk26-v3-foundation.md`.

**Kept and reused:** the Velite pipeline and all `content/**`, the Lenis+GSAP single-ticker integration, the Resend contact route, the case-study components, `url-label`, `work-lists`/`work-data`.

**Deliberately unfinished:** Welcome, About, Work and Contact render as plain stubs holding real copy and their anchors. Later phases rebuild them.

## Roadmap

1. ~~**Repo hygiene**~~ · ~~**Design system**~~ · ~~**Hero + header**~~ _(pre-pivot, in `archive/cold-noon`)_
2. ~~**Phase 1 — v3 foundation**~~ _(done 2026-07-16)_
3. **Phase 2 — Welcome + nav morph.** Per-letter build-in, the living gradient (it stays on the landed nav mark), the scroll-scrubbed FLIP morph on the kept `use-wordmark-morph.ts` — which reclaims `header-on` from Phase 1's temporary ScrollTrigger stand-in in `site-header.tsx`. Fix the prototype's reduced-motion bugs (wordmark left 2.5× scaled + blurred; accessible name lost with the motion path; ungated `drift`).
4. **Phase 3 — About teleprompter.** `content/site/about.mdx` + a markdown-emphasis tokeniser (`**bold**` → emphasised, `*italic*` → italic), `teleprompter-config.ts` for every tunable, the sticky 640vh stage. **Build the prototype's real behaviour, not the README's paraphrase**: unmarked words take the *accent*, emphasised words go to *ink* at wght 780 (spec conflict register #5).
5. **Phase 4 — Work.** The filterable vertical index first, then the horizontal gallery, then the `@modal` intercepting route + its scroll lock. Derive the wrapper height from measured track width (the prototype's hardcoded `520vh` silently drifts).
6. **Phase 5 — Contact + polish.** Restyle onto the new tokens (keep the working Resend route), remaining prose to `content/site/`, meta/OG, full a11y + reduced-motion audit.

## Open decisions & known items

- **The dark palette is unlocked.** `--about: #57c46a` / `--work: #9d86f0` / `--contact: #5ab6cb` clear 7-9.5:1 on black but are authored, not designed — Jono intends to iterate them by hand. Both palettes sit adjacent in `globals.css`; changing a hex touches no logic.
- **Phase 3 stub artifacts:** the About statements are clamped to `max-width: 30ch` (too narrow — the prototype runs them near full-width), and the title renders "About" where the prototype's locked title is "Who I am."
- **Phase 5 content question:** spec §12 wants the footer to read "LinkedIn / Read.cv / Résumé", but `site-content.ts` has no `readcv` key and has `collaya` instead. Reconcile with Jono.
- **Dead copy in `site-content.ts`** — safe to cut whenever a phase next edits it: `about.trayHint`, `about.ctas`, `about.secondary`, `work.shelf.*`. **Do not cut `links.linkedin`/`collaya`/`resume`** — they read as dead only because Phase 5's contact footer isn't built yet.
- **`shelf-math.ts` is gone**, despite spec §13 listing it as "repurposed" for Phase 4's gallery. Recover from `archive/cold-noon` if wanted.
- **Merge decision is Jono's.** `jk26-v3` is unmerged; `main` is untouched.

## Content intake (the critical path)

Content is the biggest lever and the main thing gating Phases 3 and 4. Outstanding items, tracked in `docs/notes/jonokane-case-studies.md`:

- **Collaya, Tappa, Meta Project 01, Meta Project 02** — entirely TBD. These are the four headline slots (`order` 1-4), currently `draft`.
- **Amazon Key In-Home** — needs Jono's specific role on the in-home flow, plus any citable outcome. Held as `draft: true`.
- **8tracks / Fluence** — outcomes are qualitative because no metric was shareable. Swap in a metric if one becomes citable.
- **Résumé link** — `siteContent.links.resume` is empty.
- **Case-study screens** — none yet. `.wshot`/`.dshot` ship as hatched placeholders; the optional `cover` field already exists in the schema, so a real screen drops in with no code change.

## Deploy blockers (on Jono)

- **Adobe Fonts kit `aqv1jgr`** needs `*.vercel.app` and `jonokane.com` added to its allowed domains, or Mae, Config Mono, and Config Variable will not load in production.
- `RESEND_API_KEY` for the contact route.
- The merge decision above.

## Parked

- **Cold Noon** (cyberpunk / time-of-day) and, inside it, the diurnal living sky and the Area/TotalBlack hero: tag `archive/cold-noon`. Run with `git switch --detach archive/cold-noon && pnpm install && pnpm dev`.
- **3D hero layer.** Still parked; nothing 3D is installed. Cold Noon's flat CSS-vector city read as "weird slashes" — if this returns it should be real 3D.
