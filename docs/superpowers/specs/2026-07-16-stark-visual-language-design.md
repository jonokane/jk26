# jk26-v3 — the stark visual language

_Date: 2026-07-16 · Supersedes: `2026-07-14-cyberpunk-visual-language-design.md` (Cold Noon) and, in part, `2026-07-11-site-experience-design.md`_

## Why

Cold Noon is being parked. It failed for four reasons, in Jono's words:

1. **Layout read as amateur.** Because elements had to survive every hour of the day, positions and proportions drifted into looking arbitrary.
2. **Colour went muddy.** Every colour was a sample from a continuous curve, so nothing could be pinned down and locked. Text struggled to be legible, let alone to pop.
3. **Motion was clunky.** Tunable, but never crisp.
4. **It read as a video game**, not as a striking image.

The through-line: **a design that must hold at every hour is optimised for no hour.** v3 removes the variable. Two palettes, hand-authored and locked, and a design that leans entirely on type and motion.

The governing design is the handoff in `docs/notes/jk26-v3-handoff/`, developed with Claude Design.

## Conflict register

The handoff documents disagree in six places. Each is resolved below with its citation, so nobody re-litigates them from a half-memory.

| # | Question | Conflict | Resolution |
|---|---|---|---|
| 1 | **Display + body face** | `README:25` says `"config-variable"` is "display + body … section titles, work titles, body". `Design System:17` and `Portfolio v2:18` both declare `body { font-family: "mae-variable", system-ui, sans-serif }`; `Design System:157` says "Mae Variable (display + body) and Config Mono (labels)". | **Mae Variable.** Two prototypes agree against the README, and Jono confirmed it directly (2026-07-16). The README overreached Config Variable from the wordmark onto everything. |
| 2 | **Wordmark spec** | `Design System:183`'s caption says `clamp(4rem, 13vw, 12rem)` / wght 680 — while `Design System:182`, its own demo one line above, renders `clamp(4rem, 9vw, 7rem)` lowercase. The row contradicts itself. `README:55`, `README:88` and `Portfolio v2:37` all agree on `clamp(3rem, 9vw, 8rem)`, ALL CAPS, wght 300, tracking 0.14em, Config Variable. | **README + Portfolio v2.** The Design System's wordmark row is stale and internally inconsistent. Jono confirmed: Config Variable, all-caps, wght 300, 0.14em. |
| 3 | **"Roboto Flex carries the design"** (`Design System:57`) | Contradicts `Design System:157` in the same file. | Dead prose from an earlier generation. No design impact; ignore. |
| 4 | **Nav z-index** | `README:65` says 40; `Design System:227` says 50; `Portfolio v2` renders 40. | **40.** |
| 5 | **Teleprompter colour roles** | `README:109` says emphasised words take the accent. `Portfolio v2` code: `live = (role === 'a') ? aboutColor : '#0d0d0d'` — ambient words take the accent, emphasised go to ink at wght 780. | **The code.** Inversion is real; see §8. |
| 6 | **Teleprompter weight floor** | `README:109` says "440 → 780". Code is `lerp(400, target, focus)`, where 440 is the *ambient target*, not the floor. | **The code.** Base is 400. |

**Rule: where a prototype's code and the README disagree, the code wins** — the README says so itself ("they are the ground truth"). The exception is where Jono has ruled directly, as in #1 and #2.

Not a conflict, recorded to stop it being re-raised: the blur asymmetry. `README:109` says words above focus blur to 7px and below to 2px, and the code does exactly that. The README merely omits the opacity floors (0.5 above, 0.14 below), which are counterintuitive but not contradictory.

## Type

Three faces, one role each, all from Adobe Fonts kit **`aqv1jgr`**, embedded in the document head:

```html
<link rel="stylesheet" href="https://use.typekit.net/aqv1jgr.css">
```

| Role | Face | Notes |
|---|---|---|
| Display + body | `"mae-variable"` | Section titles, work titles, About statements, taglines, prose. Variable `wght`, used 400–780. |
| Mono / labels / numbers | `"config-mono-vf"` | Eyebrows, counters, meta, tags, form labels, the theme + view toggles. |
| Wordmark only | `"config-variable"` | ALL CAPS, wght 300, tracking 0.14em, `clamp(3rem, 9vw, 8rem)`, `line-height: 0.9`. Nothing else uses it. |

