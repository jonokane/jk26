# jonokane.com — Visual Language Revision: "Cold Noon"

**Date:** 2026-07-14
**Status:** Approved (Jono, this session)
**Supersedes:** `2026-07-11-site-experience-design.md` §3 (the living sky), §3.2 (derived tokens), and the
**hero wordmark** (§5 — face, build-in, and lockup are redesigned here; see §11). The header morph (§6) still
applies but now flies the new face. Untouched from that spec: the collector (§7), the shelf (§8), the content
model (§9), the farewell (§11 there), accessibility (§12), continuous scrubbed motion (§14), code organization
(§15).

**Scope note:** this revision grew past a pure repaint. It now covers the palette, the sky roster, materials,
the contrast invariant, the lens, **and a full motion system** (the arrival, the terminal/decode language, the
wordmark face, the slab build-in, the flying elements). Layout and the broader type system are deliberately
left open — see §2 and §18.

---

## 1. Why

The site's structure, motion, and content are right. Its *register* is not. The living sky was cheerful:
cartoon clouds, flapping birds, a friendly sun. That is not Jono, and it is not the work.

The target is the intersection of **Ash Thorp** and **Chris Cunningham** — slick futurism laced with grime and
dread. The reference that settled the palette is the sea-wall shot from *Blade Runner 2049*: near-monochrome,
luminous gray, colossal, and utterly desolate, with the only true blacks in the frame belonging to the two
human figures.

### The thesis

**Two kinds of beautiful, both wrong.**

| | |
|---|---|
| **NIGHT — the street** (Thorp / Neuromancer) | Grimy, wet, neon bleed, haze glow, signage burning through fog. Seductive and filthy. **Alive.** |
| **DAY — the lab** (Cunningham) | High-key, blown-out, clinical. A sun that is a white hole punched through smog. Monumental, silent, **not built for people.** |

The clock survives, and it now *means* something. Midnight seduces you; noon exposes you. Neither is safe,
and neither is dull. The register is not nihilism — there are still people in this world, or maybe we are all
cybernetic now and can't quite remember which. It is **sleek, futuristic foreboding**: a beautiful world you
can't be sure is still human. Ambiguity, not villainy. And certainly not cute.

**The insight that made this tractable:** brightness was never the enemy. *Cuteness* was. `All Is Full of
Love` has no dark frames and is deeply unsettling; the Vegas sequence in BR2049 is blindingly orange and one
of the most desolate images in film. So this is not a repaint. **It is a vocabulary swap.**

---

## 2. Locked vs. open

### Locked — do not relitigate

- **All copy and content.** The MDX case studies, `site-content.ts`, the intro beats, the farewell. Every
  string stays; some strings *move* (see the tagline, §11) but none are rewritten.
- **The information architecture.** The one-pager, the collector, the horizontal shelf, `/work/[slug]`.
- **The header morph and scroll-spy** (they now carry the new face).
- **The scene architecture.** 8 keyframes → `applySceneToRoot` → CSS custom properties on `<html>`. No RAF in
  the scene system. Sampled once a minute. The pre-hydration first-paint script.

### Open for exploration — decided later, not here

Jono explicitly reopened these; the spec must not claim they are settled.

- **Layout.** The visual language shift may warrant layout tweaks — most concretely, the new hero lockup is
  **centered** (§11), which likely reshuffles a hero that is left-aligned today. A dedicated layout pass.
- **The broader type system.** The wordmark face *is* decided (§11: Config). But Mae's role as the supporting
  face, and any other type roles, get a dedicated typography pass with the real licensed files loaded.

### Changed here (was "unchanged" in the prior spec)

- **The hero wordmark.** New face (Config, §11), new build-in (the arrival decode, §10), new lockup (§11). The
  parked Area/TotalBlack heroes stay parked; the *live* wordmark is redesigned. The cursor weight-carve is an
  open detail (§11) — it depends on whether Config ships a weight axis.

---

## 3. The palette — "Cold Noon"

**Saturation is on its own curve.** Deep color at the low-sun hours; it *drains out of the world* at noon.
This is physically true (long atmospheric path at dawn/dusk scatters out the blue; a high sun washes
everything), which is why the existing `rays` weight already peaks at 1.0 at Dawn and sits at exactly 0.0 at
Midday. The engine has been telling us this the whole time.

**The color system:**

