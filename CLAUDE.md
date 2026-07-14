# CLAUDE.md

Guidance for working in this repo. Read `PLAN.md` for the project's goals, roadmap, and open decisions.

## What this is

Personal design/career portfolio for **Jono Kane** (jonokane.com). A ground-up rebuild of an old site — sharper content, higher craft bar, and motion as a first-class feature. Case studies live as typed MDX files; there is deliberately **no CMS or database**.

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

The site is a one-pager (`/`) — Welcome → About → Work → Contact — with dedicated case study pages at `/work/[slug]`. The governing design spec is `docs/superpowers/specs/2026-07-11-site-experience-design.md`; read it before changing anything visual.

Shipped so far: the **living sky** (time-of-day scene system), the **JONOKANE hero** (Area variable font, per-letter build-in, cursor weight-carve), and the **site header** (the wordmark morphs into the nav pill as you scroll). The About collector, the horizontal work shelf, the contact form, and the farewell are not built yet — the three `AnchorSection`s on the home page are placeholders holding their anchors. A 3D layer is parked; nothing 3D is installed. See `PLAN.md`.

**Tuning (dev):** append `?tune` to the URL (`localhost:3000/?tune`) to open the scene palette panel (bottom-left; hidden otherwise, never ships to production). Dial in a keyframe's colors, hit *copy scenes JSON*, paste into `src/lib/scene-config.ts`. The visitor-facing time scrubber (bottom-right) is always on in dev and lets you preview any hour. Hero wordmark values are locked in `src/lib/wordmark-config.ts` and edited by hand.

## Commands

```bash
pnpm dev      # Velite builds content in watch mode, then next dev
pnpm build    # Velite build, then next build (run this to verify before committing)
pnpm test     # vitest unit tests (engine math + config)
pnpm start    # serve production build
pnpm lint     # eslint
```

## Package management

This project uses **pnpm** — always. Do **not** run `npm install`/`npm run` here: npm would create a competing `package-lock.json` and a flat, non-strict `node_modules`, defeating pnpm's phantom-dependency protection. The `packageManager` field in `package.json` pins the pnpm version; Vercel auto-detects pnpm from `pnpm-lock.yaml`.

Why pnpm: a global content-addressable store hard-linked into the project (faster installs, far less disk), and strict resolution — you can only import packages declared in `package.json`, which catches phantom deps early.

| Task | Command |
|---|---|
| Install all deps | `pnpm install` |
| Add a dependency | `pnpm add <pkg>` |
| Add a dev dependency | `pnpm add -D <pkg>` |
| Remove a dependency | `pnpm remove <pkg>` |
| Run a script | `pnpm <script>` (the `run` is optional for non-colliding names) |
| One-off tool (npx equivalent) | `pnpm dlx <tool>` |

## How it fits together