Set a base `font-variation-settings: 'wght' 400` on body and mono, or both render at their thin defaults.

**Most of this is already wired.** `globals.css:81-82` already declares `--font-display` and `--font-body` as `"mae-variable"`, and `layout.tsx:56-61` already embeds kit `aqv1jgr` with preconnects. Only two tokens change:

- `--font-wordmark`: `"totalblack-variable"` → `"config-variable"` (TotalBlack is the parked hero; see §13)
- `--font-mono`: `var(--font-geist-mono)` → `"config-mono-vf", monospace`

The `next/font/google` Geist fallbacks in the token chains go with the Geist imports (§13).

If Config Variable's axes turn out clamped the way Adobe clamps Area's `wdth`, `area-font.ts` is the precedent for re-registering with honest ranges — verify at build start (§15).

## 1. Scope

Sections: **Welcome → About → Work → Contact**. Case studies at `/work/[slug]`.

**Farewell is cut.** Its premise is the visitor's clock — the mechanic being removed. Its copy and component go to the archive branch. The site now ends on the Contact footer, per the handoff.

## 2. Archiving Cold Noon

Cold Noon is ~25 components plus a scene engine and a first-paint script. Unlike the diurnal palette — parked as a data file behind `ACTIVE_STYLE` because it *was* just data — there is no cheap in-tree switch for an entire system. Carrying it forward would drag the rejected architecture into the new codebase permanently.

- `cold-noon-visual-language` stays unmerged and gets an annotated tag: `archive/cold-noon`.
- Its spec and `docs/notes/cold-noon-project-summary.md` land in `main`'s docs, so the history is readable without a checkout.
- `PLAN.md` records the one command to run it again.
- v3 is built on a fresh branch off `main`.

The diurnal palette (`scene-config.diurnal.ts`) goes with it — same archive, same reason.

## 3. Token layer — two locked palettes

The ~40 scene custom properties are replaced by two hand-authored palettes. **They are not interpolated, not derived, and not clock-driven.** That is the entire point: two fixed sets that can be looked at and locked.

Declared on `:root` and `:root[data-theme="dark"]`, mapped to Tailwind utilities by the existing `@theme` block in `globals.css`. Recurring materials and type roles stay semantic classes in `@layer components` — the current convention holds.

**Both palettes are hand-edited, and that is a requirement.** They sit adjacent in `globals.css`, one block each, same token names in the same order, so the two can be read side by side and a value changed in one line. Nothing is derived, computed, or generated from the other — a hex is a hex. Dark is expected to be iterated on after it is built (Jono, 2026-07-16); anything that makes changing a colour require touching logic is a defect.

### Light (handoff verbatim)

```
--about:    #3f9b4e   /* green  — About accent  */
--work:     #6d4bd8   /* violet — Work accent   */
--contact:  #2f7d8f   /* teal   — Contact accent */
--ink:      #0d0d0d
--mute:     #9a9a9a
--dim:      #bcbcbc   /* teleprompter resting word */
--hairline: #e6e6e6
--row-hover:#fafafa
--canvas:   #ffffff
--nav-glass: rgba(255,255,255,0.6)
```

### Dark (authored here)

Canvas `#000000` per the brief. The handoff accents fail on black — violet lands ~3.2:1 — so each is lifted to clear **4.5:1 on `#000`** while holding its hue identity. Starting values, to be tuned against the pixels before locking:

```
--about:    #57c46a
--work:     #9d86f0
--contact:  #5ab6cb
--ink:      #f2f2f2
--mute:     #7d7d7d
--dim:      #3a3a3a
--hairline: #1c1c1c
--row-hover:#0a0a0a
--canvas:   #000000
--nav-glass: rgba(0,0,0,0.6)
```

**Verification is visual, not mechanical.** Cold Noon's central lesson was that "tests pass" said nothing about whether the pixels looked right. Both palettes get rendered and eyeballed at every section before they lock.

### The hardcoded-hex trap

The prototype's teleprompter interpolates toward `'#0d0d0d'` and `'#bcbcbc'` as **JS string literals**, not tokens. Ported as-is, dark mode breaks silently — emphasised words would resolve to near-black on a black canvas. **Every colour the motion layer interpolates must be read from the token layer** (resolved once per theme change and cached, not per frame).

## 4. Theme

