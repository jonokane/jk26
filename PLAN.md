# jonokane.com — Rebuild Plan

_Last updated: 2026-07-13_

## Goals

A rebuild of jonokane.com, Jono's personal design/career portfolio. The old site's content had drifted — rambly, unfocused, out of date. Three goals drive this rebuild:

1. **Content.** Rewrite everything. Sharpen the story, add focused new case studies, cut the ramble.
2. **Design.** Raise the craft bar well above the old site.
3. **Motion.** A "wow" experience — a hero that makes visitors stop scrolling. Motion is essential, not decoration.

Constraint: no CMS or database. Content is version-controlled MDX.

## Stack (decided & scaffolded)

Next.js 16 on Vercel · TypeScript · Tailwind v4 · MDX via Velite · GSAP/ScrollTrigger + Lenis · pnpm. See `CLAUDE.md` for how it all fits together.

## The design

The governing spec is **`docs/superpowers/specs/2026-07-11-site-experience-design.md`** — scene system, type system, hero, header, collector, work shelf, contact, farewell, and the code-organization rules (§15). It supersedes the earlier hero-only spec.

The site is a one-pager — **Welcome → About → Work → Contact → Farewell** — with `/work/[slug]` case study pages as the canonical share/SEO surface and the reduced-motion reading path.

## Current state (as of 2026-07-13)

**Phase 1 — the living sky (shipped).** A time-of-day scene system: 8 keyframes interpolated from the visitor's clock into ~24 CSS custom properties, driving the sky gradient, sun/moon arc, stars, clouds, god rays, birds, and every text and material color on the site. Pure, unit-tested engine, no RAF. Visitor-facing time scrubber; `?tune` palette editor in dev.

**Phase 2 — hero + header (shipped).** The JONOKANE wordmark in Area variable font: per-letter build-in, cursor weight-carve, shrink-to-fit type lockup. A site header whose nav pill is fed by a scroll-scrubbed FLIP morph of the wordmark itself, plus scroll-spy, deep links, and a first-paint script so the sky never flashes the wrong scene.

**Content (landed).** Real case studies live in `content/work/`: Amazon Key In-Car, 8tracks FTUX, Fluence. Amazon Key In-Home is written but held as `draft: true` pending Jono's account of his role on that flow. Seven older projects are in `content/earlier/`. The four locked intro beats are in `src/lib/site-content.ts`.

**Not yet built:** the About collector, the horizontal work shelf, the contact form, and the farewell. The three sections on the home page are placeholders holding their anchors.

## Roadmap

1. ~~**Repo hygiene**~~ _(done 2026-07-09)_
2. ~~**Design system** — scene, type, tokens~~ _(Phase 1, done 2026-07-13)_
3. ~~**The hero + header**~~ _(Phase 2, done 2026-07-13)_
4. **Deploy to Vercel** — a live URL makes every later step previewable. **Blocked on a Jono-side action: the Adobe Fonts kit (`aqv1jgr`) needs `*.vercel.app` and `jonokane.com` added to its allowed domains, or Area and Mae will not load in production.**
5. **Phase 3 — the collector.** Intro beats → tray → About wall, with CTAs. Copy is locked (spec §7).
6. **Phase 4 — the work shelf.** Pinned horizontal shelf, four panels per study, wayfinding. Gated on content intake below.
7. **Phase 5 — contact + farewell.** Frosted form → Resend route handler; time-aware sign-off.
8. **Polish.** Meta/OG images, performance pass, full accessibility and reduced-motion audit, real cover art and artifacts (scene-gradient placeholders until then).

## Content intake (the critical path)

Content is the biggest lever and the main thing gating Phases 3 and 4. Outstanding items, tracked in `docs/notes/jonokane-case-studies.md`:

- **Collaya, Tappa, Meta Project 01, Meta Project 02** — entirely TBD. These are the four headline slots (`order` 1–4).
- **Amazon Key In-Home** — needs Jono's specific role on the in-home flow, plus any citable outcome. Held as `draft: true` until then.
- **8tracks / Fluence** — outcomes are written qualitatively because no metric was shareable. Swap in a metric if one becomes citable.
- **Résumé link** — `siteContent.links.resume` is empty, so the About résumé pill stays hidden until a public URL exists.
- **Cover art and artifacts** — none yet.

## Open decisions

- **3D hero layer.** Parked. The hero shipped as the Area wordmark; a 3D layer (likely React Three Fiber) remains a possible future evolution *behind* it. Nothing 3D is installed.