> **Warm = the world dying** (sodium, rust, decay, human).
> **Cold = the machine** (cyan signage, chrome, clinical).
>
> Night holds both in tension. **At noon the machine wins** — the warmth is bleached out entirely.

Noon is therefore not a stylistic exception. It is the one hour the world's argument is settled.

### 3.1 The eight keyframes

Replaces the table in `src/lib/scene-config.ts`.

| h | Name | `top` | `mid` | `hor` | `ink` | `sub` |
|---|---|---|---|---|---|---|
| 0.0 | Midnight | `#04060d` | `#0a1018` | `#112630` | `#dde9ef` | `#7b8f99` |
| 4.7 | Night's end | `#06080f` | `#0c1420` | `#16303c` | `#dfeaf0` | `#86a0ab` |
| 6.0 | Dawn | `#1b1a26` | `#4a3a3e` | `#a5714a` | `#f0e4d8` | `#c9a488` |
| 8.0 | Morning | `#566a72` | `#84939a` | `#b3bdbe` | `#10161a` | `#46555c` |
| 12.5 | Midday | `#75868d` | `#95a4a8` | `#bec8c8` | `#101719` | `#47565b` |
| 17.8 | Golden | `#6b6571` | `#b17b53` | `#e9a662` | `#201509` | `#6d4e2c` |
| 19.8 | Dusk | `#231f36` | `#4b3451` | `#8b4b53` | `#f2e2e6` | `#c9a3b0` |
| 21.5 | Evening | `#0a0e19` | `#142134` | `#24394b` | `#dbe6f0` | `#8299ac` |

Dawn / Golden / Dusk / Evening are the deep saturated washes. Morning / Midday are the cold, drained,
BR2049 grays. **These are starting values** — refine them in the `?tune` panel and copy the JSON out, per
the existing workflow. Do not hand-edit them mid-implementation.

### 3.2 Accent colors

Not scene tokens; constants used by the night faces of world objects.

- **Signage cyan:** `#7fd8e8` — the machine.
- **Sodium amber:** `#ff9a3c` — the dying world.

---

## 4. The sky roster — seven layers

**Zero new keyframe fields.** Two weights are renamed and re-curved; the rest are unchanged. This was a hard
constraint and it held.

| Layer | Status | Notes |
|---|---|---|
| `gradient` | keep | Re-tuned by the palette above. |
| **`haze`** | **← was `clouds`** | Vast, soft, layered volumetric bands. Not objects *in* the sky — it **is** the atmosphere. |
| **`transports`** | **← was `birds`** | Enormous, silent, very distant, crossing dead-straight. |
| **`megastructure`** | **NEW** | See §5. Has **no weight** — it is always the world. Its visibility is handled by aerial perspective in the color derivation. |
| `rays` | keep | Gets *better*. God rays through smog is peak Thorp, and the curve is already correct. |
| `sun` / `moon` | keep, redrawn | The sun is no longer a friendly disc: it is a **luminous region** — a white hole punched through smog with a hard bloom and no hard edge. |
| `stars` | keep, retuned | Sparser, harder, fewer. They compete with the city's own light now. |

**Deleted:** the four-ellipse vector cloud. The flapping bird.

### 4.1 The single most important deletion

```css
@keyframes flap { ... }   /* dies */
```

**Birds flap. Machines do not.** The menace lives entirely in the rigidity — something that large moving that
steadily, that silently, indifferent to you. This one deleted keyframe carries more of the register change
than any color in §3.

### 4.2 Day face / night face

Every world object has two faces, crossfaded by a derived `--daylight` token (§6.2). **This costs no new
weights** and it is how the roster stays at seven layers while delivering both monumental daytime silhouettes
and glowing night-time drones.

| Object | Day face | Night face |
|---|---|---|
| Transports | Hard silhouette against blown-out haze | **Running lights** in the dark |
| Megastructure | Silhouette receding into luminous haze | **Window grid + signage bloom** |

### 4.3 Re-curved weights

`haze` and `transports` inherit curves whose meaning has changed, and inheriting them naively is a trap:
the old `birds` weight is **flat zero all night**, which would give us drones that only fly at lunchtime.