- Default: `prefers-color-scheme`.
- A nav toggle overrides it; the choice persists in `localStorage`.
- An inline pre-hydration script resolves `localStorage` → media query → stamps `data-theme` on `<html>` before first paint, so dark never flashes white. This is `pre-hydration-scene.ts`'s pattern with a new job; `<html>` keeps `suppressHydrationWarning` for the same reason as today.
- The toggle is **type, not an icon** — the design is type-only by rule.

> The handoff says "persist nothing to localStorage." That rule is about *which case study is open* — the URL owns that. A theme preference is precisely what localStorage is for. Deliberate, scoped exception.

## 5. Content architecture

**Case studies need no migration.** `content/work/*.mdx` already carries the exact frontmatter keys the detail overlay wants (`client`, `sector`, `discipline`, `platform`, `role`, `timeframe`, `view`, `impact`) and the exact section headings it renders (`Overview`, `The challenge`, `What I did`, `Outcome`). The existing Velite `sections()` transform already emits `{heading, body}[]` — the same shape the prototype hand-codes as `[heading, prose][]`. Work is a pure presentation rebuild.

Mappings: `draft: true` ↔ the prototype's `stub` / "Needs input" state. `client` ↔ the detail eyebrow. `view` ↔ `url-label.ts`, which already renders a URL as a bare domain.

### New: `content/site/`

A third Velite collection — `welcome.mdx`, `about.mdx`, `contact.mdx` — carrying prose.

**The About statements become plain markdown.** Each paragraph is one statement; inline emphasis carries the teleprompter's word roles:

| Markdown | Role | Rendering |
|---|---|---|
| unmarked | `a` (ambient) | mixes `--dim` → `--about`, weight 400 → 440 |
| `**bold**` | `e` (emphasised) | mixes `--dim` → `--ink`, weight 400 → 780 |
| `*italic*` | `i` | mixes `--dim` → `--ink`, weight 400 → 440, italic |

So the author writes:

```mdx
For two decades I have solved challenging product and UX problems at **Yahoo!**,
**Amazon**, **Meta**, and smaller startups, and now as founder of **Collaya**.
```

A Velite transform reads the raw body, splits paragraphs into statements, and tokenises each into `{text, role}[]`. Pure function, unit-tested — structurally identical to the proven `splitMarkdownSections`. Editing the words, or which words land heavy, never touches a component.

Tokeniser contract: split on whitespace; punctuation stays attached to its word; the rendered spans carry no whitespace between them (the `.aline` flex `column-gap: 0.26em` supplies the spacing, per the prototype).

`site-content.ts` keeps only micro-strings — nav labels, accessible names, button text, validation messages — where the compiler checks them.

## 6. Welcome

Full-height, `6vw` gutter, no nav. Eyebrow → wordmark → tagline, `scroll` cue bottom-left.

**Wordmark**: `config-variable`, ALL CAPS, wght 300, tracking 0.14em, `clamp(3rem, 9vw, 8rem)`, `line-height: 0.9`. Each letter is a span.

**Living gradient**, per letter — never on the container, or letters vanish while transformed during build-in:

```css
background: linear-gradient(92deg, var(--about) 0%, var(--work) 40%, var(--contact) 74%, var(--about) 100%);
background-size: 280% 100%;
background-clip: text;
-webkit-text-fill-color: transparent;
animation: drift 9s ease-in-out infinite;
```

Per-letter `animation-delay`: `0, -0.6, -1.2, -1.8, -2.4, -3, -3.6, -4.2s`. Negative offsets phase each letter into the same loop, so colour travels through the word rather than eight letters pulsing together. The gradient returns to `--about` at 100% so the 280% pan is seamless.

This is the one place three accents coexist. Welcome owns no accent of its own; the gradient previews all three. "One accent per section" holds for About/Work/Contact.

**Build-in**: letters from `scale(2.5) translateY(-0.06em) blur(9px) opacity:0` to rest, `transition-delay: 0.3 + i×0.08s`. Eyebrow leads immediately; tagline + cue follow at 1540ms (`0.3 + n×0.08 + 0.6`).

### Bugs to fix, not port

1. **Reduced motion leaves the wordmark permanently 2.5× scaled and 9px blurred.** The prototype's reset targets `#wm-fly .l`, but the fly copy is `display:none` in reduce mode; the visible anchor letters only get `opacity` overridden and keep inheriting the from-state transform and filter. v3 resolves to rest state on whichever copy is visible.
2. **No accessible name under reduced motion.** `aria-label` lives on the fly copy, which is hidden in that mode. The accessible name must not depend on the motion path.
3. **`drift` is never gated.** An infinite colour animation must respect `prefers-reduced-motion`; it resolves to a static mid-phase fill.

