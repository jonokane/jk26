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

3D hero engine (likely React Three Fiber) is **not yet installed** — deferred until the hero is designed. See `PLAN.md`.

## Commands

```bash
pnpm dev      # Velite builds content in watch mode, then next dev
pnpm build    # Velite build, then next build (run this to verify before committing)
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

- **Content pipeline.** `.mdx` files in `content/work/` are validated against the schema in `velite.config.ts` and compiled into `.velite/` (git-ignored, regenerated). Import typed data from `#site/content` (e.g. `import { work } from "#site/content"`).
- **Velite runs from `next.config.ts`**, not a webpack plugin — this is intentional so it works under Turbopack. Don't move it to a bundler plugin.
- **MDX rendering.** `src/components/mdx-content.tsx` executes the compiled MDX body. Register custom components available to all MDX in its `mdxComponents` map.
- **Smooth scroll + GSAP.** `src/components/smooth-scroll.tsx` wraps the app and drives Lenis from GSAP's ticker so both share one synchronized RAF loop. This is the canonical integration — build scroll choreography with ScrollTrigger on top of it; don't add a second RAF loop or `autoRaf`.
- **GSAP plugins** are registered once in `src/lib/gsap.ts` (guarded against SSR). Import `gsap`/`ScrollTrigger` from there.

## Structure

```
content/work/*.mdx        Case studies (source of truth for work)
src/app/                  Routes: / , /work , /work/[slug]
src/app/globals.css       Tailwind entry + theme tokens
src/components/           smooth-scroll, mdx-content
src/lib/gsap.ts           GSAP plugin registration
velite.config.ts          Content schema + MDX plugins
```

## Conventions

- Adding a case study = add one `.mdx` file to `content/work/` with the required frontmatter (`title`, `summary`, `year`, `role`; optional `client`, `cover`, `tags`, `featured`). No code changes needed — routing and metadata derive from it.
- Match the existing code style. Keep motion accessible: respect `prefers-reduced-motion` for anything substantial.
- Run `pnpm build` before committing to catch content-schema and type errors.