| Weight | Midnight | Night's end | Dawn | Morning | Midday | Golden | Dusk | Evening |
|---|---|---|---|---|---|---|---|---|
| `stars` | 1.0 | 0.75 | 0.2 | 0 | 0 | 0 | 0.45 | 0.9 |
| `rays` | 0 | 0.2 | 1.0 | 0.3 | 0 | 0.4 | 0.12 | 0 |
| `haze` | 0.35 | 0.3 | 0.5 | 0.8 | 1.0 | 0.75 | 0.55 | 0.4 |
| `transports` | 0.5 | 0.35 | 0.5 | 0.8 | 0.9 | 0.7 | 0.6 | 0.55 |
| `sun` | 0 | 0 | 0.25 | 0.75 | 1.0 | 0.55 | 0.08 | 0 |
| `moon` | 1.0 | 0.5 | 0 | 0 | 0 | 0 | 0.25 | 0.7 |

`haze` is **never zero** — at night it is what the neon bleeds into.

---

## 5. The megastructure

### 5.1 Form language

**Gesture, not skyline.** One colossal form the viewer **cannot name.** Ambiguity is the entire engine of
dread — the moment someone thinks *"oh, buildings,"* it stops being unsettling, which is precisely the
mistake the cute clouds were making, repainted gray.

Required properties, all present in the reference still:

1. **A vanishing point.** Parallel lines converging. This is what makes the body feel scale, and it is what
   my first CSS-ellipse attempt entirely lacked.
2. **Aerial perspective.** Far masses wash toward `--sky-hor` until they are nearly indistinguishable from
   the sky. *This is where most of the perceived depth comes from — not from detail.*
3. **Something overhead.** A gantry crossing the frame and converging to the same vanishing point. Oppression
   comes from mass *above* you.
4. **An inverted mass** — wider at the top than the bottom, so it leans over the viewer.
5. **Pylons receding** into fog, each smaller and lighter than the last.
6. **Scale specks.** Two or three 2px marks. Without them nothing has a size.
7. **Detail lives in the SURFACE — staining, streaks, grain — and never in the silhouette.**

**Rejected:** greebling (panel lines, vents, hard-edged detail). Every greeble makes the form more
*nameable* and drags it back toward a skyline.

### 5.2 Flat vector, with parallax

**Implementation: SVG paths filled with `var(--struct-*)` tokens.** They recolor themselves at every hour of
the day for free, weigh ~3kb, and are native to the token system.

**Parallax is where most of the perceived depth of "3D" actually comes from.** Four layers at four rates,
driven off the **existing GSAP ticker via ScrollTrigger** — Lenis already drives it.

- Depth rates (fraction of scroll): far `0.03`, mass `0.09`, pylons `0.18`, gantry `0.40`.
- A secondary **pointer axis** at low amplitude, hero only. Pairs naturally with the existing cursor carve.
- **NO second RAF loop.** This is the single hardest rule in the codebase and it has been violated once
  before at great cost.

### 5.3 3D is parked, with the door open

Real 3D (Three / R3F) buys exactly one thing flat cannot fake: **light that moves with the sun** — a
directional light riding the same arc, re-shading the structures across the whole day, through real
volumetric fog whose color is literally `--sky-hor`. That is a stunning extension of the living sky.

It costs 150–600kb, a WebGL loop on a page already running Lenis + ScrollTrigger + the carve engine, and
mobile is where that gets ugly.

**The deciding argument:** the flat layer is not the cheap alternative to 3D — it is a **prerequisite** for
it. Reduced-motion users, no-WebGL users, low-power devices, and *every visitor's first paint* all need it.
It gets built either way.

**Decision:** build the flat layer properly, put it in the real site, look at it at several hours, and let it
earn or lose the 3D upgrade. The component boundary is identical either way — `megastructure.tsx` swaps its
internals and nothing else in the system knows.

---

## 6. Materials

### 6.1 The elevation rule (replaces the `inkLight` card branch)

A constant near-black slab **fails at midnight**: the sky there is `#04060d` and a black panel on a near-black
sky has nowhere to go. The pop that is spectacular at noon evaporates at exactly the hour the site is most
beautiful.

> **The slab keeps a constant contrast step away from the sky — darker when there is room below it, lifted
> when there is not.**

The material identity never changes: it is **always a dark surface with light text.** Only its value moves.
The old `inkLight` branch that flipped `--card-bg` between dark glass and *white* glass is **deleted** — the
white-frosted-glass card is an Apple idiom, not a cyberpunk one.

