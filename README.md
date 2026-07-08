# jonokane.com

Personal design & career portfolio for Jono Kane. Motion-first, content-driven,
and built to make people stop scrolling.

## Stack

| Concern            | Choice                                              |
| ------------------ | --------------------------------------------------- |
| Framework          | Next.js 16 (App Router, React 19) — deployed on Vercel |
| Language           | TypeScript                                          |
| Styling            | Tailwind CSS v4 (CSS-first config in `globals.css`) |
| Content            | MDX case studies, typed & validated via **Velite**  |
| Component motion   | **Motion** (formerly Framer Motion)                 |
| Scroll choreography| **GSAP** + ScrollTrigger                            |
| Smooth scroll      | **Lenis** (shares one RAF loop with GSAP)           |
| 3D (planned)       | React Three Fiber + drei — added when the hero is designed |
| Package manager    | pnpm                                                |

## Getting started

```bash
pnpm install     # native builds (sharp, etc.) are pre-approved in pnpm-workspace.yaml
pnpm dev         # http://localhost:3000
```

`pnpm dev` and `pnpm build` run Velite automatically (wired into `next.config.ts`)
— content is compiled to `.velite/` before Next compiles, and watched in dev.

## Scripts

- `pnpm dev` — dev server (Turbopack) + Velite in watch mode
- `pnpm build` — production build (runs Velite, then `next build`)
- `pnpm start` — serve the production build
- `pnpm lint` — ESLint
- `pnpm exec velite build` — compile content only

## Adding a case study

Create `content/work/<slug>.mdx` with frontmatter matching the schema in
`velite.config.ts`:

```mdx
---
title: Project Name
summary: One-line summary for the work index and page meta.
year: 2025
role: Lead Designer
client: Acme (optional)
featured: true
tags: [Product, Design Systems]
---

Your case study, in MDX.
```

The URL becomes `/work/<slug>` automatically. Frontmatter is validated at build
time, so a missing or malformed field fails the build instead of shipping.

## Project structure

```
content/work/          # MDX case studies (source of truth)
src/app/               # routes: / , /work , /work/[slug]
src/components/
  smooth-scroll.tsx    # Lenis + GSAP ticker integration (client)
  mdx-content.tsx      # renders Velite-compiled MDX
src/lib/gsap.ts        # single place GSAP plugins are registered
velite.config.ts       # content collections + schema
.velite/               # generated (gitignored) — typed content, imported via #site/content
```

## Deploy

Push to GitHub and import into Vercel — zero config. The Velite build runs as
part of `next build`, so no extra Vercel settings are needed.
