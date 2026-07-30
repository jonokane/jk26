# Handoff: jonokane.com — Portfolio Website

## Overview
A stark, type-forward personal portfolio for Jon O'Kane — a senior product design leader / strategist available for fractional work. The site is a single vertical-scroll experience with four movements: **Welcome**, **About**, **Work** (selected case studies), and **Contact**. The design leans entirely on typography and motion — there is almost no chrome, ornament, or imagery beyond the case-study screens the user will supply. Each section owns a single accent color, and a handful of signature scroll behaviors carry the personality.

## About the Design Files
The files in `prototypes/` are **design references authored in HTML** — prototypes that demonstrate the intended look, layout, and motion. **They are not production code to ship directly.** They are written as "Design Components" (`*.dc.html`) that depend on a bundled `support.js` runtime purely so they render in the design tool; **do not port `support.js` or the `.dc.html` wrapper into the real app.**

Your task is to **recreate these designs in the target codebase's environment** using its established patterns. If there is no codebase yet, **Next.js + React** is the recommended framework (the original build referenced `use-wordmark-morph.ts` + GSAP ScrollTrigger and `/work/[slug]` routes — see notes below). Use whatever animation approach fits the chosen stack; GSAP ScrollTrigger or a scroll-driven `requestAnimationFrame` loop both work.

Read each prototype's inline `<style>` and logic class for exact values; this README captures everything needed to build without opening them, but they are the ground truth.

## Fidelity
**High-fidelity.** Colors, typography, spacing, easing, durations, and interaction logic are final and intentional. Recreate them precisely. The one deliberately-open decision is the Work section layout (see *Screens → Work*).

---

## Fonts (Adobe Fonts / Typekit)
All type is served from an Adobe Fonts web project. Embed the kit in the document head:

```html
<link rel="stylesheet" href="https://use.typekit.net/aqv1jgr.css">
```

- **Display + body:** `"config-variable", sans-serif` — variable weight axis 100–900. Used for the wordmark, section titles, work titles, body.
  - *(Note: the wordmark explored several faces — `mae-variable`, `area-variable`, `config-variable`. Final pick is **Config Variable**, all-caps, thin. See Wordmark Studio prototype for the alternates if you want to revisit.)*
- **Mono / labels / numbers:** `"config-mono-vf", monospace` — variable, used for eyebrows, counters, meta, tags, form labels.

Set a base `font-variation-settings: 'wght' 400` on body and mono so nothing renders at the fonts' thin defaults.

Also available in the same kit if needed: `aktiv-grotesk-extended` (static 300), `cofo-sans-variable`, `fredoka-variable`, `totalblack-variable` (170–1000).

---

## Design Tokens

### Color
```
--about:   #3f9b4e   /* green  — About section accent */
--work:    #6d4bd8   /* violet — Work section accent  */
--contact: #2f7d8f   /* teal   — Contact section accent */
--ink:     #0d0d0d   /* body text, wordmark rest color */
--mute:    #9a9a9a   /* eyebrows, meta, labels */
```
Supporting neutrals: `#bcbcbc` (teleprompter dimmed word), `#e6e6e6` (dividers/hairlines), `#fafafa` (row hover fill), `#ffffff` (canvas).

Nav glass: `background: rgba(255,255,255,0.6)` + `backdrop-filter: blur(20px) saturate(1.4)` + `border-bottom: 1px solid rgba(15,15,15,0.06)`.

**Rule:** one accent per section, never mixed. The nav link for the active section takes that section's accent (scroll-spy). Define default `a` / `a:hover` colors from the palette.

### Typography scale (fluid `clamp()`)
| Role | Size | Weight / notes |
|---|---|---|
| Section title (`.sectitle`) | `clamp(2.6rem, 7vw, 6.5rem)` | wght 700, tracking -0.02em, lh 1 |
| Wordmark | `clamp(3rem, 9vw, 8rem)` | wght 300, ALL CAPS, tracking 0.14em, lh 0.9 |
| Work / project title | `clamp(1.5rem, 3vw, 2.6rem)` | wght 480 → 620 on hover |
| About statement line | `clamp(1.4rem, 2.5vw, 2.5rem)` | wght 440–780 (animated), lh 1.18 |
| Tagline / lead | `clamp(1.15rem, 1.9vw, 1.72rem)` | wght 400, lh 1.34 |
| Body / case prose | `clamp(1.05rem, 1.5vw, 1.28rem)` | lh 1.6, max 62ch |
| Eyebrow / label | 12–14px | mono, tracking 0.2–0.32em, UPPERCASE, --mute |