```
L    = luminance(--sky-mid)
dark = mix(--sky-mid, #05080a, 0.88)   // room below the sky: go dark
lift = mix(--sky-mid, #cfe0e8, 0.13)   // no room left: lift above the sky
b    = smoothstep((L - 0.18) / (0.26 - 0.18))   // clamped 0–1

slabBg = mixHex(lift, dark, b)
```

So `L ≤ 0.18` (Midnight, Night's end) is fully lifted; `L ≥ 0.26` (every other hour) is fully dark; and the
band between them **blends**.

**CRITICAL — continuity.** The scene interpolates *continuously*. A hard `if/else` at a luminance threshold
would produce a visible **pop** as the day crosses it. That is why the formula above blends across a band
rather than switching. This is exactly the class of bug this codebase specializes in, and it gets a unit
test (§9).

**Rejected:** the lit/emitting edge (a cyan-lit top rule at night). It reads as a videogame dialog box.

### 6.2 New derived tokens

Added to `deriveTokens` in `scene-engine.ts`:

| Token | Meaning |
|---|---|
| `--daylight` | `0–1`, normalized `luminance(--sky-mid)`. Drives every day-face/night-face crossfade. |
| `--struct-far`, `--struct-mass`, `--struct-pylon`, `--struct-gantry` | The four megastructure depths. Each mixes a base toward `--sky-hor` by its aerial-perspective amount, **then is clamped by §7.** |
| `--slab-bg` | Per §6.1. |
| `--slab-ink` | `#e6edee`. A **constant**, not scene-derived — the slab is always a dark surface, so its text is always light. This is the token that replaces the flipping `inkLight` behavior, and it is deliberately *not* `--ink` (which still flips: dark at noon, light at night, because it sits on the bare sky). |

### 6.3 Radius — tokenize it

Radius is currently **five hardcoded values across five files** (`18px` slab, `15px` header, `10px` contact
input, `9999px` pills, `18px` cover). Introduce static tokens in `globals.css`:

```css
--r-slab: 4px;    /* was 18px */
--r-input: 4px;   /* was 10px */
--r-header: 4px;  /* was 15px */
--r-cover: 4px;   /* was 18px */
--r-pill: 9999px; /* unchanged — pills stay pills */
```

**Also drop:** `backdrop-filter: blur()` on `.slab` and `.pill`. Cyberpunk glass is *dirty*, not frosted.

---

## 7. The contrast invariant — "the ink is the darkest thing in the world"

`deriveTokens` guarantees the ink has contrast **against the sky gradient.** That guarantee has held for the
whole project because the sky was always a smooth gradient. The megastructure introduces **hard, near-black
objects into that sky**, and the ink-contrast system knows nothing about them — so at noon the wordmark
(`#101719`) and a black gantry (`#0e1417`) are the same value and **the letters evaporate.**

Same failure class as every other defect in this codebase: two individually-correct systems with no contract
between them.

> **RULE: No sky element may be darker than the ink by day, or brighter than it by night.**
>
> The content always wins the value contest.

This is not an aesthetic preference — it is drawn from the reference. In the BR2049 still, **the two people
and the car are the darkest values in the entire frame.** The architecture is all mid-gray. Villeneuve did not
let the scenery out-black the subject.

**Implementation.** A pure clamp in `scene-engine.ts`:

```
CONTRAST_FLOOR = 0.18   (luminance delta)

for each structure token S:
  if ink is light (night):  require L(S) <= L(ink) - FLOOR
  if ink is dark  (day):    require L(S) >= L(ink) + FLOOR
  otherwise mix S toward --sky-hor until satisfied
```

**Exemption: point lights.** Window grids, running lights, and stars are exempt — they are too small to form
a background or compete for legibility, and at night they are the only things allowed to outshine the
writing. *The city can glow, but it cannot shout over you.*

**Consequence, and it is a feature:** the gantry can no longer be black. The **wordmark becomes the only true
black in the frame** — which is the thing we were reaching for from the start.

---

## 8. The lens

The texture layer. **It does not exist today — there is no grain, no vignette, no dither, nothing.** This is
the single biggest lever for "grimy" and there is currently nothing to dial.

- **Grain.** Static SVG `feTurbulence` (or a tiled noise data-URI), low opacity, `mix-blend-mode: overlay`.
  **Static, not animated** — a still grain is more Neuromancer than a crawling one.
- **Vignette.** One radial gradient. This is what makes the frame feel **photographed rather than rendered**,
  and that is the Thorp quality.

**Placement:** a fixed full-viewport layer **above the content**, not in the sky. It is a *lens*, not a sky
element, and it is **not on a time-of-day curve.**

**The resting grain is where the arrival lands.** The animated boot static of §10 is the same grain, loud and
moving; when the arrival finishes, its RAF loop stops and it settles to exactly this still grain floor. The
lens is the steady state; the arrival is its one-time, animated entrance.

**Rejected: scanlines and chromatic aberration.** These are the cyberpunk equivalent of the flapping bird —
off-the-shelf signifiers anyone can buy, and the moment a viewer recognizes the costume, the dread leaks out.
The sea-wall reference has grain and a lens. It has no scanlines.

**a11y:** the lens must not reduce text contrast below the project's existing bar. Grain opacity is capped and
the vignette must not encroach on reading columns.

---

## 9. The terminal language (the shared motion primitive)

Everything text-heavy assembles the same way: it **decodes**, like a system booting. One primitive, reused,
so the hero and the content feel like one machine coming online rather than a pile of separate effects.

- **Scramble-decode.** Each letter-slot flickers through glyphs — katakana + Latin caps + digits + symbols —
  then locks to its final character. Transient; the glyph set never ships as content.
- **The block cursor.** A thin block in **signage cyan** (`#7fd8e8`), it rides the assembly and then **rests
  permanently after the final glyph, blinking** (~1.05s, hard `steps(1)`): `JONOKANE_`. The cyan is not a new
  color — it is the same accent that lights objects at night (§4.2) and flashes the slab seam (§12). One
  accent, one logic, everywhere.
- **Chaotic, not marching.** Letters ignite at random moments and resolve at random speeds ("both" mechanic:
  cursor **and** scramble together). The result reads as a system *fighting to lock*, not a tidy typewriter.

**The kerning trap (learned this session).** To keep the scramble from jittering, it is tempting to force every
letter into an identical-width box. That is correct *during* the scramble and **wrong at rest** — a narrow
letter (J) floats in a wide box with a huge gap. The rule: **fixed per-letter boxes only while scrambling;
natural per-letter widths at rest.** Measure each final letter's width, lock the box to *that* (not a uniform
width), so kerning is correct at rest and the scramble still never reflows. Same family of bug as everything
else here: a device that is right in one state and wrong in the next, with no handoff between them.

