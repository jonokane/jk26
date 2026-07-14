# jonokane.com — Visual Language Revision: "Cold Noon"

**Date:** 2026-07-14
**Status:** Approved (Jono, this session)
**Supersedes:** `2026-07-11-site-experience-design.md` §3 (the living sky) and §3.2 (derived tokens). Everything
else in that spec — the collector (§7), the shelf (§8), the content model (§9), the farewell (§11), the hero
wordmark and morph (§5, §6), accessibility (§12), continuous scrubbed motion (§14), code organization (§15) —
**stands unchanged.**

---

## 1. Why

The site's structure, motion, and content are right. Its *register* is not. The living sky was cheerful:
cartoon clouds, flapping birds, a friendly sun. That is not Jono, and it is not the work.

The target is the intersection of **Ash Thorp** and **Chris Cunningham** — slick futurism laced with grime and
dread. The reference that settled the palette is the sea-wall shot from *Blade Runner 2049*: near-monochrome,
luminous grey, colossal, and utterly desolate, with the only true blacks in the frame belonging to the two
human figures.

### The thesis

**Two kinds of beautiful, both wrong.**

| | |
|---|---|
| **NIGHT — the street** (Thorp / Neuromancer) | Grimy, wet, neon bleed, haze glow, signage burning through fog. Seductive and filthy. **Alive.** |
| **DAY — the lab** (Cunningham) | High-key, blown-out, clinical. A sun that is a white hole punched through smog. Monumental, silent, **not built for people.** |

The clock survives, and it now *means* something. Midnight seduces you; noon exposes you. Neither is safe,
and neither is dull. It is not a dark site made by a dark person — it is a beautiful world with nobody good
in it.

**The insight that made this tractable:** brightness was never the enemy. *Cuteness* was. `All Is Full of
Love` has no dark frames and is deeply unsettling; the Vegas sequence in BR2049 is blindingly orange and one
of the most desolate images in film. So this is not a repaint. **It is a vocabulary swap.**

---

## 2. What is NOT changing

Stated explicitly so no one relitigates it:

- All copy and content. The MDX case studies, `site-content.ts`, the intro beats, the farewell.
- All layout and IA. The one-pager, the collector, the horizontal shelf, `/work/[slug]`.
- The hero wordmark: Area, the per-letter build-in, the cursor weight-carve, the shrink-to-fit lockup, the
  optical kerning. **All of it survives untouched.**
- The header morph and scroll-spy.
- The scene *architecture*: 8 keyframes → `applySceneToRoot` → CSS custom properties on `<html>`. No RAF in
  the scene system. Sampled once a minute. The pre-hydration first-paint script.
- Typography (Mae for display and body).

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
BR2049 greys. **These are starting values** — refine them in the `?tune` panel and copy the JSON out, per
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
mistake the cute clouds were making, repainted grey.

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
| `--slab-ink` | `#e6edee`. A **constant**, not scene-derived — the slab is always a dark surface, so its text is always light. This is the token that replaces the flipping `inkLight` behaviour, and it is deliberately *not* `--ink` (which still flips: dark at noon, light at night, because it sits on the bare sky). |

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
and the car are the darkest values in the entire frame.** The architecture is all mid-grey. Villeneuve did not
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

**Rejected: scanlines and chromatic aberration.** These are the cyberpunk equivalent of the flapping bird —
off-the-shelf signifiers anyone can buy, and the moment a viewer recognizes the costume, the dread leaks out.
The sea-wall reference has grain and a lens. It has no scanlines.

**a11y:** the lens must not reduce text contrast below the project's existing bar. Grain opacity is capped and
the vignette must not encroach on reading columns.

---

## 9. Testing

The unit tests in this project have passed through every single defect it has ever had, because **the math
was always right and the wiring was always wrong.** These three are designed to catch the specific wiring
failures this change introduces:

1. **Contrast invariant, swept across hours.** Assert §7 holds — not only at the 8 keyframes, but at a sweep
   of *interpolated* hours (every 0.25h). **Testing only the keyframes would miss a violation that lives
   between them,** which is precisely where an interpolated system breaks.
2. **Slab elevation continuity.** Assert `--slab-bg` is continuous across the luminance threshold band — no
   step change greater than ε between adjacent sampled hours. This catches the §6.1 pop.
