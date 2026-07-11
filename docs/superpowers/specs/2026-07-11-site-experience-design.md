# jonokane.com Site Experience — Design Spec

_2026-07-11 · Approved through interactive prototyping (browser prototypes v1–v7 + wordmark lab v1–v5; final sim: `journey-v7.html`)_

## 1. Purpose & principles

A one-page portfolio experience for jonokane.com conveying **design expert + mature product leader + fun personality**. Three principles govern every call below:

1. **One living sky.** The whole site sits on a single time-of-day background driven by the visitor's clock. The sky carries the ambient motion; content holds still.
2. **Composed brand, playful world.** The wordmark is static after a one-time build-in; personality lives in the sky, the scroll choreography, and micro-interactions.
3. **Scroll is the narrative.** Vertical scroll tells the story (Welcome → Intro → About → Work → Contact → Farewell); horizontal scroll reads within Work.

Constraint carried from PLAN.md: no CMS, no database. Content is version-controlled MDX + typed config.

## 2. Site structure & routes

| Route | Content |
|---|---|
| `/` | The one-pager: Welcome → Intro/About collector → Work shelf → Contact → Farewell |
| `/work/[slug]` | Dedicated case study pages (kept): vertical render of the same MDX. Canonical share/SEO surface and the reduced-motion-friendly reading surface. |
| `/work` | Redirects to `/#work` |
| Deep links | `/#about`, `/#work`, `/#contact` scroll-position reliably on load |

Nav order: **About · Work · Contact** (About precedes Work in the page flow).

## 3. The living sky (scene system)

### 3.1 Keyframes

Eight scenes keyed to local hours; between keyframes every value is interpolated (smoothstep-eased, wrapping across midnight). Colors are the prototype-tuned values:

```json
[
  { "h": 0.0,  "name": "Midnight",    "top": "#050818", "mid": "#16173f", "hor": "#2c4a78", "ink": "#edf2ff", "sub": "#a9b6e6", "stars": 1,    "rays": 0,    "clouds": 0,    "birds": 0,    "sun": 0,    "moon": 1 },
  { "h": 4.7,  "name": "Night's end", "top": "#090b22", "mid": "#251b4e", "hor": "#513668", "ink": "#f1ecff", "sub": "#bfaede", "stars": 0.75, "rays": 0.2,  "clouds": 0,    "birds": 0,    "sun": 0,    "moon": 0.5 },
  { "h": 6.0,  "name": "Dawn",        "top": "#32204e", "mid": "#8a4a6a", "hor": "#f7a75d", "ink": "#fff3e3", "sub": "#f5cda6", "stars": 0.2,  "rays": 1,    "clouds": 0.15, "birds": 0.1,  "sun": 0.25, "moon": 0 },
  { "h": 8.0,  "name": "Morning",     "top": "#4e93d9", "mid": "#8ec6ee", "hor": "#ffe7bd", "ink": "#123252", "sub": "#33608a", "stars": 0,    "rays": 0.3,  "clouds": 0.55, "birds": 0.6,  "sun": 0.75, "moon": 0 },
  { "h": 12.5, "name": "Midday",      "top": "#3e9bf4", "mid": "#7fc6fb", "hor": "#d3efff", "ink": "#0e3a63", "sub": "#2f6292", "stars": 0,    "rays": 0,    "clouds": 1,    "birds": 0.9,  "sun": 1,    "moon": 0 },
  { "h": 17.8, "name": "Golden hour", "top": "#5f7cc0", "mid": "#ec9c66", "hor": "#ffd47e", "ink": "#45230f", "sub": "#7b4a26", "stars": 0,    "rays": 0.4,  "clouds": 0.6,  "birds": 0.4,  "sun": 0.55, "moon": 0 },
  { "h": 19.8, "name": "Dusk",        "top": "#2d2a67", "mid": "#7d4b90", "hor": "#e87f8b", "ink": "#ffeaf0", "sub": "#dcb6d8", "stars": 0.45, "rays": 0.12, "clouds": 0.3,  "birds": 0.05, "sun": 0.08, "moon": 0.25 },
  { "h": 21.5, "name": "Evening",     "top": "#0d1132", "mid": "#2d2363", "hor": "#4b5099", "ink": "#eef1ff", "sub": "#adb3e6", "stars": 0.9,  "rays": 0,    "clouds": 0.08, "birds": 0,    "sun": 0,    "moon": 0.7 }
]
```