---

## 10. The arrival (first-paint choreography)

A one-time cinematic when the hero loads. This is the site's signature — the dead channel tuning in.

1. **Boot static** (~900ms). Full-viewport animated TV noise (canvas, fresh random per frame) with a bright
   hold-roll bar sweeping down. This is the *only* animated noise in the system.
2. **The flash** (~60ms). A fast white bloom as the signal "locks."
3. **The signal collapse** (~1900ms). The picture tears itself apart: a strong **vertical feedback smear**
   (long downward streaks — grainy at the top, pulling into streaks toward the bottom, matching Jono's
   reference frame), **horizontal raster tears**, a dizzying **hold-slip**, and it fades out — revealing the
   dark sky behind (reads as "to black"). This collapse is the visual-identity moment.
4. **The name survives.** JONOKANE assembles **in front of** the collapse and builds *concurrently* with it
   (§9), clamped to finish within the collapse. Everything falls apart except the name. (Layering bug found &
   fixed this session: the wordmark must sit **above** the signal layer, and the signal must die by fading its
   opacity, not by painting black onto a feedback canvas — that stacks to opaque and buries the wordmark.)
5. **The subtitle** fades in last, once the name is whole and the signal is gone (§11).
6. **Settle.** The RAF loop **stops**; the still §8 grain floor remains.

**Performance & restraint.** The animated noise runs once, for ~2.8s total, then the loop is torn down — there
is no ongoing per-frame animation, so it is impactful without being a battery or jank cost. This is the
answer to "make it unique but not annoying": loud for a moment, then it is simply the resting grain, forever.

**Timing values are starting points** (boot 900ms; collapse ~1900ms; wordmark ignites just after the flash).
Tunable, like the palette.

---

## 11. The wordmark & lockup

### 11.1 The face — Config

