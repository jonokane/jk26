# jonokane.com — Rebuild Plan

_Last updated: 2026-07-09_

## Goals

A rebuild of jonokane.com, Jono's personal design/career portfolio. The old site's content had drifted — rambly, unfocused, out of date. Three goals drive this rebuild:

1. **Content.** Rewrite everything. Sharpen the story, add focused new case studies, cut the ramble.
2. **Design.** Raise the craft bar well above the old site.
3. **Motion.** A "wow" experience — a hero that makes visitors stop scrolling. Motion is essential, not decoration.

Constraint: no CMS or database. Content is version-controlled MDX.

## Stack (decided & scaffolded)

Next.js 16 on Vercel · TypeScript · Tailwind v4 · MDX via Velite · Motion + GSAP/ScrollTrigger + Lenis · pnpm. See `CLAUDE.md` for how it all fits together.

## Current state (as of 2026-07-09)

The scaffold is complete and `pnpm build` passes clean. In place:

- Working routes: `/` (animated hero placeholder), `/work` (index), `/work/[slug]` (case study template with typed frontmatter → SEO metadata).
- Canonical Lenis + GSAP smooth-scroll integration wired and sharing one RAF loop.
- Velite content pipeline proven end-to-end with two placeholder case studies.
- Tailwind v4 theme tokens, Geist font, light/dark via `prefers-color-scheme`.

**Not yet built:** shared nav/header/footer, About/contact, real content, a real design system beyond defaults, and the 3D hero (still a text placeholder).

## Open decisions

- **3D hero engine.** Leaning **React Three Fiber** over Spline (lighter bundle, more control). Deferred — nothing 3D installed yet. Decide and install only once the hero concept is designed, so the tool fits the vision rather than the reverse.

## Roadmap

Ordered by leverage. Content is the biggest lever (goal #1); motion decorates content, so content leads.

1. **Repo hygiene** — commit scaffold cleanup so `main` is clean. _(done 2026-07-09)_
2. **Deploy to Vercel** — get a live URL early so every later step is previewable. Quick, high-leverage.
3. **Content & information architecture** — decide the case study list, each study's narrative arc, and the homepage structure. Migrate/rewrite from old-site source material (Jono to provide). Write real case studies as MDX.
4. **Design system** — typography, color, spacing, nav/footer. Establish the visual identity content fills into.
5. **The hero** — design the "wow" concept, then pick and install the 3D engine (likely R3F), then build it.
6. **Connective tissue & polish** — About, contact, meta/OG images, performance pass, reduced-motion audit, accessibility.

## Source material

Jono has old-site content and existing case study assets (writing, images, possibly Figma) to share. Pull from these when writing real content in step 3 rather than inventing from scratch.