The sky gradient is `linear-gradient(180deg, top 0%, mid 55%, hor 100%)` on a fixed full-viewport layer behind all content.

### 3.2 Derived tokens

Sampled scene → CSS custom properties on `:root`. `inkLight = luminance(ink) > 0.5` (true at night):

| Token | Formula |
|---|---|
| `--ink`, `--sub` | interpolated scene values |
| `--surface` | `mix(top, inkLight ? #07091a : #f8fafe, 0.6)` |
| `--scrim` | `--surface` at ≈58% alpha (`+ "94"` hex) |
| `--card-bg` | `inkLight ? rgba(10,13,28,.55) : rgba(255,255,255,.62)` |
| `--card-border` | `inkLight ? rgba(255,255,255,.15) : rgba(12,24,48,.13)` |
| `--text-glow` | `inkLight ? rgba(4,7,18,.55) : rgba(255,255,255,.5)` — headline text-shadow halo |
| `--elev` | `inkLight ? rgba(3,6,16,.5) : rgba(25,50,95,.28)` — elevation shadow color |
| `--cover-a` / `--cover-b` | scene `mid` / `hor` — cover & artifact gradients |

**Frosted slab** (the system's contrast material, used by nav pill, buttons, form fields, text slabs): `background: var(--card-bg); border: 1px solid var(--card-border); backdrop-filter: blur(9–12px); box-shadow: 0 12px 40px var(--elev); border-radius: 15–18px`. Slab body text renders in `--ink` at ~88% opacity.

### 3.3 Sky elements

All vector, all crisp-edged (no blur filters on shapes), all animated with plain CSS keyframes; per-scene visibility via layer opacity from the interpolated weights:

- **Stars**: ~110 dots (1–2.8px) + ~9 four-point sparkles, twinkling with randomized period/delay; upper ~72vh.
- **God rays**: the "wash" — a single large element (~2600px) anchored to the sun position: radial core glow + irregular conic wedges, `mix-blend-mode: screen`, blur(14px), radial-mask fade, slow ±2.5° sway. (Linework/dashed variants rejected.)
- **Clouds**: 5 ellipse-cluster silhouettes, group-opacity 0.82 (semi-transparent as one shape — no overlap seams), drifting across at 110–240s loops, varied scale/height.
- **Birds**: 2 small stroke "vees" with flap (scaleY oscillation), colored `--sub`, crossing on 30/42s loops.
- **Sun / moon**: soft-gradient discs arcing left→right; sun mapped 5.5h→20.5h, moon 19.5h→7h; positions also anchor the rays.

### 3.4 Behavior

- Time source: visitor's local clock; engine re-samples ~once per minute (plus on scrub). No per-frame color math.
- **Visitor scrubber**: a small, discoverable sun/moon control letting visitors preview other times of day; scrubbing drives the entire token system live (including the farewell word). Placement/styling refined in build; it must not read as debug UI.
- Dev tuning: `?tune` panel (dev-only, same pattern as the retired hero panel) exposing keyframe colors + time scrub, with copy-JSON into `scene-config.ts`.

## 4. Type system

| Role | Face | Values |
|---|---|---|
| Wordmark | `aktiv-grotesk-extended` | weight 500, `JONOKANE` (all caps, one word), 7vw, tracking 0.16em, line-height 1.06; nav size 1.05rem |
| Display (headings, beat titles, case titles, anchor name) | `mae-variable` | base display weight **180** with role boosts: section headings +260, case titles +300, anchor name +160, beat statements +60, impact lines +100, beat titles +220 |
| Body / UI | `mae-variable` | base weight **140**; legibility bumps: tagline +90, kicker +150, work intro +90 |

Weights are single-source tunables (`--dw`, `--bw` in tokens; weight variants may be revisited later). Geist remains only as fallback stack. All four kit fonts load from Typekit kit `aqv1jgr` (CDN-only license — never self-host). Fonts gate rendering with the established retry-until-deadline `document.fonts.load()` pattern (specs: `500 1rem "aktiv-grotesk-extended"`, `140 1rem "mae-variable"`).

## 5. Hero: build-in, then still

Wordmark recipe (locked):

```json
{ "font": "aktiv-grotesk-extended", "text": "JONOKANE", "ease": "expo (cubic-bezier(0.16, 1, 0.3, 1))",
  "order": "left-to-right", "dur": 1250, "stag": 130, "scale": 2, "blur": 14, "drop": -18,
  "track": 0.16, "weight": 500, "size": "7vw" }
```

Sequence on load (after font gate): each letter animates from `opacity 0, scale 2, translateY(-18vh), blur(14px)` to rest, 1250ms each, 130ms stagger, expo-out. Kicker ("Product Design Leader & Strategist") and tagline ("I shape strategy, build teams, lead design, and code the front end that brings it to life.") fade in as the name settles (~80% through). **After settling, the wordmark never animates ambiently** — hero layout is mid-left.

## 6. Header & navigation

- **Assembly**: scrolling off the hero scrubs a FLIP-style morph — the wordmark flies from hero position into the top-left slot of the nav pill, shrinking to 1.05rem; the pill + links fade in as it lands (~85% progress). Scrolling back reverses it. The header does not exist visually before this.
- **Pill**: floating (2vw inset, 14px top), frosted slab material, scene-adaptive. Row 1: wordmark (click → top) + About/Work/Contact links with scroll-spy active states (underline).
- **Expanding work row**: inside the same pill, a second row grows open while in Work (grid-rows animation): current **project name** in display Mae (re-pops with a spring on study change), the **panel label** (fades in past each study's intro panel), and right-aligned **study pills** (clickable jumps; active state). Row collapses on leaving Work. Name/label/pills sit on a shared baseline.

## 7. Intro → About (the collector)

Content, four titled beats (source of truth in `site-content.ts`):

1. **What I do** — "I help teams build products people love, spanning design, product management, strategy, and hands-on building to turn concept and vision into shipped products."
2. **Track record** — "For two decades I have solved challenging product and UX problems at Yahoo!, Amazon, Meta, and smaller startups, and now as founder of Collaya."
3. **How I work** — "I care about people and real user needs, and I balance that with the metrics that grow a business."
4. **Available now** — "Available now for fractional work, around 20+ hours a week, mostly with early-stage teams in music, creative, AI, IoT, and automotive. Remote-first, open to LA or SF hybrid for the right opportunity."

Choreography (pinned section, ScrollTrigger-scrubbed timeline — continuous, not stepped):

- Each statement: rises in → holds **center-stage** (clear canvas, always on top) → pockets into a small **tray** along the bottom edge (~0.22 scale tokens, "collected ↓" hint) → after beat 4, the tray **unpacks** into the 2×2 About wall (0.55 scale, staggered ~70ms flights).
- Assembled state: "About" heading + lede fade in above the wall; footer lands with primary CTAs (**See the work →**, **Start a conversation**) and secondary pill buttons (**Résumé, LinkedIn, Collaya** — outline style: transparent bg, 1.5px `--card-border`, no shadow).
- Beat titles render as weight-boosted uppercase Mae labels; statement text carries the scene text-glow. Statement snap: each beat clicks into place (snap, not drift-past).

## 8. Work (the shelf)

- **Approach**: sky runway (~35vh) → "Selected Work" heading moment (own breathing room, scrolls away before the shelf) → pinned full-viewport shelf where vertical scroll drives horizontal movement, snapping per panel. Entering from above auto-snaps the shelf into alignment (pin). At the last panel, continued scroll releases down to Contact.
- **Structure**: five case studies × four panels — the whole case study lives on the page (wysiwyg, no click required):
  1. **Intro** — number, title (display Mae), one-line impact, **meta pills on a frosted slab** (Client / Sector / Discipline / Platform / Role / Timeframe / View-the-work as label+value pills), cover art right.
  2. **Overview & The challenge** — two frosted text slabs.
  3. **What I did** — text slab + artifact blocks with decision-focused captions.
  4. **Outcome** — text slab + artifact + "Next: {study} →" teaser.
- **Wayfinding**: expanding header row (§6) + grouped progress dots and a center caption ("{Study} — {panel} (2/4)").
- Work section background: **treatment B** — scene-derived scrim ramping in transparent→full over the runway (~68vh gradient), sky fully alive above it.
- Case study covers/artifacts use scene-gradient placeholders until real art lands.

## 9. Case study content model

Velite schema (`velite.config.ts`) extends the existing collection with the template's fields (template: `docs/notes/case-study-template-jonokane.md`):

- Frontmatter: `title`, `summary`, `year`, `role` (existing) + `client`, `sector` (filterable), `discipline` (filterable), `platform`, `timeframe`, `view` (URL or "Under NDA"), `impact` (one-liner), plus existing optional `cover`, `tags`, `featured`.
- Body: `## Overview`, `## The challenge`, `## What I did`, `## Outcome`, optional `## Selected screens` with captioned artifacts. The shelf parses these sections into panels; `/work/[slug]` renders the same MDX as a normal vertical article.
- Adding/editing a case study remains a single-file MDX edit; no code changes.

## 10. Contact

Frosted form (Name, Email, "What are you building?") on the scrim, primary pill submit ("Start a conversation →"). Delivery: Next.js route handler → **Resend** email to Jono. Spam gates: honeypot field + time-to-submit check; Cloudflare Turnstile wired in only if spam appears. States: sending / success ("Thanks — I'll get back to you soon") / error with mailto fallback. No persistence.

## 11. Farewell

Final near-full-viewport slide on the scrim: **"Thanks for stopping by. Have a lovely {word}."** — word from the visitor's clock: morning 5–12, afternoon 12–17, evening 17–21, night otherwise. Signed "— Jono". Fades/rises in on arrival; tracks the scrubber live.

## 12. Accessibility, mobile, performance

- **Reduced motion** (`prefers-reduced-motion`): wordmark appears by simple fade (no per-letter flight); no pinning or scrubbed choreography — beats, About wall, and case study panels flow as a plain vertical document; sky shows the correct scene as a static gradient (element animations off); farewell still time-correct. `/work/[slug]` pages are the long-form reading path.
- **Touch/mobile**: shelf becomes native horizontal swipe with scroll-snap; header condenses (study pills scrollable); collector travel shortened; hover-dependent affordances have tap equivalents. Layouts single-column under ~760px.
- **Performance**: one RAF loop (gsap ticker — Lenis integration unchanged); animations transform/opacity only; scene engine writes tokens ~1/min; sky layers are compositor-driven CSS animations, paused (`IntersectionObserver` / `visibilitychange`) when hidden; `content-visibility` on off-screen sections evaluated in build.
- **A11y semantics**: one `h1` (visually-hidden "Jono Kane" alongside the decorative wordmark), landmark nav, `aria-current` on spy states, shelf panels reachable by keyboard (arrow keys + focus order), form fields labeled.

## 13. Retired / parked

- The TotalBlack living-wordmark hero (engine, tune panel, tests — shipped 2026-07-10) is **unmounted from the page but parked in the repo** (`src/lib/wordmark-engine.ts` + tests + `wordmark-tune-panel`), available for future easter eggs. TotalBlack stays in the kit for the parked code and cover-art placeholders.
- 3D hero layer remains parked (unchanged from PLAN.md).

## 14. Punch list (non-blocking polish carried into build)

- Continuous scrubbed motion replaces every stepped CSS-transition emulation from the prototypes (collector flights, morph, shelf snap).
- Kern-match the wordmark morph landing precisely into the nav slot (FLIP).
- Intro beat heading copy is placeholder-final from Jono (titles may be refined in content pass).
- Scrubber visual design; tray hint styling; dot/caption refinement; slab padding rhythm pass.
- Verify Mae rendering weights across platforms (the 140/180 axis values were tuned on macOS Chrome).

## 15. Implementation phases

1. **Scene engine + tokens + type system** — config, engine (unit-tested math), sky layers, slab material, `?tune`.
2. **Hero + header** — wordmark build-in, font gating, nav pill, FLIP morph, scroll-spy, deep links, `/work` redirect.
3. **Collector** — beats → tray → About wall timeline, CTAs, reduced-motion fallback.
4. **Work shelf + content model** — Velite schema extension, panel renderer, header work row, `/work/[slug]` vertical render, five case study MDX stubs.
5. **Contact + farewell + polish** — Resend route + spam gates, farewell, a11y/mobile/perf audit, punch list.

Each phase gets its own implementation plan and ships something visible. Real case study copy/art is a parallel content workstream (Jono).