The wordmark moves to **Config** (or its family): a **thin, geometric, monoline** sans — circular O, pointed
A apex, even strokes. **Weight 300, tracking .14em.** This is a deliberate turn *away* from a bold techy
grotesque (which read as aggressive) toward **clinical precision** — which is the Cunningham half of the
thesis. Config is licensed; in mockups **Jost** stands in for it (same Futura-geometric skeleton). The real
file ships through the font pipeline that already serves Area and Mae. If Config is unavailable, the brief for
a substitute is: thin, geometric, monoline, circular O, pointed A.

**Legibility caveat:** thin light strokes on the near-black night sky are the risk case. **Weight 300 is the
floor** — 200 may look beautiful on desktop and vanish on a phone at noon under grain + vignette. Verify
across all eight scenes before locking a lighter weight.

### 11.2 The lockup

- **Stacked, centered, tight.** `JONOKANE` over the kicker, ~12px gap. (Centered is a *new* alignment and is
  the concrete reason layout is reopened — see §2.)
- **The kicker** is `siteContent.kicker` = "Product Design Leader & Strategist", **all-caps, .34em tracking**,
  in the supporting face (Mae), centered.
- **Width-justified.** The wordmark is scaled so its rendered width **exactly matches the kicker's**, measured
  live, so their left/right edges align. A locked relationship: change the kicker and the wordmark
  re-justifies. This is lockup math in the spirit of the existing shrink-to-fit hero (`lockup-math.ts`).
- **True centering.** Letter-spacing adds a trailing track after the last glyph; a centered line must cancel
  it (negative right margin = the track) or it sits visibly left of center. Applies to both lines.

### 11.3 The tagline relocates (not lost)

`siteContent.tagline` — "I shape strategy, build teams, lead design, and code the front end that brings it to
life." — is **locked copy that no longer lives in the hero lockup** (the lockup now carries the shorter
kicker). It moves — most likely the opening line of About, or a hero supporting line — in the **layout pass**.
It must not be dropped. Recorded here so the relocation is a deliberate decision, not an accident.

### 11.4 Open detail — the carve

The old hero had a cursor weight-carve (`carve-engine.ts`) that needs a variable weight axis. Whether it
survives depends on Config shipping a `wght` axis. If it does, keep the carve; if not, either drop it or
replace the hover with a different treatment. Decide when the real font is in hand.

---

## 12. The slab build-in (two tiers)

Every slab, card, and form reveals on scroll. **Two tiers, so the page has one loud moment per section and
several quiet ones** — a full decode on every card would exhaust the eye.

**Hero-level slabs** (the first case study, the contact form):
- **Split.** A vertical **cyan seam** flashes/blinks, then the box **expands from that seam** to full width
  via `scaleX`, **Expo-out** easing (`cubic-bezier(.16,1,.3,1)`), ~760ms.
- Then the content **decodes in** (§9): label, heading (scramble + cursor), meta, footer — staggered.
- The seam is the same signage cyan as the cursor and the night-glow.

**Secondary slabs** (repeated cards):
- **Sweep.** The box grows from the **left edge** via `scaleX`, ~480ms, quieter easing
  (`cubic-bezier(.22,1,.36,1)`). **No seam. No decode** — content simply fades in after the box opens.
  Staggered as each enters the viewport.

**Implementation note (learned this session): use `transform: scaleX` via the Web Animations API, not
`clip-path`.** A `clip-path: inset(... round 4px)` will not interpolate the `round` and **jumps** — no easing
is visible and the reveal just pops. Transforms animate reliably and the easing is applied explicitly by
WAAPI. (Two failed clip-path attempts confirmed this before the switch.)

---

## 13. Flying elements — "The Pass" (parked, toggleable)

**The governing principle: pure light, no geometry.** Every attempt to *model* a craft read as cheesy
low-poly — the same trap as the cute clouds and the flapping bird, one more time. A modeled object at low
fidelity is always worse than no object. So: **no craft models. Only light and motion in perspective; the
viewer's brain supplies the ship.**

**The Pass.** Rarely — once every minute or two — a **single** bright light streaks from beside the viewer to
the vanishing point (receding: shrinking, slowing, fading into the haze), throwing a brief **anamorphic
flare** as it passes close. An *event*, not ambient traffic. It ties to the megastructure's vanishing point
(§5) and rides the parallax layers.