### Layout & spacing
- Page gutter: **`6vw`** left/right on every section (the one horizontal constant).
- Nav: fixed, padding `26px 6vw`, z-index 40.
- Locked section headers: `position: sticky; top: 84px; z-index: 20;` on an opaque white background.
- Reading measures: body 62ch, leads 30–52ch.
- Radii: sharp by default; pills `100px` (tags, buttons); contact button `2px`.

### Motion
Easing curves:
- Standard (reveals, hovers): `cubic-bezier(.2,.7,.2,1)`
- Overlay slide-up: `cubic-bezier(.2,.8,.2,1)`
- Wordmark letter: `cubic-bezier(.2,.85,.24,1)`

Durations: reveal-in `0.85s`; hover shifts `0.4s`; nav accent crossfade `0.5s`; overlay open `0.6s`; wordmark letters `0.55–0.9s` staggered `0.3 + i×0.08s`.

All scroll handlers are `requestAnimationFrame`-throttled. **Everything gates behind `prefers-reduced-motion`.** Re-measure on resize and on `document.fonts.ready`.

---

## Screens / Views

### 1. Welcome (hero)
- **Purpose:** First impression; pure wordmark, no nav bar.
- **Layout:** Full-height (`min-height:100vh`), flex column centered, `6vw` gutter. Eyebrow → wordmark → tagline, with a `scroll` cue pinned bottom-left.
- **Components:**
  - Eyebrow: "Product Design Leader & Strategist" — mono, uppercase, tracking 0.32em, `--mute`.
  - **Wordmark "JONOKANE":** Config Variable, all-caps, wght 300, tracking 0.14em. Each letter is a `<span>`.
    - **Living gradient:** each letter is filled with a drifting gradient `linear-gradient(92deg, var(--about) 0%, var(--work) 40%, var(--contact) 74%, var(--about) 100%)`, `background-size:280% 100%`, `background-clip:text`, `-webkit-text-fill-color:transparent`, animated via `@keyframes drift` (background-position 0→100→0) over `9s ease-in-out infinite`. **The gradient must be on each letter, not the container** — otherwise letters go invisible while transformed during the build-out. Per-letter `animation-delay` (0, -0.6, -1.2, -1.8, -2.4, -3, -3.6, -4.2s) phase-shifts the hue so the whole word shows a moving multi-hue sweep.
    - **Build-out (on load):** letters resolve from `scale(2.5) translateY(-0.06em)` + `blur(9px)` + opacity 0 to rest, staggered `0.3 + i×0.08s`. Eyebrow leads; tagline + scroll cue follow after the run completes. Reduced-motion jumps straight to rest.
  - Tagline: "I shape strategy, build teams, lead design, and build the front end that brings it to life." — `clamp(1.15rem,1.9vw,1.72rem)`, wght 400, color `#2e2e2e`, max 52ch.
  - Scroll cue: "scroll" — mono, uppercase, tracking 0.28em, `--mute`, absolute bottom-left.

### 2. Nav + the wordmark → header morph
- **Purpose:** Nav is absent on the hero, then materializes as the hero wordmark flies up into it.
- **Behavior (scroll-scrubbed FLIP, fully reversible):**
  - Two copies of the wordmark: an **in-flow anchor** (`visibility:hidden`) that owns hero layout and is measured, and a **fixed live "fly" copy** (z-index 45, `pointer-events:none`, `transform-origin:0 0`) that actually moves.
  - Over the first **0.85 × viewport-height** of scroll, progress `p = clamp(scrollY / (0.85·vh), 0, 1)`, eased with smoothstep `e`. The fly interpolates: `x` from anchor-left → nav brand-slot-left; vertical **center** from anchor center → the nav links' vertical center; `scale` from 1 → `endH/startH` (endH = brand-slot height). Applied as `translate(x,y) scale(k)` where `y = centerY - (startH·k)/2`.
  - **Measure live every frame** (anchor rect, brand-slot rect, `#nav-about` link rect) — do **not** cache at mount, or it will be wrong before fonts load and only correct after a refresh.
  - The fly lands centered on the nav links, becoming the header mark (the brand slot itself stays invisible — the fly covers it).
  - At `p > 0.98` a `header-on` class is toggled on `<html>`.