## 7. Nav + morph

Fixed, `padding: 26px 6vw`, z-index 40, glass (`--nav-glass` + `backdrop-filter: blur(20px) saturate(1.4)`). Hidden until `header-on`; `opacity .4s`, `transform .45s cubic-bezier(.2,.7,.2,1)`.

Scroll-scrubbed FLIP over the first `0.85 × vh`: `p = clamp(scrollY / (0.85·vh), 0, 1)`, eased `e = p²(3−2p)`. An in-flow anchor (`visibility:hidden`) supplies the start rect; a fixed fly copy (`z-index:45`, `transform-origin: 0 0`) moves. Interpolate left edge, **vertical centre**, and scale (`1 → endH/startH`), then convert centre back to a top-left `y = cy − (startH·k)/2`. `header-on` toggles at `p > 0.98`.

**The landed wordmark keeps the living gradient** (Jono, 2026-07-16; visible in the 2026-07-16 prototype still, where the nav mark reads green→violet). This is automatic rather than a special case: the fly copy *becomes* the nav brand — it never fades out and the `#brand-slot` stays at `opacity: 0` behind it forever — so the gradient and its 9s `drift` simply ride along at nav scale. Do not "simplify" the landed state to a flat-ink brand; and note `drift` must keep running after the morph settles.

**Reuse `use-wordmark-morph.ts`.** It is already this mechanic with this math, and it already fixes a bug the prototype has: measuring the nav slot while the header still sits under its `translateY(-16px)` hidden transform sends the wordmark 16px off. The existing hook reads and undoes that transform. Re-point its geometry; keep its correction.

Deltas to adopt from the prototype: measure every frame (the hook measures on ScrollTrigger refresh) — this is what keeps it correct before fonts load, and re-measuring on `document.fonts.ready` is required regardless.

**Scroll-spy**: viewport-midpoint hit test, first match wins — not IntersectionObserver. The About target is the 640vh wrapper, not the zero-height `#about` anchor stub. The handoff calls for the mid test explicitly, and it behaves predictably against a 640vh section where ratio-based IO does not.

**Detail pages**: no hero to morph from — mark the header `data-static` and render it present from first paint.

## 8. About — teleprompter

A `640vh` wrapper drives a `sticky`, `100vh`, `overflow:hidden` stage. Scroll budget 540vh. Locked title "Who I am." top-left in `--about`. Right rail of 4 dots (6px → 9px, `--dim` → `--about`, `all 0.4s ease`).

```js
focalY     = vh * 0.6                                   // focal centre
focalRange = vh * 0.24                                  // falloff radius
lp         = clamp(-wrapRect.top / (wrapH - vh), 0, 1)
activeCenter = lerp(firstBlockCenter, lastBlockCenter, lp)
column.transform = translateY(focalY - activeCenter)
```

Per block:

```js
delta = block.center - activeCenter
focus = 1 - smoothstep(0, focalRange, abs(delta))
blur    = delta < 0 ? (1-focus) * 7 : (1-focus) * 2
opacity = delta < 0 ? lerp(0.5, 1, focus) : lerp(0.14, 1, focus)
```

Per word: `color = mix(--dim, live, focus)`, `wght = lerp(400, target, focus)`, where `live`/`target` come from the role table in §5.