3. **Pre-hydration sync.** The existing test that pins the inline first-paint script's math to
   `scene-engine.ts` must be updated and must keep passing. The script writes 5 vars (`top/mid/hor/ink/sub`)
   and is structurally unaffected, but the keyframe table it serializes changes.

---

## 10. Accessibility, motion, and mobile

- **`prefers-reduced-motion`:** no parallax; haze drift stops; stars stop twinkling; **transports freeze in
  place rather than vanish.** (The birds *vanished* because they were decoration. Transports are scenery —
  a stationary machine in the sky is still a machine in the sky.) The scene remains correct for the hour.
- **Grain and vignette are static**, so they are unaffected by reduced motion.
- **Mobile.** The megastructure needs a **phone composition, not a scaled-down desktop one** — a distinct
  `viewBox` crop, since a wide cinematic frame squeezed into a portrait viewport loses its vanishing point.
  Grain must use a fixed-size tile so it does not shimmer at 2× DPR. Parallax is scroll-driven only (no
  pointer axis).
- **The hero clear zone.** Composition rule: no structure of competing value may sit behind the wordmark's
  lockup. §7 makes this survivable; composition makes it good.

---

## 11. Files

**Create**
- `src/components/sky/megastructure.tsx`
- `src/components/sky/lens.tsx` — grain + vignette
- `src/components/sky/use-sky-parallax.ts` — rides the existing GSAP ticker

**Rename (and rewrite the contents)**
- `clouds.tsx` → `haze.tsx`
- `birds.tsx` → `transports.tsx`

**Modify**
- `src/lib/scene-config.ts` — the 8 keyframes; 2 weight renames + re-curves
- `src/lib/scene-engine.ts` — `--daylight`, `--struct-*`, `--slab-bg`, the elevation formula, the contrast clamp; **delete** the `inkLight` card-bg branch
- `src/components/sky/sky.module.css` — all sky visuals; **delete `@keyframes flap`**
- `src/app/globals.css` — radius tokens; rebuild `.slab` / `.pill` on elevation; drop `backdrop-filter`
- `src/components/sky/scene-tune-panel.tsx` — renamed weights
- `src/app/layout.tsx` — mount `<Lens />` above the content
- `src/lib/pre-hydration-scene.ts` — verify it still tracks the engine

**Tests**
- `src/lib/scene-engine.test.ts` — renames, new tokens, **contrast invariant swept across hours**, **slab continuity**
- `src/lib/pre-hydration-scene.test.ts` — keep in sync

---

## 12. Explicitly rejected

Recorded so we do not relitigate them.

| Rejected | Why |
|---|---|
| Cute vector clouds, flapping birds | Nameable cartoon objects. Recoloring them grey yields a *gloomy cheerful* sky, which is worse than either. |
| Skyline megastructure | Nameable. The same mistake as the clouds, in grey. |
| Greebled / detailed vector | Every greeble makes the form more nameable and drags it toward a skyline. |
| Photoreal raster megastructure | **Cannot recolor.** A fixed pixel array bolted onto a continuously-interpolating system. |
| Lit / emitting slab edge | Reads as a videogame dialog box. |
| Scanlines, chromatic aberration | Costume. Off-the-shelf signifiers. |
| Frosted glass (`backdrop-filter`) | An Apple idiom, not a cyberpunk one. |
| "Kill the clock" / perpetual dark | **Secretly kills the feature while keeping the code.** If every hour is a shade of dark, no visitor ever notices the cycle. |
| Hot sodium noon (no grey at all) | Seamless, but *pretty* — and pretty is the trap we are running from. |
| Constant near-black slab | Dies at midnight. Nowhere to go. |

---

## 13. Deferred

- **The 3D upgrade.** Decide after the flat layer is live and has been seen at several hours (§5.3).
- **A clock control in the nav.** Surfacing the existing time-scrubber to visitors, so the living sky becomes
  something they can *play with* rather than merely receive. Jono's idea; a strong one; a later phase.
  It also directly mitigates the one real cost of this palette — that most visitors only ever see one hour.
- **OG images.** They are static and cannot recolor. One hour must be chosen; Dusk or Midnight are the most
  striking candidates.