**Behind a weight/flag, defaulting conservative.** Jono's live concern: a lone light drifting past a quiet sky
can read as *odd* rather than intentional. So The Pass is gated like any sky element — a weight that can go to
**zero**, leaving the sky empty at no cost. Ship it low; if it looks weird in context, disable it. Nothing
depends on it: the palette, megastructure, grain, and arrival carry the world alone.

**Parked alternative — Skylanes.** Continuous sparse streams of light receding to the vanishing point
(Blade Runner traffic). Documented as the option if the site ever wants *more* life instead of less.

---

## 14. Testing

The unit tests in this project have passed through every single defect it has ever had, because **the math
was always right and the wiring was always wrong.** The scene-math tests below catch the specific wiring
failures this change introduces. (The arrival, decode, and slab reveals are presentational choreography, not
math — they are verified by eye in the real site, not unit-tested; but the **lockup width-justify** is math
and gets a test.)

1. **Contrast invariant, swept across hours.** Assert §7 holds — not only at the 8 keyframes, but at a sweep
   of *interpolated* hours (every 0.25h). **Testing only the keyframes would miss a violation that lives
   between them,** which is precisely where an interpolated system breaks.
2. **Slab elevation continuity.** Assert `--slab-bg` is continuous across the luminance threshold band — no
   step change greater than ε between adjacent sampled hours. This catches the §6.1 pop.
3. **Pre-hydration sync.** The existing test that pins the inline first-paint script's math to
   `scene-engine.ts` must be updated and must keep passing. The script writes 5 vars (`top/mid/hor/ink/sub`)
   and is structurally unaffected, but the keyframe table it serializes changes.
4. **Lockup width-justify.** The wordmark-scaling math (§11.2) — given a kicker width and the wordmark's
   natural metrics, it must return a wordmark size whose rendered width equals the kicker's. Pin it like
   `lockup-math.ts` is pinned today.

---

## 15. Accessibility, motion, and mobile

- **`prefers-reduced-motion` — the sky:** no parallax; haze drift stops; stars stop twinkling; **transports
  freeze in place rather than vanish.** (The birds *vanished* because they were decoration. Transports are
  scenery — a stationary machine in the sky is still a machine in the sky.) The scene remains correct for the
  hour. **The Pass (§13) is off** entirely under reduced motion.
- **`prefers-reduced-motion` — the arrival & reveals:** the **arrival collapse and decode are skipped** — the
  hero renders the settled wordmark and subtitle immediately (no boot static, no signal drop, no scramble).
  The **slab build-in is skipped** — slabs are simply present, content shown, no seam, no sweep, no decode.
  Motion is a garnish here; the content underneath must be whole without it.
- **Grain and vignette are static**, so they are unaffected by reduced motion. The animated boot static,
  however, is motion — hence it is gated above.
- **Mobile.** The megastructure needs a **phone composition, not a scaled-down desktop one** — a distinct
  `viewBox` crop, since a wide cinematic frame squeezed into a portrait viewport loses its vanishing point.
  Grain must use a fixed-size tile so it does not shimmer at 2× DPR. Parallax is scroll-driven only (no
  pointer axis). The arrival's boot-static canvas must be sized to the device pixel ratio without allocating a
  full-res noise buffer (a small offscreen noise canvas scaled up — the technique the prototype used).
- **The hero clear zone.** Composition rule: no structure of competing value may sit behind the wordmark's
  lockup. §7 makes this survivable; composition makes it good.

---

## 16. Files

**Create — sky & materials**
- `src/components/sky/megastructure.tsx`
- `src/components/sky/lens.tsx` — grain + vignette (the resting texture)
- `src/components/sky/use-sky-parallax.ts` — rides the existing GSAP ticker
- `src/components/sky/the-pass.tsx` — the flying-light event (§13), gated by a weight/flag

**Create — motion system**
- `src/components/hero/arrival.tsx` — the boot-static → collapse → decode choreography (§10); tears down its
  own RAF loop on settle
- `src/lib/decode-engine.ts` — the shared terminal/decode + cursor primitive (§9); pure timing/glyph logic,
  unit-testable, framework-agnostic (house style of `carve-engine.ts`)
- `src/lib/lockup-justify.ts` — width-justify math (§11.2), pinned like `lockup-math.ts`
- `src/components/work/slab-reveal.ts` (or a hook) — the two-tier `scaleX` reveal via WAAPI (§12)