**Build the code's behaviour, not the README's paraphrase** (register #5, #6).

**Colour roles are inverted from the README.** `README:109` says emphasised words take the accent. The code gives the accent to *unmarked* words and sends *emphasised* words to **ink** at weight 780. The design is a field of green with black bold hits — not black text with green highlights. This is the single most consequential misreading available here: build it from the README and the section reads inside-out.

**Base weight is 400**, not 440 — 440 is the ambient target.

**The opacity floors are counterintuitive and the README omits them.** Words above the focus blur hard (7px) but hold a floor of **0.5**; words below stay crisp (2px) but fade to **0.14**. Read words go soft but stay present; unread words stay sharp but recede. The blur figures themselves match the README exactly — only the floors are missing from it.

Measure block centres on resize and `document.fonts.ready`.

### Every constant above lives in `teleprompter-config.ts`

The focal position and range, both blur ceilings, both opacity floors, the weight floor and its three targets, and the rail dot sizes are **tunables, not literals** — the same treatment `wordmark-config.ts` and `scene-config.ts` gave their recipes. Jono expects to tweak the 0.5 floor and its neighbours by feel after seeing it move (2026-07-16), and that must be a one-line edit in one file, not a hunt through a hook.

```ts
export const TELEPROMPTER = {
  focalPosition: 0.6,      // × vh — where the focused line sits
  focalRange: 0.24,        // × vh — falloff radius
  blurAbove: 7,            // px at zero focus, already-read
  blurBelow: 2,            // px at zero focus, not-yet-read
  opacityAbove: 0.5,       // floor at zero focus, already-read
  opacityBelow: 0.14,      // floor at zero focus, not-yet-read
  weightFloor: 400,
  weightAmbient: 440,
  weightEmphasis: 780,
  dotRest: 6, dotActive: 9, // px
} as const;
```

The focus/blur/opacity/weight math itself is a pure function over this config and a distance — unit-tested, no DOM. The hook does measurement and writes styles; it holds no numbers.

Guard fix: the prototype uses `if (!this.first) return`, so a first-block centre of exactly `0` silently kills the teleprompter. Use an explicit measured flag.

## 9. Work — hybrid

Two views over one dataset. Toggled from the Work section's own locked header, beside the counter — **not** the nav. Global chrome stays global; view state stays local. This is also what keeps the theme toggle from crowding the nav.

### Why horizontal can work here, when the shelf didn't

The Cold Noon shelf was killed for being scroll-jacked and disorienting, with reveals firing off-screen. The failure was not "horizontal" — it was **reading long-form prose sideways**: four panels *per study*, ~28 panels deep, on a reading surface.

This is **one card per study, a single-figure panel count, an index**. You skim a poster wall; you don't read it. Same word, different mechanic. And the index toggle is a permanent escape hatch the shelf never had. If the gallery still doesn't earn its place on the pixels, the index is already built and the toggle becomes a default.

### Gallery (default)

Sticky `100vh` stage; vertical scroll translates `#wtrack` in X. One card per published study, plus a final "earlier work" panel (2-col list).

**Every count here is derived from the content, never written down.** The prototype's nine panels were eight studies plus the earlier panel; today four studies are published and the rest are `draft: true` until their copy is written, so it renders five. That number changes as studies land and no code may change with it — see gap 1 (wrapper height) and gap 4 (card numbers) below, which are both this same fault in the prototype.

```js
travel = max(0, track.scrollWidth - innerWidth + innerWidth * 0.06)   // trailing gutter = 6vw inset
lp     = clamp(-wrapRect.top / (wrapH - vh), 0, 1)                    // linear, no easing
track.transform = translateX(-lp * travel)
progress.width  = lp * 100 + '%'
```

Active index is the card nearest viewport horizontal centre (not derived from `lp`); cards within `0.55 × innerWidth` of centre sit at opacity 1, else 0.42, `transition: opacity 0.5s ease`.

Wayfinding: locked title, live `01 / NN` counter (`NN` = panel count, off the data — `01 / 05` today), progress bar pinned bottom.

### Horizontal input pans it too

Vertical scroll is not the only way in. A horizontal gesture over the pinned stage — a trackpad's two-finger swipe, a horizontal wheel, shift+wheel — pans the track, as it would on any horizontal surface. A visitor who sees a row of cards will try to swipe it sideways, and that must work.

It must pan by driving **vertical scroll**, never by moving the track directly. `translateX` is derived from `lp`, which is derived from `window.scrollY`. A handler that wrote `translateX` itself would be a second source of truth for the same pixel, and the next vertical frame would snap the track back out from under the gesture. So horizontal input converts to its vertical equivalent through the same ratio it came out of:

```js
scrollDelta = deltaX * (wrapH - vh) / travel   // the inverse of the translate above
```

Two hazards, either of which makes the feature worse than its absence:

1. **macOS reads a two-finger horizontal swipe as Back.** Panning the gallery must never navigate the visitor off the site. The stage needs `overscroll-behavior-x: contain` and/or a `preventDefault` on the events it consumes. This is not a polish item — it is the difference between the feature and a trap.
2. **Lenis owns the wheel.** It is configured `gestureOrientation: 'vertical'` (its default), so it reads `deltaY` and ignores `deltaX`; it also `preventDefault`s to do its own smoothing. Horizontal input must therefore cooperate with Lenis — feed it, or be scoped around it — and must not become a second scroll mechanism running beside it. CLAUDE.md's standing rule applies: one RAF loop, one scroll owner.

Live only while the stage is pinned; outside it, horizontal gestures do whatever they normally do. Inert under reduced motion and in the index view, neither of which has a track.

Card: `width: min(66vw, 820px)`, `height: 56vh`, `margin-right: 5vw`, grid `1.05fr 0.85fr`. Number (accent) + year (mute) top; title `clamp(1.8rem,3.2vw,3rem)` wght 600 pinned bottom via `margin-top:auto`; impact `max-width:30ch`; accent-outline tag pills (radius 100px); "View case study →". Image slot `.wshot` — hatched `repeating-linear-gradient` placeholder, wired to the optional `cover` field already in the schema, so a real screen drops in with no code change. Draft impact renders italic.

### Prototype gaps to close

1. **`520vh` is hardcoded and decoupled from `travel`.** Scroll-to-pixel rate drifts silently as cases are added or removed. Derive wrapper height from measured track width.
2. **Zero `@media` queries.** The index becomes the layout under ~900px.
3. **Zero reduced-motion handling.** Under reduce, the gallery collapses to the index.
4. **Card numbers `01`–`08` are hardcoded in markup** while the counter is live off `cards.length`. Derive both from data.
5. Card copy is duplicated between the card and the `DATA()` object, and already drifts (one says "program, zero to a live product", the other "program, from zero to a live product"). MDX is the single source; the duplication cannot recur.

### Index (alternate, and the automatic fallback)

Vertical rows, filterable by **Sector** and **Discipline** — both derived from frontmatter, no new content. Grid `64px 1fr auto`. Hover: `padding-left 0→24px`, bg `--row-hover`, title wght 480→620, number → accent, arrow fades in, all `0.4s cubic-bezier(.2,.7,.2,1)`.

## 10. Detail — intercepting routes

The prototype's overlay and the repo's `/work/[slug]` are the same thing at two fidelities. Next's parallel + intercepting routes give both:

- `@modal/(.)work/[slug]` — slides up from a gallery/index click, `translateY(100%→0)`, `0.6s cubic-bezier(.2,.8,.2,1)`, pill close top-right, Escape to close.
- `/work/[slug]` — full page on direct load, refresh, or share.

URL stays the source of truth for what's open; back button and SEO both work. Content: eyebrow (`client`), `h1`, impact lead, attribute grid (`dt`/`dd`), labelled prose sections from `sections()`, `.dshot` slot.

**Add the scroll lock the prototype lacks.** It relies on `overscroll-behavior: contain` alone, so the page scrolls behind the open overlay. Stop the Lenis instance while the modal is open and resume on close.

If intercepting routes fight Lenis badly enough to cost more than they return, fall back to plain route navigation and drop the slide-up. The overlay is a nice-to-have; a working URL is not.

## 11. Motion

Curves: standard `cubic-bezier(.2,.7,.2,1)`; overlay `cubic-bezier(.2,.8,.2,1)`; wordmark letter `cubic-bezier(.2,.85,.24,1)`.
Durations: reveal 0.85s · hover 0.4s · nav accent crossfade 0.5s · overlay 0.6s · wordmark letters 0.55–0.9s.

Reveal: one-shot IntersectionObserver at threshold 0.2, `unobserve` on fire, `opacity 0→1` + `translateY(26px→0)`.

**Everything runs on the existing single Lenis + GSAP ticker.** No second RAF loop — a stray one has silently locked scrolling on this site before. Re-measure on resize and `document.fonts.ready`.

**Reduced motion is a first-class path, not an afterthought.** The prototypes gate almost nothing (§6, §9). Under reduce: no wordmark flight (header static from first paint), letters resolve immediately, `drift` static, teleprompter renders all statements at rest weight, gallery becomes the index.

## 12. Contact

`min-height:100vh`, `6vw` gutter. Sticky `h2` "Let's talk." at `top:84px` in `--contact`. Lead `max-width:34ch`. Form: 2-col grid, `gap: 26px 40px`, `max-width:900px`; full-width fields span both columns. Inputs transparent, bottom-border only (`#d0d0d0` → `--contact` on focus), mono uppercase labels. Button: solid `--contact`, white, radius 2px, wght 560, `16px 40px`, hover `translateY(-2px)`. Footer: mono email + LinkedIn / Read.cv / Résumé, underline-on-hover in `--contact`.

**Take the prototype's styling, keep our logic.** The prototype's form has no `name` attributes, no `required`, no submit handler, and `onsubmit="return false"` — it is a visual mock. The repo already has a working Resend route with tests and custom validation copy. Restyle; do not re-plumb.

## 13. Disposition

**Parked to `archive/cold-noon`:** `src/components/sky/**` (20 files), `scene-engine.ts`, `scene-config*.ts` (all three), `pre-hydration-scene.ts`, `active-style.ts`, `style-attribute.tsx`, `sky-parallax.ts`, both tune panels, the time scrubber, `decode/**`, `slab/**`, `decode-engine.ts`, `slab-reveal.ts`, `carve-engine.ts`, `area-font.ts`, `wordmark-engine.ts`, `hero-config.ts`, `wordmark-config.ts`, `lockup-math.ts`, `optical-kerning.ts`, `hero-wordmark.tsx`, `wordmark-tune-panel.tsx`, `farewell/**`, `farewell-word.ts`, `seeded-random.ts`, `work/shelf-*` (topology no longer applies).

**Untouched:** the Velite pipeline and all `content/**`, `smooth-scroll.tsx`, `gsap.ts`, `mdx-content.tsx`, `hash-scroll.tsx`, `use-reduced-motion.ts`, `fonts-ready.tsx`, `api/contact/route.ts` + test.

**Repurposed:** `use-wordmark-morph.ts` (§7) · `pre-hydration-scene.ts` → `pre-hydration-theme.ts` (§4) · `shelf-math.ts` → gallery scroll→X (§9) · `url-label.ts` (§5) · `case-study-*` → detail surface (§10) · `use-scroll-spy.ts` → mid-test rewrite (§7) · `site-content.ts` → labels only (§5).

**New:** theme provider + toggle · `content/site/` collection + statement tokeniser · teleprompter · gallery + index + toggle · `@modal` intercepting route · Config Variable registration.

Also remove: the unused `Geist`/`Geist_Mono` `next/font/google` imports in `layout.tsx` — leftovers; the site is served entirely from the Adobe kit.

## 14. Conventions (unchanged, and the reason for §5)

- **Content never lives in JSX.** Case studies and prose are MDX; micro-strings live in `site-content.ts`; tunables live in config modules.
- **Design decisions live in CSS**, as tokens mapped to Tailwind by `@theme`, with recurring materials as semantic classes in `@layer components`.
- Adding a case study stays: one `.mdx` file, no code changes.
- `pnpm build` before committing.

## 15. Risks

| Risk | Mitigation |
|---|---|
| The gallery repeats the shelf's failure | The index is built first and is a real destination, not a fallback. If the gallery doesn't earn it on the pixels, flip the default. |
| Dark accents go muddy — the exact Cold Noon failure | Two locked palettes, eyeballed at every section in both modes before locking. Contrast floor 4.5:1 is a gate, not a goal. |
| **The About wall in dark mode** — highest-risk surface on the site | Confirmed by the 2026-07-16 prototype still: About is a near-full-screen field of `--about`, with the section title in the *same* accent layered over a blurred column of it. On white it reads; on black it is the most likely place for "muddy, can't pop" to return. **Build and eyeball this surface in dark first, before the rest of the dark palette locks** — it constrains `--about` more than any other view. If lifted green can't carry the wall, the fallback is ink body copy with accent emphasis (i.e. the README's inverted reading) for dark only — a real design change, so Jono decides, not the implementer. |
| Config Variable isn't in kit `aqv1jgr`, or its axes are clamped like Area's | Verify at build start. `area-font.ts` is the precedent for re-registering with honest axis ranges if needed. |
| Intercepting routes fight Lenis | Fall back to plain navigation; drop the slide-up (§10). |
| Adobe kit domains still unset | Pre-existing deploy blocker, unchanged by v3. Jono-side. |

## 16. Open, deferred

- Case-study screens for `.wshot` / `.dshot` — hatched placeholders ship until they exist; `cover` is already in the schema.
- Content gaps unchanged from `PLAN.md`: Collaya, Tappa, Meta 01, Meta 02 are `draft`; Amazon Key In-Home awaits Jono's role; résumé URL empty.
- 3D layer: still parked, still nothing installed.