- **Header pill (`#nav`):** fixed, top, z-index 40. Starts hidden: `opacity:0; transform:translateY(-16px); visibility:hidden`. `html.header-on #nav` → `opacity:1; transform:none; visibility:visible` (transitions `opacity .4s`, `transform .45s cubic-bezier(.2,.7,.2,1)`). Glass background (see tokens). Contains the landed wordmark (left) and links **About / Work / Contact** (right, mono-ish 15px, default `#8a8a8a`, active section → its accent).
- **Reduced motion:** no flight — set `header-on` directly and show the hero wordmark statically.
- **Detail/sub pages:** no hero to morph from, so mark the header `data-static` and render it present from first paint.

### 3. About — teleprompter
- **Purpose:** Narrative bio that reads like a teleprompter as you scroll.
- **Layout:** A tall wrapper (`height: 640vh`) drives a `sticky`, `100vh`, `overflow:hidden` stage. Locked title "Who I am." top-left in `--about`. A column of statement blocks translates upward through a fixed focal zone. A right-rail of dots tracks the active statement.
- **Mechanic:** Scroll progress maps to a moving focal center at **60% of viewport height**, focus range **±24% vh**. For each word: weight interpolates **440 → 780**, color mixes `#bcbcbc → accent/ink`, opacity + blur fall off with distance from focus. Words **above** the focus blur harder (up to 7px) than words **below** (up to 2px) — the "already read" feel. Certain words are emphasized (role `e` → heavier target weight / accent), some italic (role `i`).
- **Copy (4 statements):**
  1. "I help teams build products people love, spanning design, product management, strategy, and hands-on building to turn concept and vision into shipped products."
  2. "For two decades I have solved challenging product and UX problems at Meta, Amazon, Yahoo!, and smaller startups, and now as founder of Collaya."
  3. "I care about people and real user needs, and I balance that with the metrics that grow a business."
  4. "Available now for fractional work. ~20+ hours a week with early-stage teams in music, creative, AI, IoT, and automotive industries. Remote-first, LA/SF hybrid."

### 4. Work — selected case studies  ⚠️ NOT YET INTEGRATED INTO THE MAIN PROTOTYPE
> **Important:** `Portfolio v2.dc.html` currently contains a **placeholder** Work section (a simple vertical index of 8 rows with dummy titles). The **real, designed Work experience lives in a separate prototype: `prototypes/Work Section.dc.html`.** Integrate that one — treat the placeholder in Portfolio v2 as a stand-in only.

**What `Work Section.dc.html` contains:**
- **Horizontal-scroll gallery:** a vertical-scroll section that hands off to a horizontal read. Vertical scroll inside a sticky `100vh` stage translates a horizontal track (`#wtrack`) in X. **8 headliner case-study cards** + a **9th "earlier work" panel** listing 7 older projects in a 2-column list.
- **Card anatomy:** number (accent), year (mute), title (`clamp(1.8rem,3.2vw,3rem)`, wght 600), one-line impact, discipline **tags** (accent-outline pills, mono 11px, `1px solid #e2ddf5`, radius 100px), a "View case study →" affordance, and an **image slot** (`.wshot` — hatched `repeating-linear-gradient` placeholder) for a representative project screen the user will supply. Draft/unknown impact renders italic `#b3b3b3`.
- **Wayfinding (mitigates horizontal-scroll disorientation):** locked section title, a live **`01 / 09` counter** (`#wcount`, active number in accent), and a **progress bar** (`#wprog`) pinned bottom.
- **Detail overlay:** clicking a card opens a full-screen overlay (`position:fixed; inset:0; z-index:90`) that slides up `translateY(100%→0)` over `0.6s cubic-bezier(.2,.8,.2,1)`. Pill close button top-right. Content: eyebrow, `h1` title, impact lead, an attribute grid (`dt`/`dd`: Sector, Platform, Discipline, Role, Timeframe…), then labeled prose sections (Overview / The challenge / What I did / Outcome), then a larger image slot (`.dshot`, "selected screens / artifacts"). **Amazon In-Car** case is fully written; others flag missing copy inline as **"Needs input"** (`#b08b3a` italic) — these are content gaps for Jon to fill, not bugs.
- **Case-study content** (titles, impacts, attributes, long-form prose) is embedded as a data object inside `Work Section.dc.html`'s logic class — lift it from there.

