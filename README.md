# jonokane.com

This is my portfolio, designed and built by me. It lives at [jonokane.com](https://jonokane.com).

It's a one-page site (Welcome, About, Work, Contact) with a page for each case study. The look is deliberately stark: a white or black canvas, carried by type and motion, with one accent color per section.

## How I built it

I work as a design leader who also builds, and this repo shows that process end to end.

- **Design.** I explored the visual language and motion in prototypes made with Claude Design. The handoff, prototypes and design system are in [`docs/notes/jk26-v3-handoff/`](docs/notes/jk26-v3-handoff/).
- **Specs and plans.** Before building each piece, I wrote a design spec and an implementation plan. They're kept in [`docs/superpowers/`](docs/superpowers/), including the visual directions I tried and parked along the way.
- **Build.** I built it with Claude Code, reviewing every change against the specs and checking the rendered pages in both themes, at phone and desktop sizes.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19), deployed on Vercel |
| Language | TypeScript |
| Styling | Tailwind CSS v4, configured in `src/app/globals.css` |
| Content | MDX case studies, typed and validated by Velite |
| Motion | Motion for components, GSAP and ScrollTrigger for scroll choreography, Lenis for smooth scroll |
| Type | Adobe Fonts (Mae Variable, Config Mono, Config Variable) |
| Contact form | Resend, with optional Cloudflare Turnstile |
| Analytics | Vercel Analytics |
| Tests | Vitest and Testing Library |
| Package manager | pnpm |

There's no CMS or database. Every word on the site lives in the repo, either as an MDX file in `content/` or in `src/lib/site-content.ts`.

## Run it locally

You'll need Node and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Other commands:

```bash
pnpm build      # production build (compiles the content first)
pnpm test       # unit tests
pnpm lint       # ESLint
```

The contact form needs a Resend API key to send email. Copy `.env.example` to `.env.local` and fill it in. Without it, the site still runs and the form falls back to a plain email link.

## Adding a case study

Add one MDX file to `content/work/`. The file name becomes the URL, so `content/work/my-project.mdx` is served at `/work/my-project`. No code changes are needed.

```mdx
---
title: "My Project"
summary: "One or two sentences for the work list and the page description."
year: 2026
role: "Design Lead"
client: "Company"
sector: [Music Tech]
discipline: [Product Design]
platform: [iOS, Web]
timeframe: "2025 to 2026"
view: "https://example.com"
impact: "The one line a hiring manager should remember."
order: 8
cover: ./media/my-project/cover.jpg
---

## Overview

The story, in Markdown.
```

The frontmatter is checked at build time against the schema in `velite.config.ts`, so a missing or malformed field fails the build instead of shipping. `cover`, `tags` and `featured` are optional, and `draft: true` keeps a study unpublished while it's being written.

## Rights

The code is here to read and learn from. Case study content and images are © Jono Kane and their respective companies, all rights reserved.
