# CLAUDE.md

Guidance for working in this repo. Read `PLAN.md` for the project's goals, roadmap, and open decisions.

## What this is

Personal design/career portfolio for **Jono Kane** (jonokane.com). A ground-up rebuild of an old site — sharper content, higher craft bar, and motion as a first-class feature. Case studies live as typed MDX files; there is deliberately **no CMS or database**.

**This is jk26-v3, the stark visual language.** Two earlier visual directions are parked, not deleted (see *History* below). The governing spec is `docs/superpowers/specs/2026-07-16-stark-visual-language-design.md` — read it before changing anything visual. The design it implements came from the handoff in `docs/notes/jk26-v3-handoff/` (prototypes + a design system, authored with Claude Design).

The site is a one-pager (`/`) — Welcome → About → Work → Contact — with dedicated case study pages at `/work/[slug]`.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, Turbopack, React 19 |
| Language | TypeScript |
| Styling | Tailwind v4 (CSS-first: config lives in `src/app/globals.css` via `@theme`, not a JS config file) |
| Content | MDX compiled + type-checked by **Velite** |
| Motion | Motion (`motion/react`) for component animation; GSAP + ScrollTrigger for scroll choreography; Lenis for smooth scroll |
| Package manager | **pnpm** (do not use npm/yarn) |
| Deploy | Vercel |

## The design in one paragraph

The previous version derived every colour from the visitor's clock. It was killed because **a design that must hold at every hour is optimised for no hour** — layout read arbitrary, colours went muddy, text struggled to stay legible. v3 removes the variable: a stark white (light) / pure black (dark) canvas, carried entirely by type and motion, with one accent per section and no chrome to speak of. **There is no clock anywhere in this codebase. Do not reintroduce one.**

## Commands

```bash
pnpm dev      # Velite builds content in watch mode, then next dev
pnpm build    # Velite build, then next build (run this to verify before committing)
pnpm test     # vitest unit tests — already non-watch; do NOT append `run`
pnpm start    # serve production build
pnpm lint     # eslint
```

> `package.json` declares `"test": "vitest run"`. `pnpm test run` passes `run` as a *filename filter*, matches nothing, and exits 1. Use `pnpm test`, or `pnpm test <path>` for one file.

## Package management

This project uses **pnpm** — always. Do **not** run `npm install`/`npm run` here: npm would create a competing `package-lock.json` and a flat, non-strict `node_modules`, defeating pnpm's phantom-dependency protection. The `packageManager` field in `package.json` pins the pnpm version; Vercel auto-detects pnpm from `pnpm-lock.yaml`.

| Task | Command |
|---|---|
| Install all deps | `pnpm install` |
| Add a dependency | `pnpm add <pkg>` |
| Add a dev dependency | `pnpm add -D <pkg>` |
| Remove a dependency | `pnpm remove <pkg>` |
| Run a script | `pnpm <script>` |
| One-off tool (npx equivalent) | `pnpm dlx <tool>` |

## How it fits together

- **Content pipeline.** `.mdx` files in `content/` are validated against the schemas in `velite.config.ts` and compiled into `.velite/` (git-ignored, regenerated). Two collections: `work` (case studies, `content/work/`) and `earlier` (one-paragraph entries, `content/earlier/`). Import typed data from `#site/content`. **`work-lists.ts` holds pure list logic; `work-data.ts` is the two-line glue that applies it to `#site/content`** — import `publishedWork` from `work-data`, not `work-lists`.
- **Velite runs from `next.config.ts`**, not a webpack plugin — intentional, so it works under Turbopack. Don't move it to a bundler plugin.
- **MDX rendering.** `src/components/mdx-content.tsx` executes the compiled MDX body. Register custom components in its `mdxComponents` map.
- **Smooth scroll + GSAP.** `src/components/smooth-scroll.tsx` wraps the app and drives Lenis from GSAP's ticker so both share one synchronized RAF loop. This is the canonical integration — build scroll choreography with ScrollTrigger on top of it; **don't add a second RAF loop** or `autoRaf`. It reads the Lenis instance via `useLenis()`, **not** off `ReactLenis`'s ref: `ReactLenis` constructs Lenis inside its own effect and publishes it a render later, so a ref read in a mount-only effect finds nothing, never re-runs, and the ticker never gets wired — silently locking scrolling site-wide. Don't "simplify" it back to a ref.
- **GSAP plugins** are registered once in `src/lib/gsap.ts` (guarded against SSR). Import `gsap`/`ScrollTrigger` from there.
- **Colour: two locked palettes.** `globals.css` declares them adjacent — light on `:root`, dark on `:root[data-theme="dark"]` — same tokens in the same order. **Nothing is derived, computed, or generated from anything else: a hex is a hex.** A unit test (`globals.css.test.ts`) fails the build if `color-mix`/`oklch`/`calc` ever appears in a palette. Both are hand-edited by Jono; changing a colour must never require touching logic.
- **Theme.** `theme-engine.ts` is a pure resolver (an explicit `localStorage` choice beats `prefers-color-scheme`; anything unrecognised follows the OS). `pre-hydration-theme.ts` builds an inline script that stamps `data-theme` on `<html>` **before first paint**, so dark never flashes white — its storage key and media query are *serialised from the engine*, so the two cannot drift, and a test pins them. Because it mutates `<html>` pre-hydration, `<html>` carries `suppressHydrationWarning`.
  - **The script must live in a real `<head>` as a plain synchronous `<script>`.** `next/script`'s `beforeInteractive` looks right and is not: it was measured landing mid-`<body>`, ~13KB *after* the first page text, so the browser could paint light before it ran. Next's own docs say `beforeInteractive` "does not block page hydration" and their *Preventing flash before hydration* guide prescribes exactly this pattern. Verify placement in the **served HTML** (`curl`), not by reading the JSX.