- **Content pipeline.** `.mdx` files in `content/` are validated against the schemas in `velite.config.ts` and compiled into `.velite/` (git-ignored, regenerated). Two collections: `work` (case studies, `content/work/`) and `earlier` (one-paragraph entries for older projects, `content/earlier/`). Import typed data from `#site/content` (e.g. `import { work, earlier } from "#site/content"`).
- **Velite runs from `next.config.ts`**, not a webpack plugin — this is intentional so it works under Turbopack. Don't move it to a bundler plugin.
- **MDX rendering.** `src/components/mdx-content.tsx` executes the compiled MDX body. Register custom components available to all MDX in its `mdxComponents` map.
- **Smooth scroll + GSAP.** `src/components/smooth-scroll.tsx` wraps the app and drives Lenis from GSAP's ticker so both share one synchronized RAF loop. This is the canonical integration — build scroll choreography with ScrollTrigger on top of it; don't add a second RAF loop or `autoRaf`. It reads the Lenis instance via `useLenis()`, **not** off `ReactLenis`'s ref: `ReactLenis` constructs Lenis inside its own effect and publishes it a render later, so a ref read in a mount-only effect finds nothing, never re-runs, and the ticker never gets wired — which silently locks scrolling for the whole site. Don't "simplify" it back to a ref.
- **GSAP plugins** are registered once in `src/lib/gsap.ts` (guarded against SSR). Import `gsap`/`ScrollTrigger` from there.
- **The living sky.** `SceneProvider` (`src/components/sky/scene-provider.tsx`) samples the visitor's clock once a minute and calls `applySceneToRoot` (`src/lib/scene-engine.ts`), which interpolates the 8 keyframes in `src/lib/scene-config.ts` and writes ~24 CSS custom properties (`--sky-*`, `--ink`, `--card-bg`, `--w-*`, …) onto `<html>`. Everything scene-colored reads those vars; sky layers are CSS-animated components under `src/components/sky/`. No RAF anywhere in this system — don't add one. **The whole scene stack is mounted in `src/app/layout.tsx`, not in a page** — every route needs the tokens, and a route without `SceneProvider` renders `.slab`/`.pill` against undefined vars.
- **First paint.** An inline script in `layout.tsx` (`src/lib/pre-hydration-scene.ts`) writes the five most visible scene vars before React hydrates, so the page never flashes the default midnight palette. Because it mutates `<html>`'s style attribute pre-hydration, `<html>` carries `suppressHydrationWarning`. Keep the script's math in sync with `scene-engine.ts` (a unit test pins them together).
- **The hero.** `src/components/hero/` — the JONOKANE wordmark in Area (`src/lib/area-font.ts` re-registers Adobe's font with honest axis ranges so `wdth` isn't clamped), a one-time per-letter build-in, a cursor weight-carve (`src/lib/carve-engine.ts`, on the shared GSAP ticker), and a shrink-to-fit type lockup (`src/lib/lockup-math.ts`). All tunables live in `src/lib/wordmark-config.ts`.
- **The header.** `src/components/site-header.tsx` + `src/components/hero/use-wordmark-morph.ts`: a ScrollTrigger-scrubbed FLIP morph flies a fixed copy of the wordmark into the nav pill over the first 0.85 viewport of scroll, toggling `header-on` on `<html>`.

## Structure

```
content/work/*.mdx           Case studies (source of truth for work)
content/earlier/*.mdx        Older projects: one paragraph + attributes each
src/app/                     Routes: / (one-pager), /work/[slug]; /work redirects to /#work
src/app/layout.tsx           Scene stack + smooth scroll + first-paint script wrap every route
src/app/globals.css          Tailwind entry, theme tokens, semantic component classes
src/components/hero/         hero, type lockup, wordmark morph
src/components/site-header.tsx  nav pill + scroll-spy
src/components/sky/          living time-of-day background: scene-provider, sky + element layers, time-scrubber, scene-tune-panel
src/lib/site-content.ts      ALL site copy (nav, kicker, tagline, intro beats, links)
src/lib/wordmark-config.ts   Hero wordmark recipe (single source of truth)
src/lib/scene-config.ts      Scene keyframes (single source of truth for the 8 scenes)
src/lib/scene-engine.ts      Scene sampling + token derivation (pure, unit-tested)
src/lib/gsap.ts              GSAP plugin registration
velite.config.ts             Content schemas + MDX plugins
```

The old TotalBlack hero is **parked**, not deleted (spec §13): `hero-wordmark.tsx`, `wordmark-tune-panel.tsx`, `wordmark-engine.ts`, `hero-config.ts`. Nothing mounts them, but `carve-engine.ts` reuses their falloff math. Leave them alone.

## Conventions

- **Content never lives in JSX** (spec §15). Case studies are MDX; every other string on the site lives in `src/lib/site-content.ts`. Tunables live in config modules. Editing words or values must never require touching a component.
- **Design decisions live in CSS, not markup.** Scene tokens are CSS custom properties, mapped to Tailwind utilities by the `@theme` block in `globals.css`. Recurring materials and type roles are semantic classes in `@layer components` (`.slab`, `.pill`, `.heading-display`, `.text-kicker`) — compose those instead of repeating a 12-utility string across files.
- Adding a case study = add one `.mdx` file to `content/work/`. Required frontmatter: `title`, `summary`, `year`, `role`, `client`, `sector[]`, `discipline[]`, `platform[]`, `timeframe`, `view` (a URL, or a phrase like "Under NDA"), `impact` (one-liner), `order` (shelf position). Optional: `cover`, `tags`, `featured`, `draft`. No code changes needed — routing and metadata derive from it.
- **`draft: true` unpublishes a study**: it is excluded from `/work/[slug]`'s static params and 404s. Use it for a study with real gaps rather than inventing content to fill them.
- Match the existing code style. Keep motion accessible: respect `prefers-reduced-motion` for anything substantial.
- Run `pnpm build` before committing to catch content-schema and type errors.