**Rename (and rewrite the contents)**
- `clouds.tsx` → `haze.tsx`
- `birds.tsx` → `transports.tsx`

**Modify**
- `src/lib/scene-config.ts` — the 8 keyframes; 2 weight renames + re-curves; add a `pass` weight (§13)
- `src/lib/scene-engine.ts` — `--daylight`, `--struct-*`, `--slab-bg`, the elevation formula, the contrast clamp; **delete** the `inkLight` card-bg branch
- `src/components/sky/sky.module.css` — all sky visuals; **delete `@keyframes flap`**
- `src/app/globals.css` — radius tokens; rebuild `.slab` / `.pill` on elevation; drop `backdrop-filter`; wire the Config `@font-face`/kit and the wordmark/kicker type roles
- `src/lib/site-content.ts` — no copy changes; the tagline **relocates** in markup (§11.3), it does not move file
- `src/components/hero/` — the wordmark component adopts Config + the arrival build-in + the centered, width-justified lockup (§11); reconcile with the header morph and the carve (§11.4)
- `src/components/sky/scene-tune-panel.tsx` — renamed weights + `pass`
- `src/app/layout.tsx` — mount `<Lens />` above the content; host the arrival on first paint
- `src/lib/pre-hydration-scene.ts` — verify it still tracks the engine

**Tests**
- `src/lib/scene-engine.test.ts` — renames, new tokens, **contrast invariant swept across hours**, **slab continuity**
- `src/lib/pre-hydration-scene.test.ts` — keep in sync
- `src/lib/lockup-justify.test.ts` — width-justify math (§11.2, test #4 in §14)

---

## 17. Explicitly rejected

Recorded so we do not relitigate them.

| Rejected | Why |
|---|---|
| Cute vector clouds, flapping birds | Nameable cartoon objects. Recoloring them gray yields a *gloomy cheerful* sky, which is worse than either. |
| Skyline megastructure | Nameable. The same mistake as the clouds, in gray. |
| Greebled / detailed vector | Every greeble makes the form more nameable and drags it toward a skyline. |
| Photoreal raster megastructure | **Cannot recolor.** A fixed pixel array bolted onto a continuously-interpolating system. |
| Lit / emitting slab edge | Reads as a videogame dialog box. |
| Scanlines, chromatic aberration | Costume. Off-the-shelf signifiers. |
| Frosted glass (`backdrop-filter`) | An Apple idiom, not a cyberpunk one. |
| "Kill the clock" / perpetual dark | **Secretly kills the feature while keeping the code.** If every hour is a shade of dark, no visitor ever notices the cycle. |
| Hot sodium noon (no gray at all) | Seamless, but *pretty* — and pretty is the trap we are running from. |
| Constant near-black slab | Dies at midnight. Nowhere to go. |
| Bold grotesque wordmark (Space Grotesk et al.) | Reads as *aggressive tech*. Config's thin geometric reads as *clinical precision* — the Cunningham half of the thesis. |
| Uniform-width letter boxes at rest | Correct during the scramble, wrong at rest — narrow letters float (the "J⎵ONOKANE" bug). Natural widths at rest. |
| `clip-path` slab reveal | `round`-cornered `inset()` doesn't interpolate; it jumps. Transforms via WAAPI instead. |
| Modeled craft / low-poly ships, busy drones, Tron expanding rings | Cheesy at low fidelity, or busy (dilutes menace), or overtly game-UI. Replaced by "pure light in perspective" (§13). |

---

## 18. Deferred

- **The layout pass.** The centered hero lockup (§11) and the shift in visual language reopen layout; the
  tagline relocation (§11.3) lands here. Its own exploration.
- **The typography pass.** Confirm Mae as the supporting face and settle any other type roles, with the real
  licensed files loaded (mockups used free stand-ins — Jost for Config, Helvetica for Mae).
- **Acquire Config** (or select the substitute per §11.1's brief) and wire it into the font pipeline.
- **The carve × new face.** Resolve §11.4 once Config's axes are known.
- **The 3D upgrade.** Decide after the flat megastructure is live and seen at several hours (§5.3).
- **A clock control in the nav.** Surface the time-scrubber to visitors so the living sky is something they
  *play with*. Directly mitigates this palette's one real cost — that most visitors only ever see one hour.
- **OG images.** Static, cannot recolor. Pick one hour; Dusk or Midnight are the most striking.