**⚠️ OPEN DECISION — resolve with the client before building Work:**
The signature horizontal gallery is a strong "poster" moment but does **not** support filtering well. Filtering (by **Sector** / **Discipline**) works far better as a **vertical index**. Three viable paths:
1. **Horizontal gallery only** — keep the signature moment, no filtering.
2. **Vertical filterable index only** — best usability, loses the signature moment.
3. **Hybrid (recommended)** — horizontal poster view as the default/signature, with a filtered vertical list as an alternate view the user can toggle to. Also the safest responsive fallback (horizontal scroll is awkward on mobile — the vertical list becomes the mobile layout).
The prototype currently demonstrates path 1. Confirm the direction before implementing.

### 5. Contact
- **Purpose:** Convert — a short pitch + message form.
- **Layout:** `min-height:100vh`, `6vw` gutter. Locked `h2` "Let's talk." (sticky top 84px, `--contact`). Lead: "Available for fractional work with early-stage teams. Tell me what you're building." (max 34ch).
- **Form:** 2-column grid (`gap: 26px 40px`, max 900px). Fields: Name, Email (side by side), Project/message (full-width textarea). Inputs are transparent with bottom-border only (`#d0d0d0`, → `--contact` on focus), mono uppercase labels. Submit button: solid `--contact`, white text, `2px` radius, wght 560, `padding 16px 40px`, hover `translateY(-2px)`.
- **Footer:** mono email `jono@collaya.com`, links LinkedIn / Read.cv / Résumé (underline-on-hover in `--contact`).
- All Contact + Work + hero secondary elements fade/rise in via a one-shot IntersectionObserver reveal (threshold 0.2; `opacity 0→1`, `translateY(26px→0)`, `0.85s`).

---

## State Management
- **Scroll position** drives everything (teleprompter focus, wordmark morph, Work horizontal position, nav scroll-spy). One rAF-throttled scroll handler.
- **Active section** for nav accent (viewport-mid element test).
- **Wordmark morph progress** `p` (derived from scrollY).
- **Work:** active card index (for the `01/09` counter + progress bar); selected case (open/closed detail overlay + which slug).
- **Detail overlay** open/closed state → on real routes this maps to `/work/[slug]`.
- **Contact form** field state + validation (name required, valid email, message non-empty).
- Persist nothing to localStorage; the URL/route is the source of truth for the open case study.

## Interactions & Behavior summary
- Hover on Work index row (placeholder) / card: `padding-left 0→24px`, bg `#fafafa`, title weight 480→620, number → accent, arrow fades in — all `0.4s cubic-bezier(.2,.7,.2,1)`.
- Nav links crossfade to the active section's accent (`0.5s`).
- Detail overlay: slide up/down, body scroll lock while open, `overscroll-behavior: contain`.
- Responsive: horizontal Work becomes a vertical list on narrow viewports (see Work open decision). Everything else is fluid via `clamp()` + `vw`/`vh`.

## Assets
- **Fonts:** Adobe Fonts kit `aqv1jgr` (see Fonts section). Requires an active Adobe account + domain allowlist on the production domain.
- **Case-study screens / artifacts:** none yet — the `.wshot` / `.dshot` slots are placeholders for real project screenshots Jon will provide. Design them to hold one representative screen per card and a small gallery per detail page.
- **No icons or illustrations** — the design is intentionally type-only.

## Files (in `prototypes/`)
- **`Portfolio v2.dc.html`** — main prototype: Welcome, About (teleprompter), Work (placeholder — do not use), Contact, nav morph. Primary reference.
- **`Work Section.dc.html`** — the real Work section: horizontal gallery, cards, detail overlay, wayfinding, and embedded case-study content. **Integrate this.**
- **`Design System.dc.html`** — the code-oriented spec (tokens, type scale, motion, components, patterns). Human-readable reference.
- **`Welcome Motion Study.dc.html`** — the three welcome-color explorations; the living-gradient (2b) is the chosen direction, already in Portfolio v2.
- **`Wordmark Studio.dc.html`** — the eight wordmark explorations, if you want to revisit the face/case/weight decision.
- **`support.js`** — design-tool runtime only. **Do not ship.**

> Open any `.dc.html` in a browser to view it (it loads `support.js` from the same folder).