- **Type: three faces, one role each**, all from Adobe Fonts kit `aqv1jgr` (embedded in `layout.tsx`). **Mae Variable** = display + body. **Config Mono** (`config-mono-vf`) = eyebrows, labels, counters, meta, tags, the theme toggle. **Config Variable** = the wordmark *only*. A base `font-variation-settings: 'wght' 400` on body and mono keeps the variable faces off their thin defaults.
- **The header.** `src/components/site-header.tsx` — nav pill + scroll-spy, revealed by `header-on` on `<html>`. It currently drives `header-on` itself via a **temporary** ScrollTrigger past 0.85×vh (marked in the file); Phase 2's wordmark morph reclaims that. Off-home it renders `data-static` and is present from first paint. `use-wordmark-morph.ts` is kept, unmounted, as Phase 2's reuse target — it already fixes a measurement bug the prototype has.

## Structure

```
content/work/*.mdx           Case studies (source of truth for work)
content/earlier/*.mdx        Older projects: one paragraph + attributes each
src/app/                     Routes: / (one-pager), /work/[slug]; /work redirects to /#work
src/app/layout.tsx           <head> theme script + Typekit, smooth scroll, wraps every route
src/app/globals.css          Tailwind entry, the two palettes, type tokens, semantic classes
src/components/hero/         hero (type stub until Phase 2), use-wordmark-morph (parked for Phase 2)
src/components/theme/        use-theme hook + the nav ThemeToggle
src/components/site-header.tsx  nav pill + scroll-spy + temporary header-on writer
src/components/work/         work stub, case-study-*, earlier-work, work-lists/work-data, url-label
src/components/about/        about stub (Phase 3 replaces with the teleprompter)
src/lib/site-content.ts      ALL non-MDX site copy (nav, kicker, tagline, labels, links)
src/lib/theme-engine.ts      Pure theme resolution (unit-tested)
src/lib/pre-hydration-theme.ts  The first-paint script, serialised from the engine
src/lib/gsap.ts              GSAP plugin registration
velite.config.ts             Content schemas + MDX plugins
```

## Conventions

- **Content never lives in JSX** (spec §14). Case studies are MDX; every other string — including accessible names and button labels — lives in `src/lib/site-content.ts`. Tunables live in config modules. Editing words must never require touching a component.
- **Design decisions live in CSS, not markup.** Tokens are CSS custom properties mapped to Tailwind by the `@theme` block in `globals.css`. Recurring materials and type roles are semantic classes in `@layer components` — compose those instead of repeating a 12-utility string. Note: unlayered rules beat anything in an `@layer`; that cascade fact has bitten this file before.
- Adding a case study = add one `.mdx` file to `content/work/`. Required frontmatter: `title`, `summary`, `year`, `role`, `client`, `sector[]`, `discipline[]`, `platform[]`, `timeframe`, `view`, `impact`, `order`. Optional: `cover`, `tags`, `featured`, `draft`. No code changes needed.
- **`draft: true` unpublishes a study**: excluded from `/work/[slug]`'s static params, 404s. Use it rather than inventing content to fill gaps.
- Match the existing code style. Keep motion accessible: respect `prefers-reduced-motion` for anything substantial.
- Run `pnpm build` **and** `pnpm test` before committing. Never `git add -A` — stage what you intend (a stray `add -A` once swept 26 MiB of screenshots into a docs commit; root `*.png` is now git-ignored).

## Verifying visual work

The hardest-won lesson on this project, twice over: **mechanism-verification is blind to what a visitor actually sees.** Tests passing, a clean console, and correct DOM state have all been true of shipped code that looked wrong or was unusable.

- **Look at the rendered pixels**, in both themes, before calling visual work done.
- **Reachability is not `element.click()`** — that fires on `visibility: hidden` elements. Ask what the user hits: `document.elementFromPoint(rect centre)` must return the element or a descendant. A whole nav was invisible on the home page while a scripted click "passed".
- **Verify the served document**, not the JSX, for anything about load order or first paint (`curl` the page).
- **Check the dev server postdates your commit.** Stale `next-server` processes from previous sessions have served days-old CSS and produced convincing false results twice.

## History — parked, not deleted

- **Cold Noon** (cyberpunk, time-of-day): tag `archive/cold-noon` → run it with `git switch --detach archive/cold-noon && pnpm install && pnpm dev`. Spec: `docs/superpowers/specs/2026-07-14-cyberpunk-visual-language-design.md`. Summary: `docs/notes/cold-noon-project-summary.md`.
- **The diurnal "living sky"** and the **Area/TotalBlack hero** are inside that same archive.
- v3 kept the Velite pipeline, all content, the Lenis+GSAP integration, the Resend contact route, and the case-study components; everything scene-derived was removed.
