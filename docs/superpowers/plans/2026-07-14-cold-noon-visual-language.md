# Cold Noon — Visual Language Implementation Plan (Plan A of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin jonokane.com's living-sky system into the "Cold Noon" cyberpunk register — new palette, repurposed sky roster (haze, transports, megastructure), dark-always materials with the contrast invariant, and the grain+vignette lens — **without deleting the current "diurnal" design**, which is parked behind a one-constant switch so the two can be compared.

**Architecture:** The scene is ~24 CSS custom properties written by one pure function (`applySceneToRoot`). This plan changes the *values and derivations* it produces and the *components* that read them; it does not change the architecture (no new RAF, sampled once a minute, one DOM writer). The old design is preserved as parked variant files; a build-time `ACTIVE_STYLE` constant selects which visual language is live.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 (CSS-first `@theme` in `globals.css`), GSAP + ScrollTrigger + Lenis (one shared RAF), Velite (untouched), Vitest, pnpm.

## Global Constraints

Copied from the spec (`docs/superpowers/specs/2026-07-14-cold-noon-visual-language-design.md`). Every task implicitly includes these.

- **pnpm only.** `pnpm build` and `pnpm test` before every commit. Never commit on red.
- **Park, never delete.** Per Jono's direction and the repo's existing precedent (the parked TotalBlack hero). No file in this plan is deleted. The current diurnal design becomes parked, reachable by flipping `ACTIVE_STYLE`.
- **`ACTIVE_STYLE` gates the two visual languages.** One constant in `src/lib/active-style.ts`. Default `"coldnoon"`. Flip to `"diurnal"` + `pnpm build` restores the old design wholesale. Both paths must build and run.
- **No copy in JSX.** All strings in `src/lib/site-content.ts`. This plan adds none.
- **Colors only from scene tokens.** No hex/Tailwind-palette colors in components. Hex lives only in the keyframe configs, the engine's derivation constants, and the token *defaults* in `globals.css`.
- **No second RAF loop.** Parallax rides the existing `gsap.ticker` (`smooth-scroll.tsx`). No `requestAnimationFrame`/`autoRaf` in the scene or parallax system.
- **One DOM writer** for scene tokens: `applySceneToRoot`. No other module calls `root.style.setProperty` for scene tokens.
- **Zero new sky-roster keyframe fields** beyond the `clouds`→`haze`, `birds`→`transports` slot rename. The `pass` weight is **Plan B**.
- **The megastructure has no weight** — always the world; its day/night presence rides the `--struct-*` derivation.
- **Accent constants (not scene tokens):** signage cyan `#7fd8e8`, sodium amber `#ff9a3c`.
- **`prefers-reduced-motion`:** no parallax; haze drift stops; stars stop twinkling; transports **freeze in place** (do not vanish). Grain/vignette static and unaffected.
- **Continuity is law.** No `if/else` on a luminance threshold that pops. Blend across a band. Enforced by the slab-continuity and contrast-sweep tests.

---

## Reversibility — the `ACTIVE_STYLE` switch

The whole mechanism, defined once. **Cold Noon is the default (unscoped); diurnal is the parked override**, so the active path stays clean and the old design is a set of clearly-named parked files plus attribute-scoped CSS.

**The switch:** `src/lib/active-style.ts` exports `ACTIVE_STYLE`. On the client, `<html data-style="...">` is set to it (so material CSS can key off it). Flipping the constant + rebuilding swaps the whole site.

**Four seams route through it:**

1. **Keyframes** — `scene-config.ts` re-exports `SCENE_KEYFRAMES` from `scene-config.coldnoon.ts` or the parked `scene-config.diurnal.ts`.
2. **Derivation** — `applySceneToRoot` derives + writes tokens via the coldnoon path or the parked `deriveTokensDiurnal`.
3. **Sky layers** — `layout.tsx` mounts the coldnoon roster (Haze, Transports, Megastructure, Lens) by default, or the parked diurnal roster (Clouds, Birds) when `ACTIVE_STYLE === "diurnal"`.
4. **Materials** — `globals.css` `.slab`/`.pill`/radii are Cold Noon by default; `:root[data-style="diurnal"]` overrides restore the parked frosted material.

**Shared, style-agnostic (never scoped):** the interpolation math (`mixHex`, `luminance`, `smoothstep`, `sampleScene`, `sunPosition`, `moonPosition`), the weight var *names* (`--w-haze`, `--w-transports`, `--w-stars`, `--w-rays`, `--w-sun`, `--w-moon` — the diurnal config fills the `haze`/`transports` slots with its cloud/bird curves), the pre-hydration first-paint script.

**Faithfulness note:** the diurnal rollback preserves the high-signal differentiators (palette, sky layers, materials). Two minor elements — the sun (disc vs luminous region) and star density — are scoped too (Task 4) so the rollback is faithful, not hybrid.

---

## File Structure

**Switch:**
- `src/lib/active-style.ts` — **new.** `ACTIVE_STYLE` + a tiny `applyStyleAttribute()` helper.

**Data / engine (pure, unit-tested):**
- `src/lib/scene-config.ts` — becomes the **selector**: exports `SceneKeyframe`, accents, and the active `SCENE_KEYFRAMES`.
- `src/lib/scene-config.coldnoon.ts` — **new.** The 8 Cold Noon keyframes + recurved weights.
- `src/lib/scene-config.diurnal.ts` — **new (parked).** The current keyframes verbatim, fields renamed to the `haze`/`transports` slots.
- `src/lib/scene-engine.ts` — shared math + `deriveTokensColdNoon` (grown across tasks) + `deriveTokensDiurnal` (current logic, parked) + `applySceneToRoot` (branches by `ACTIVE_STYLE`).
- `src/lib/sky-parallax.ts` — **new.** Pure `parallaxTransforms`.
- `src/lib/pre-hydration-scene.ts` — unchanged; verified in sync.

**Sky components:**
- `src/components/sky/haze.tsx`, `transports.tsx`, `megastructure.tsx`, `lens.tsx`, `use-sky-parallax.ts` — **new (coldnoon).**
- `src/components/sky/clouds.tsx`, `birds.tsx` — **kept, parked** (mounted only under diurnal).
- `src/components/sky/sun-moon.tsx`, `stars.tsx` — style-aware (coldnoon default, diurnal scoped/branched).
- `src/components/sky/sky.module.css` — gains `.haze`/`.transports`/`.megastructure`/`.lens`; keeps `.clouds`/`.birds`/`@keyframes flap`/`drift` (parked); `.sun` gets a diurnal-scoped override.

**App shell:**
- `src/app/globals.css` — Cold Noon material defaults + radius tokens; `:root[data-style="diurnal"]` parked overrides.
- `src/app/layout.tsx` — style-branched sky roster; `<Lens />` above content (coldnoon).

**Tests:**
- `src/lib/scene-engine.test.ts` — repalette, new tokens, slab continuity, contrast sweep (all against the coldnoon path).
- `src/lib/sky-parallax.test.ts` — **new.**
- `src/lib/active-style.test.ts` — **new.** The switch resolves and the attribute helper writes the value.
- `src/lib/pre-hydration-scene.test.ts` — parametric; stays green.

---

## Phase 0 — Reversibility scaffolding

### Task 1: `ACTIVE_STYLE` switch, config split, weight rename, first-paint sync

**Files:**
- Create: `src/lib/active-style.ts`, `src/lib/scene-config.coldnoon.ts`, `src/lib/scene-config.diurnal.ts`, `src/lib/active-style.test.ts`
- Modify: `src/lib/scene-config.ts` (becomes selector), `src/lib/scene-engine.ts` (`SceneSample` field rename, `sampleScene`, `applySceneToRoot` var names), `src/app/globals.css` (default palette + `--w-*` names), `src/components/sky/sky.module.css` (`.clouds`/`.birds` opacity read renamed vars), `src/app/layout.tsx` (set `data-style`)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Produces: `ACTIVE_STYLE: "coldnoon" | "diurnal"` and `applyStyleAttribute(): void` from `active-style.ts`; `SceneKeyframe`/`SceneSample` fields `haze`, `transports` (renamed from `clouds`, `birds`); accents `SIGNAGE_CYAN`, `SODIUM_AMBER` from `scene-config.ts`; CSS vars `--w-haze`, `--w-transports`.

- [ ] **Step 1: Create `active-style.ts`**

```ts
/**
 * The one switch between the two visual languages (Plan A). Flip to "diurnal"
 * and `pnpm build` to compare the old design. Default is the new Cold Noon.
 */
export const ACTIVE_STYLE: "coldnoon" | "diurnal" = "coldnoon";

/** Stamp the active style onto <html> so material CSS can key off it. Called
 *  once on the client (layout). Idempotent. */
export function applyStyleAttribute(): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.style = ACTIVE_STYLE;
  }
}
```

- [ ] **Step 2: Write the switch test (RED)**

Create `src/lib/active-style.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { ACTIVE_STYLE, applyStyleAttribute } from "@/lib/active-style";

describe("ACTIVE_STYLE", () => {
  afterEach(() => document.documentElement.removeAttribute("data-style"));

  it("is one of the two known styles", () => {
    expect(["coldnoon", "diurnal"]).toContain(ACTIVE_STYLE);
  });

  it("stamps the active style onto <html>", () => {
    applyStyleAttribute();
    expect(document.documentElement.dataset.style).toBe(ACTIVE_STYLE);
  });
});
```

Run: `pnpm test active-style` → FAIL (module resolves but attribute assertion needs the impl — should PASS once Step 1 is saved; if you wrote Step 1 first, this is a confirm).

- [ ] **Step 3: Park the diurnal keyframes**

Create `src/lib/scene-config.diurnal.ts`. Copy the **current** `SCENE_KEYFRAMES` from `scene-config.ts` verbatim, renaming each row's `clouds:` → `haze:` and `birds:` → `transports:` (values unchanged — the diurnal clouds curve now fills the `haze` slot, diurnal birds fill `transports`). Header comment:

```ts
import type { SceneKeyframe } from "@/lib/scene-config";

/** PARKED — the original diurnal palette (spec 2026-07-11). Reachable by
 *  setting ACTIVE_STYLE = "diurnal". Cloud/bird curves fill the haze/transports
 *  slots so both palettes share one SceneKeyframe shape. */
export const SCENE_KEYFRAMES_DIURNAL: readonly SceneKeyframe[] = [
  { h: 0.0,  name: "Midnight", top: "#050818", mid: "#16173f", hor: "#2c4a78", ink: "#edf2ff", sub: "#a9b6e6", stars: 1, rays: 0, haze: 0, transports: 0, sun: 0, moon: 1 },
  // ...the remaining 7 current keyframes, verbatim, with clouds→haze and birds→transports...
];
```

(Copy all 8 current rows; only the two field names change.)

- [ ] **Step 4: Create the Cold Noon keyframes**

Create `src/lib/scene-config.coldnoon.ts` (colors from spec §3.1, weights from §4.3):

```ts
import type { SceneKeyframe } from "@/lib/scene-config";

/** "Cold Noon" (spec 2026-07-14 §3.1, §4.3). Saturation lives at the low-sun
 *  hours and drains out at midday. Starting values — refine via `?tune`. */
export const SCENE_KEYFRAMES_COLDNOON: readonly SceneKeyframe[] = [
  { h: 0.0,  name: "Midnight",    top: "#04060d", mid: "#0a1018", hor: "#112630", ink: "#dde9ef", sub: "#7b8f99", stars: 1,    rays: 0,    haze: 0.35, transports: 0.5,  sun: 0,    moon: 1 },
  { h: 4.7,  name: "Night's end", top: "#06080f", mid: "#0c1420", hor: "#16303c", ink: "#dfeaf0", sub: "#86a0ab", stars: 0.75, rays: 0.2,  haze: 0.3,  transports: 0.35, sun: 0,    moon: 0.5 },
  { h: 6.0,  name: "Dawn",        top: "#1b1a26", mid: "#4a3a3e", hor: "#a5714a", ink: "#f0e4d8", sub: "#c9a488", stars: 0.2,  rays: 1,    haze: 0.5,  transports: 0.5,  sun: 0.25, moon: 0 },
  { h: 8.0,  name: "Morning",     top: "#566a72", mid: "#84939a", hor: "#b3bdbe", ink: "#10161a", sub: "#46555c", stars: 0,    rays: 0.3,  haze: 0.8,  transports: 0.8,  sun: 0.75, moon: 0 },
  { h: 12.5, name: "Midday",      top: "#75868d", mid: "#95a4a8", hor: "#bec8c8", ink: "#101719", sub: "#47565b", stars: 0,    rays: 0,    haze: 1,    transports: 0.9,  sun: 1,    moon: 0 },
  { h: 17.8, name: "Golden",      top: "#6b6571", mid: "#b17b53", hor: "#e9a662", ink: "#201509", sub: "#6d4e2c", stars: 0,    rays: 0.4,  haze: 0.75, transports: 0.7,  sun: 0.55, moon: 0 },
  { h: 19.8, name: "Dusk",        top: "#231f36", mid: "#4b3451", hor: "#8b4b53", ink: "#f2e2e6", sub: "#c9a3b0", stars: 0.45, rays: 0.12, haze: 0.55, transports: 0.6,  sun: 0.08, moon: 0.25 },
  { h: 21.5, name: "Evening",     top: "#0a0e19", mid: "#142134", hor: "#24394b", ink: "#dbe6f0", sub: "#8299ac", stars: 0.9,  rays: 0,    haze: 0.4,  transports: 0.55, sun: 0,    moon: 0.7 },
];
```

- [ ] **Step 5: Turn `scene-config.ts` into the selector**

Rewrite `scene-config.ts`: keep/adjust the `SceneKeyframe` interface (rename `clouds`→`haze`, `birds`→`transports`), export accents, and select the active keyframes.

```ts
import { ACTIVE_STYLE } from "@/lib/active-style";
import { SCENE_KEYFRAMES_COLDNOON } from "@/lib/scene-config.coldnoon";
import { SCENE_KEYFRAMES_DIURNAL } from "@/lib/scene-config.diurnal";

export interface SceneKeyframe {
  h: number;
  name: string;
  top: string;
  mid: string;
  hor: string;
  ink: string;
  sub: string;
  stars: number;
  rays: number;
  haze: number;        // was `clouds`
  transports: number;  // was `birds`
  sun: number;
  moon: number;
}

/** Accent colors — constants, not scene tokens (spec §3.2). */
export const SIGNAGE_CYAN = "#7fd8e8"; // the machine
export const SODIUM_AMBER = "#ff9a3c"; // the dying world

/** The active palette, chosen by ACTIVE_STYLE. */
export const SCENE_KEYFRAMES: readonly SceneKeyframe[] =
  ACTIVE_STYLE === "coldnoon" ? SCENE_KEYFRAMES_COLDNOON : SCENE_KEYFRAMES_DIURNAL;
```

- [ ] **Step 6: Rename the fields + var writes in `scene-engine.ts`**

In `SceneSample`, `clouds`→`haze`, `birds`→`transports`. In `sampleScene`'s return: `haze: lerp(from.haze, to.haze, t), transports: lerp(from.transports, to.transports, t),`. In `applySceneToRoot`: `setWeight("--w-haze", s.haze); setWeight("--w-transports", s.transports);` (remove the `--w-clouds`/`--w-birds` writes).

- [ ] **Step 7: Rename the CSS var references + default palette**

`globals.css` `:root` scene defaults: `--w-clouds`→`--w-haze`, `--w-birds`→`--w-transports`; leave the default *palette* values as they are for now (Task changes come later). `sky.module.css`: `.clouds { opacity: calc(var(--w-haze) * 0.92); }` and `.birds { opacity: calc(var(--w-transports) * 0.85); }`.

- [ ] **Step 8: Stamp `data-style` on the client**

In `layout.tsx`, mount a tiny client effect. Add a `"use client"` one-liner component OR call in an existing client boundary. Simplest: create `src/components/style-attribute.tsx`:

```tsx
"use client";
import { useEffect } from "react";
import { applyStyleAttribute } from "@/lib/active-style";
export function StyleAttribute() {
  useEffect(() => applyStyleAttribute(), []);
  return null;
}
```

and render `<StyleAttribute />` just inside `<body>`. (Server can't set it from a constant without hydration risk; a mount effect is safe and the default CSS is Cold Noon regardless.)

- [ ] **Step 9: Update the palette-pinning tests**

In `scene-engine.test.ts`, the hardcoded keyframe assertions must now reflect the **active (coldnoon)** palette:

```ts
  it("returns exact keyframe values at a keyframe hour", () => {
    const s = sampleScene(12.5);
    expect(s.from.name).toBe("Midday");
    expect(s.top).toBe("#75868d");
    expect(s.haze).toBe(1);
  });
  it("blends between neighboring keyframes at the midpoint", () => {
    const s = sampleScene(10.25);
    expect(s.top).toBe(mixHex("#566a72", "#75868d", 0.5));
    expect(s.sun).toBeCloseTo(0.875, 5);
  });
```

- [ ] **Step 10: Run everything (GREEN)**

Run: `pnpm test scene-engine && pnpm test active-style && pnpm test pre-hydration && pnpm build`
Expected: PASS. Pre-hydration is parametric (auto-tracks). `pnpm build` type-checks the rename tree-wide.

- [ ] **Step 11: Commit**

```bash
git add src/lib/active-style.ts src/lib/active-style.test.ts src/lib/scene-config.ts src/lib/scene-config.coldnoon.ts src/lib/scene-config.diurnal.ts src/lib/scene-engine.ts src/lib/scene-engine.test.ts src/app/globals.css src/components/sky/sky.module.css src/components/style-attribute.tsx src/app/layout.tsx
git commit -m "feat(scene): ACTIVE_STYLE switch + Cold Noon palette; park diurnal"
```

---

## Phase 1 — Sky vocabulary (coldnoon default, diurnal parked)

### Task 2: Haze layer (Clouds parked)

**Files:**
- Create: `src/components/sky/haze.tsx`
- Keep (parked): `src/components/sky/clouds.tsx`
- Modify: `src/components/sky/sky.module.css` (add `.haze`; keep `.clouds`/`.cloud`/`@keyframes drift`)
- Modify: `src/app/layout.tsx` (style-branch the mount)

**Interfaces:**
- Consumes: `--w-haze`, `ACTIVE_STYLE`.
- Produces: `<Haze />`; `.haze` reading `--w-haze`.

- [ ] **Step 1: Write `haze.tsx`**

```tsx
import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** Haze bands (spec §4): vast, soft, layered volumetric smog — atmosphere, not
 *  objects. top (vh), height (vh), drift duration (s), negative delay (s), blur (px). */
const BANDS: Array<[number, number, number, number, number]> = [
  [22, 20, 190, -40, 26],
  [46, 30, 260, -120, 34],
  [64, 26, 150, -70, 30],
];

export function Haze() {
  return (
    <div className={styles.haze}>
      {BANDS.map(([topVh, hVh, durS, delayS, blurPx], i) => (
        <div
          key={i}
          className={styles.hazeBand}
          style={{ top: `${topVh}vh`, height: `${hVh}vh`, "--d": `${durS}s`, "--dl": `${delayS}s`, "--blur": `${blurPx}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add haze CSS (keep the cloud CSS parked)**

Append to `sky.module.css` (do **not** remove `.clouds`/`.cloud`/`@keyframes drift`):

```css
/* ---------- haze: volumetric smog bands (coldnoon, spec §4) ---------- */
.haze { opacity: var(--w-haze); }

.hazeBand {
  position: absolute;
  left: -12%;
  width: 124%;
  background: linear-gradient(180deg, transparent, rgba(210, 224, 230, 0.5) 50%, transparent);
  filter: blur(var(--blur, 28px));
  animation: hazeDrift var(--d) linear var(--dl) infinite;
}

@keyframes hazeDrift {
  from { transform: translateX(-8vw); }
  to   { transform: translateX(8vw); }
}

@media (prefers-reduced-motion: reduce) {
  .hazeBand { animation: none; }
}
```

- [ ] **Step 3: Style-branch the mount**

In `layout.tsx`, import both and the switch, and render the active one:

```tsx
import { ACTIVE_STYLE } from "@/lib/active-style";
import { Haze } from "@/components/sky/haze";
import { Clouds } from "@/components/sky/clouds";
// ...inside <Sky>:
{ACTIVE_STYLE === "coldnoon" ? <Haze /> : <Clouds />}
```

- [ ] **Step 4: Build**

Run: `pnpm build` → PASS. (Manual: default shows drifting haze; `ACTIVE_STYLE="diurnal"` + build shows the old clouds.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/haze.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): haze bands (coldnoon); clouds parked"
```

---

### Task 3: Transports layer (Birds parked)

**Files:**
- Create: `src/components/sky/transports.tsx`
- Keep (parked): `src/components/sky/birds.tsx`
- Modify: `src/components/sky/sky.module.css` (add `.transports`; keep `.birds`/`.bird`/`@keyframes fly`+`flap`)
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `--w-transports`, `SIGNAGE_CYAN`, `SODIUM_AMBER`, `ACTIVE_STYLE`.
- Produces: `<Transports />`; `.transports` reading `--w-transports`.

- [ ] **Step 1: Write `transports.tsx`**

```tsx
import type { CSSProperties } from "react";
import { SIGNAGE_CYAN, SODIUM_AMBER } from "@/lib/scene-config";
import styles from "@/components/sky/sky.module.css";

/** A silent craft: a long thin silhouette with running lights. Crosses
 *  dead-straight and NEVER flaps (spec §4.1). top (vh), length (px), duration
 *  (s), negative delay (s), opacity. */
const CRAFT: Array<[number, number, number, number, number]> = [
  [22, 150, 90, -20, 1],
  [15, 96, 130, -70, 0.7],
];

export function Transports() {
  return (
    <div className={styles.transports}>
      {CRAFT.map(([topVh, lenPx, durS, delayS, op], i) => (
        <div
          key={i}
          className={styles.craft}
          style={{ top: `${topVh}vh`, width: `${lenPx}px`, opacity: op, "--d": `${durS}s`, "--dl": `${delayS}s` } as CSSProperties}
        >
          <span className={styles.runLight} style={{ left: "6%", background: SIGNAGE_CYAN }} />
          <span className={styles.runLight} style={{ left: "50%", background: SODIUM_AMBER, animationDelay: "0.5s" }} />
          <span className={styles.runLight} style={{ left: "94%", background: SIGNAGE_CYAN, animationDelay: "1s" }} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Add transports CSS (keep the bird CSS parked)**

Append to `sky.module.css` (do **not** remove `.birds`/`.bird`/`@keyframes fly`/`@keyframes flap`):

```css
/* ---------- transports: silent craft, running lights, NO flap (coldnoon, spec §4.1) ---------- */
.transports { opacity: var(--w-transports); }

.craft {
  position: absolute;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--struct-mass, #141f28) 18%, var(--struct-mass, #1b2833) 82%, transparent);
  animation: cross var(--d) linear var(--dl) infinite;
}

.runLight {
  position: absolute;
  top: 0;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  box-shadow: 0 0 6px 1px currentColor;
  animation: runBlink 2.2s steps(1) infinite;
}

@keyframes cross {
  from { transform: translateX(-30vw); }
  to   { transform: translateX(130vw); }
}

@keyframes runBlink {
  0%, 80% { opacity: 1; }
  80.01%, 100% { opacity: 0.15; }
}

/* reduced motion: the machine FREEZES in place (scenery, not decoration) */
@media (prefers-reduced-motion: reduce) {
  .craft { animation: none; }
  .runLight { animation: none; }
}
```

- [ ] **Step 3: Style-branch the mount**

In `layout.tsx`: import `Transports` and `Birds`; render `{ACTIVE_STYLE === "coldnoon" ? <Transports /> : <Birds />}`.

- [ ] **Step 4: Build**

Run: `pnpm build` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/transports.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): silent transports (coldnoon); birds parked"
```

---

### Task 4: Sun as luminous region; stars retuned (diurnal scoped)

**Files:**
- Modify: `src/components/sky/sky.module.css` (`.sun` coldnoon default + `:root[data-style="diurnal"] .sun` parked disc; `@keyframes twinkle`)
- Modify: `src/components/sky/stars.tsx` (style-branched counts)

**Interfaces:**
- Consumes: `--sun-x`/`--sun-y`, `--w-sun`, `--w-stars`, `ACTIVE_STYLE`.

- [ ] **Step 1: Park the current sun as a diurnal override, then redraw the default**

In `sky.module.css`, copy the **current** `.sun` rule into a scoped override, then replace the base `.sun` with the luminous region:

```css
/* parked diurnal disc */
:root[data-style="diurnal"] .sun {
  left: calc(var(--sun-x) - 65px);
  top: calc(var(--sun-y) - 65px);
  width: 130px;
  height: 130px;
  background: radial-gradient(circle, rgba(255,238,175,.95) 0 26%, rgba(255,215,125,.35) 46%, transparent 70%);
  filter: blur(1.5px);
  mix-blend-mode: normal;
}

/* coldnoon: a white hole punched through smog — a luminous region, no hard edge */
.sun {
  position: absolute;
  left: calc(var(--sun-x) - 130px);
  top: calc(var(--sun-y) - 130px);
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,.9) 0 14%, rgba(240,248,250,.5) 30%, rgba(210,228,235,.18) 52%, transparent 72%);
  filter: blur(6px);
  mix-blend-mode: screen;
}
```

- [ ] **Step 2: Scope the star twinkle floor**

Keep the current soft twinkle for diurnal; harden it for coldnoon (default):

```css
@keyframes twinkle { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
:root[data-style="diurnal"] .star { animation-name: twinkleSoft; }
@keyframes twinkleSoft { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.95; } }
```

- [ ] **Step 3: Style-branch the star counts**

In `stars.tsx`, import `ACTIVE_STYLE` and pick counts:

```ts
import { ACTIVE_STYLE } from "@/lib/active-style";
const STAR_COUNT = ACTIVE_STYLE === "coldnoon" ? 64 : 110;    // sparser at night; the city competes
const SPARKLE_COUNT = ACTIVE_STYLE === "coldnoon" ? 4 : 9;
```

- [ ] **Step 4: Build + check**

Run: `pnpm build` → PASS. (Manual: Midday sun is a soft bloom; flip to diurnal → the friendly disc returns.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/sky.module.css src/components/sky/stars.tsx
git commit -m "feat(sky): luminous sun + harder stars (coldnoon); diurnal scoped"
```

---

## Phase 2 — Materials

### Task 5: `--daylight`, `--slab-bg`, `--slab-ink` + the elevation formula

**Files:**
- Modify: `src/lib/scene-engine.ts` (`deriveTokensColdNoon`, `slabBackground`, `SceneTokens`)
- Test: `src/lib/scene-engine.test.ts`

Build the coldnoon derivation as a **new** function `deriveTokensColdNoon`, leaving the current `deriveTokens` in place (it becomes `deriveTokensDiurnal` in Task 6). For now `applySceneToRoot` still calls the current `deriveTokens`; Task 6 wires the branch.

**Interfaces:**
- Produces: `deriveTokensColdNoon(s): SceneTokens` with `daylight`, `slabBg`, `slabInk`; `slabBackground(midHex): string`.

- [ ] **Step 1: Write the failing tests**

```ts
import { deriveTokensColdNoon, sampleScene, luminance } from "@/lib/scene-engine";

describe("coldnoon elevation slab (spec §6.1)", () => {
  it("lifted at midnight, dark at midday", () => {
    expect(luminance(deriveTokensColdNoon(sampleScene(0)).slabBg)).toBeGreaterThan(luminance("#0a1018"));
    expect(luminance(deriveTokensColdNoon(sampleScene(12.5)).slabBg)).toBeLessThan(luminance("#95a4a8"));
  });
  it("slabInk is constant light, never flipped", () => {
    expect(deriveTokensColdNoon(sampleScene(0)).slabInk).toBe("#e6edee");
    expect(deriveTokensColdNoon(sampleScene(12.5)).slabInk).toBe("#e6edee");
  });
  it("slabBg is CONTINUOUS across the day — no pop (spec §6.1 CRITICAL)", () => {
    let prev = luminance(deriveTokensColdNoon(sampleScene(0)).slabBg);
    for (let h = 0.25; h < 24; h += 0.25) {
      const cur = luminance(deriveTokensColdNoon(sampleScene(h)).slabBg);
      expect(Math.abs(cur - prev)).toBeLessThan(0.06);
      prev = cur;
    }
  });
});
```

Run: `pnpm test scene-engine` → FAIL (`deriveTokensColdNoon` undefined).

- [ ] **Step 2: Add `slabBackground` + `deriveTokensColdNoon`**

In `scene-engine.ts`, add the fields to `SceneTokens` (as in the original plan: `daylight`, `slabBg`, `slabInk`, and — reserved for Task 7 — `structFar/Mass/Pylon/Gantry`). Add:

```ts
/** Elevation slab background (spec §6.1): a constant contrast step from the
 *  sky — dark when there is room below, LIFTED when there is not, blended
 *  across a band so the day crosses the threshold with no visible pop. */
function slabBackground(midHex: string): string {
  const L = luminance(midHex);
  const dark = mixHex(midHex, "#05080a", 0.88);
  const lift = mixHex(midHex, "#cfe0e8", 0.13);
  const b = smoothstep((L - 0.18) / (0.26 - 0.18));
  return mixHex(lift, dark, b);
}

/** Cold Noon token derivation. Dark-always materials; the diurnal path stays
 *  in `deriveTokens` (renamed `deriveTokensDiurnal` in Task 6). */
export function deriveTokensColdNoon(s: SceneSample): SceneTokens {
  const inkLight = luminance(s.ink) > 0.5;
  const surface = mixHex(s.top, "#07091a", 0.6);
  const slabBg = slabBackground(s.mid);
  return {
    ink: s.ink,
    sub: s.sub,
    surface,
    scrim: surface + "94",
    cardBg: slabBg,
    cardBorder: "rgba(150,180,190,.14)",
    textGlow: "rgba(4,7,18,.55)",
    elev: "rgba(3,6,16,.5)",
    coverA: s.mid,
    coverB: s.hor,
    inkLight,
    daylight: Math.min(1, Math.max(0, luminance(s.mid))),
    slabBg,
    slabInk: "#e6edee",
    // struct fields added in Task 7:
    structFar: s.mid,
    structMass: s.mid,
    structPylon: s.mid,
    structGantry: s.mid,
  };
}
```

(The four `struct*` are placeholders here so the type is satisfied; Task 7 gives them real derivations. This is the one deliberate stub in the plan; it is replaced within the same phase, and is never shipped as a visible value because the megastructure component does not mount until Task 8.)

Add the fields to `SceneTokens`:

```ts
  daylight: number;
  slabBg: string;
  slabInk: string;
  structFar: string;
  structMass: string;
  structPylon: string;
  structGantry: string;
```

The existing `deriveTokens` (diurnal) must also satisfy the widened `SceneTokens` — add the same seven fields to its return with safe values: `daylight: 0, slabBg: "#1a222b", slabInk: "#e6edee", structFar/Mass/Pylon/Gantry: s.mid`. (Diurnal never reads them.)

- [ ] **Step 3: Run tests (GREEN)**

Run: `pnpm test scene-engine` → PASS (continuity sweep included).

- [ ] **Step 4: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts
git commit -m "feat(scene): coldnoon elevation tokens (--daylight, --slab-bg, --slab-ink)"
```

---

### Task 6: Materials rebuild — branch derivation, radius tokens, drop frosted glass

**Files:**
- Modify: `src/lib/scene-engine.ts` (rename current `deriveTokens`→`deriveTokensDiurnal`; new `deriveTokens` dispatcher; `applySceneToRoot` writes coldnoon vars)
- Modify: `src/app/globals.css` (coldnoon `.slab`/`.pill`/radii default + `:root[data-style="diurnal"]` parked overrides)
- Modify: `src/components/work/case-study-cover.module.css`, `src/components/contact/contact.module.css`, `src/components/site-header.module.css` (radius → tokens, coldnoon values; diurnal keeps 18/10/15 via scoped override)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Consumes: `deriveTokensColdNoon`, `ACTIVE_STYLE`.
- Produces: `deriveTokens(s)` dispatcher; radius tokens `--r-slab`/`--r-input`/`--r-header`/`--r-cover`/`--r-pill`; new `--slab-bg`/`--slab-ink`/`--daylight` writes.

- [ ] **Step 1: Write the failing test**

```ts
import { deriveTokens, sampleScene } from "@/lib/scene-engine";
// NOTE: with ACTIVE_STYLE="coldnoon", deriveTokens dispatches to coldnoon.
describe("materials dispatch (spec §6.1)", () => {
  it("card background is the dark slab, never white glass, at noon", () => {
    const noon = deriveTokens(sampleScene(12.5));
    expect(noon.cardBg).toBe(noon.slabBg);
    expect(noon.cardBg).not.toContain("255,255,255");
  });
});
```

Run: `pnpm test scene-engine` → FAIL (current `deriveTokens` returns white glass at noon).

- [ ] **Step 2: Rename + dispatch in `scene-engine.ts`**

Rename the current `export function deriveTokens` to `export function deriveTokensDiurnal`. Add the dispatcher:

```ts
import { ACTIVE_STYLE } from "@/lib/active-style";

/** Active token derivation, chosen by ACTIVE_STYLE. */
export function deriveTokens(s: SceneSample): SceneTokens {
  return ACTIVE_STYLE === "coldnoon" ? deriveTokensColdNoon(s) : deriveTokensDiurnal(s);
}
```

In `applySceneToRoot`, after the existing token writes, add the coldnoon-only vars (harmless under diurnal — they are defined defaults there and unread):

```ts
  set("--daylight", String(Number(tk.daylight.toFixed(4))));
  set("--slab-bg", tk.slabBg);
  set("--slab-ink", tk.slabInk);
```

- [ ] **Step 3: Radius tokens + Cold Noon `.slab`/`.pill` in `globals.css`**

Add to `:root`:

```css
  --r-slab: 4px;
  --r-input: 4px;
  --r-header: 4px;
  --r-cover: 4px;
  --r-pill: 9999px;
  --slab-bg: #1a222b;
  --slab-ink: #e6edee;
  --daylight: 0;
```

Rewrite `.slab`/`.pill` (Cold Noon default — dark elevation, radius token, **no `backdrop-filter`**):

```css
  .slab {
    background: var(--slab-bg);
    color: var(--slab-ink);
    border: 1px solid var(--card-border);
    border-radius: var(--r-slab);
    padding: 26px 28px;
    box-shadow: 0 12px 40px var(--elev);
  }
  .pill {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.8125rem 1.625rem;
    border-radius: var(--r-pill);
    background: var(--slab-bg); color: var(--slab-ink);
    border: 1px solid var(--card-border);
    box-shadow: 0 8px 28px var(--elev);
  }
```

Add the parked diurnal overrides (restore the frosted material + old radii):

```css
  :root[data-style="diurnal"] .slab {
    background: var(--card-bg);
    color: var(--ink);
    border-radius: 18px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  :root[data-style="diurnal"] .pill {
    background: var(--card-bg);
    border-radius: 9999px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
```

Change `.site-header` `border-radius` to `var(--r-header)` and add `:root[data-style="diurnal"] .site-header { border-radius: 15px; }`.

- [ ] **Step 4: Tokenize the other radii (with diurnal overrides)**

- `case-study-cover.module.css`: `border-radius: var(--r-cover);` + `:global(:root[data-style="diurnal"])` override to `18px` (or leave the module value and add a scoped override in globals — keep it in the module for locality: use `:global(:root[data-style="diurnal"]) & { border-radius: 18px; }`).
- `contact.module.css`: input `border-radius: var(--r-input);` + diurnal override `10px`.
- `site-header.module.css`: pill `border-radius: var(--r-pill);` + diurnal override `9999px` (unchanged value, so no override needed).

- [ ] **Step 5: Run tests + build (both styles)**

Run: `pnpm test scene-engine && pnpm build`
Expected: PASS. (Manual: default noon shows a dark slab with light text; flip to diurnal → frosted white glass, radius 18.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts src/app/globals.css src/components/work/case-study-cover.module.css src/components/contact/contact.module.css src/components/site-header.module.css
git commit -m "feat(materials): coldnoon dark elevation + radius tokens; diurnal parked"
```

---

## Phase 3 — Megastructure & the contrast invariant

### Task 7: `--struct-*` tokens + the contrast-invariant clamp

**Files:**
- Modify: `src/lib/scene-engine.ts` (`CONTRAST_FLOOR`, `clampToInk`, `structTokens`, wire into `deriveTokensColdNoon` + `applySceneToRoot`)
- Modify: `src/app/globals.css` (`--struct-*` defaults)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Produces: `CONTRAST_FLOOR = 0.18`; `clampToInk(hex, inkHex, inkLight, horHex)`; real `structFar/Mass/Pylon/Gantry` in `deriveTokensColdNoon`; CSS vars `--struct-*`.

- [ ] **Step 1: Write the failing sweep test**

```ts
describe("contrast invariant — the ink is the darkest thing (spec §7)", () => {
  const FLOOR = 0.18;
  const keys = ["structFar", "structMass", "structPylon", "structGantry"] as const;
  it("holds at every quarter-hour, not just keyframes", () => {
    for (let h = 0; h < 24; h += 0.25) {
      const t = deriveTokensColdNoon(sampleScene(h));
      const Li = luminance(t.ink);
      for (const k of keys) {
        const Ls = luminance(t[k]);
        if (t.inkLight) expect(Ls).toBeLessThanOrEqual(Li - FLOOR + 1e-6);
        else expect(Ls).toBeGreaterThanOrEqual(Li + FLOOR - 1e-6);
      }
    }
  });
});
```

Run: `pnpm test scene-engine` → FAIL (struct fields are still the `s.mid` stub, which violates the floor).

- [ ] **Step 2: Add the clamp + real struct derivation**

```ts
export const CONTRAST_FLOOR = 0.18;

/** Push a structure color to the correct side of the ink by mixing toward the
 *  horizon (spec §7). Day (dark ink): struct must be LIGHTER than ink+floor.
 *  Night (light ink): struct must be DARKER than ink-floor. */
export function clampToInk(hex: string, inkHex: string, inkLight: boolean, horHex: string): string {
  const L = luminance(hex);
  const Li = luminance(inkHex);
  const target = inkLight ? Li - CONTRAST_FLOOR : Li + CONTRAST_FLOOR;
  const violates = inkLight ? L > target : L < target;
  if (!violates) return hex;
  const Lh = luminance(horHex);
  if (Lh === L) return hex;
  const t = Math.max(0, Math.min(1, (target - L) / (Lh - L)));
  return mixHex(hex, horHex, t);
}

function structTokens(s: SceneSample, inkLight: boolean) {
  const base = (aerial: number) => mixHex(s.mid, s.hor, aerial);
  const clamp = (hex: string) => clampToInk(hex, s.ink, inkLight, s.hor);
  return {
    structFar: clamp(base(0.8)),
    structMass: clamp(base(0.5)),
    structPylon: clamp(base(0.32)),
    structGantry: clamp(base(0.14)),
  };
}
```

Replace the four struct placeholders in `deriveTokensColdNoon`'s return with `...structTokens(s, inkLight),`. Add the writes in `applySceneToRoot` (guard for coldnoon or write always — diurnal's placeholders are harmless):

```ts
  set("--struct-far", tk.structFar);
  set("--struct-mass", tk.structMass);
  set("--struct-pylon", tk.structPylon);
  set("--struct-gantry", tk.structGantry);
```

Add defaults to `globals.css` `:root`: `--struct-far: #14202a; --struct-mass: #101a22; --struct-pylon: #0d1620; --struct-gantry: #0a121a;`.

- [ ] **Step 3: Run tests (GREEN)**

Run: `pnpm test scene-engine` → PASS (sweep holds).

- [ ] **Step 4: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts src/app/globals.css
git commit -m "feat(scene): --struct-* tokens + contrast-invariant clamp"
```

---

### Task 8: The megastructure component (coldnoon only)

**Files:**
- Create: `src/components/sky/megastructure.tsx`
- Modify: `src/components/sky/sky.module.css` (`.megastructure`, `.megaSvg`, `.megaLayer`)
- Modify: `src/app/layout.tsx` (mount coldnoon-only, first child of `<Sky>`)

**Interfaces:**
- Consumes: `--struct-*`, `ACTIVE_STYLE`.
- Produces: `<Megastructure />` with four `data-depth` layers (`far`/`mass`/`pylon`/`gantry`) for Task 9.

- [ ] **Step 1: Write `megastructure.tsx`** (no parallax yet — added in Task 9)

```tsx
import styles from "@/components/sky/sky.module.css";

/** The megastructure (spec §5): one colossal form you cannot name. Flat vector
 *  filled with scene tokens, recoloring at every hour. Four layers carry depth. */
export function Megastructure() {
  return (
    <div className={styles.megastructure} aria-hidden="true">
      <svg className={styles.megaSvg} viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice">
        <g className={styles.megaLayer} data-depth="far">
          <rect x="600" y="150" width="74" height="350" fill="var(--struct-far)" />
          <rect x="690" y="200" width="42" height="300" fill="var(--struct-far)" opacity="0.8" />
          <rect x="548" y="230" width="30" height="270" fill="var(--struct-far)" opacity="0.65" />
        </g>
        <g className={styles.megaLayer} data-depth="mass">
          <path d="M 96 500 L 130 210 L 396 160 L 430 500 Z" fill="var(--struct-mass)" />
          <path d="M 130 210 L 396 160 L 404 196 L 126 244 Z" fill="var(--struct-pylon)" opacity="0.22" />
        </g>
        <g className={styles.megaLayer} data-depth="pylon" fill="var(--struct-pylon)">
          <polygon points="452,500 452,320 470,314 470,500" opacity="0.78" />
          <polygon points="486,500 486,350 500,346 500,500" opacity="0.62" />
          <polygon points="512,500 512,378 523,375 523,500" opacity="0.5" />
          <polygon points="532,500 532,402 540,400 540,500" opacity="0.4" />
        </g>
        <g className={styles.megaLayer} data-depth="gantry">
          <path d="M 0 20 L 560 470 L 560 500 L 0 92 Z" fill="var(--struct-gantry)" opacity="0.93" />
          <path d="M 0 92 L 560 500 L 548 500 L 0 122 Z" fill="var(--struct-gantry)" opacity="0.6" />
          <circle cx="470" cy="486" r="2.4" fill="var(--struct-gantry)" />
          <circle cx="481" cy="488" r="2" fill="var(--struct-gantry)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS (with the phone crop)**

```css
/* ---------- megastructure (coldnoon, spec §5) ---------- */
/* No z-index: it renders after .gradient (so above it) and before the other
   sky children (so those layer over it). The whole .sky is z-index:-1. */
.megastructure { position: absolute; inset: 0; overflow: hidden; }
.megaSvg { position: absolute; inset: 0; width: 100%; height: 100%; }
.megaLayer { will-change: transform; }

@media (max-width: 640px) {
  .megaSvg { width: 180%; left: -40%; }
}
```

- [ ] **Step 3: Mount coldnoon-only, deepest layer**

In `layout.tsx`, `import { Megastructure } from "@/components/sky/megastructure";` and inside `<Sky>` render it first, guarded:

```tsx
<Sky>
  {ACTIVE_STYLE === "coldnoon" && <Megastructure />}
  <SunMoon />
  <Rays />
  <Stars />
  {ACTIVE_STYLE === "coldnoon" ? <Haze /> : <Clouds />}
  {ACTIVE_STYLE === "coldnoon" ? <Transports /> : <Birds />}
</Sky>
```

- [ ] **Step 4: Build + check**

Run: `pnpm build` → PASS. (Manual: Midday shows a gray monumental gesture washing into the horizon; Midnight near-black; the wordmark is never eaten — Task 7 keeps structures off the ink's value.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/megastructure.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): flat-vector megastructure gesture (coldnoon)"
```

---

### Task 9: Parallax on the GSAP ticker

**Files:**
- Create: `src/lib/sky-parallax.ts`, `src/components/sky/use-sky-parallax.ts`, `src/lib/sky-parallax.test.ts`
- Modify: `src/components/sky/megastructure.tsx` (call the hook)

**Interfaces:**
- Consumes: `ScrollTrigger` from `@/lib/gsap`; the `data-depth` nodes.
- Produces: `PARALLAX_RATES`, `parallaxTransforms(scroll)`, `type Depth`; `useSkyParallax(rootRef)`.

- [ ] **Step 1: Write the math test**

```ts
import { describe, expect, it } from "vitest";
import { PARALLAX_RATES, parallaxTransforms } from "@/lib/sky-parallax";
describe("parallaxTransforms", () => {
  it("is zero at scroll 0", () => {
    expect(parallaxTransforms(0).far).toBe(0);
    expect(parallaxTransforms(0).gantry).toBe(0);
  });
  it("moves each layer by scroll × rate; nearer is faster", () => {
    const t = parallaxTransforms(1000);
    expect(t.far).toBeCloseTo(-1000 * PARALLAX_RATES.far, 5);
    expect(Math.abs(t.gantry)).toBeGreaterThan(Math.abs(t.far));
  });
  it("uses the spec's four rates", () => {
    expect(PARALLAX_RATES).toEqual({ far: 0.03, mass: 0.09, pylon: 0.18, gantry: 0.4 });
  });
});
```

Run: `pnpm test sky-parallax` → FAIL.

- [ ] **Step 2: Write `sky-parallax.ts`**

```ts
/** Sky-layer parallax (spec §5.2). Pure math; the hook applies it on the
 *  existing GSAP ticker. Rates are fraction of scroll distance. */
export type Depth = "far" | "mass" | "pylon" | "gantry";

export const PARALLAX_RATES: Record<Depth, number> = { far: 0.03, mass: 0.09, pylon: 0.18, gantry: 0.4 };

export function parallaxTransforms(scroll: number): Record<Depth, number> {
  return {
    far: -scroll * PARALLAX_RATES.far,
    mass: -scroll * PARALLAX_RATES.mass,
    pylon: -scroll * PARALLAX_RATES.pylon,
    gantry: -scroll * PARALLAX_RATES.gantry,
  };
}
```

Run: `pnpm test sky-parallax` → PASS.

- [ ] **Step 3: Write the wiring hook (no new RAF)**

```ts
"use client";
import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { parallaxTransforms, type Depth } from "@/lib/sky-parallax";

/** Parallax the [data-depth] layers under `rootRef`, riding the existing
 *  ScrollTrigger update (driven off the GSAP ticker in smooth-scroll.tsx — no
 *  new RAF). Off under prefers-reduced-motion. */
export function useSkyParallax(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const nodes = new Map<Depth, HTMLElement>();
    (["far", "mass", "pylon", "gantry"] as Depth[]).forEach((d) => {
      const el = root.querySelector<HTMLElement>(`[data-depth="${d}"]`);
      if (el) nodes.set(d, el);
    });
    const apply = () => {
      const t = parallaxTransforms(window.scrollY);
      nodes.forEach((el, d) => { el.style.transform = `translateY(${t[d].toFixed(2)}px)`; });
    };
    const st = ScrollTrigger.create({ onUpdate: apply });
    apply();
    return () => st.kill();
  }, [rootRef]);
}
```

- [ ] **Step 4: Call it from the megastructure**

Make `megastructure.tsx` a client component: add `"use client";` at the top, and:

```tsx
import { useRef } from "react";
import { useSkyParallax } from "@/components/sky/use-sky-parallax";
// ...
export function Megastructure() {
  const ref = useRef<HTMLDivElement>(null);
  useSkyParallax(ref);
  return (
    <div className={styles.megastructure} aria-hidden="true" ref={ref}>
      {/* svg unchanged */}
    </div>
  );
}
```

- [ ] **Step 5: Build + no-RAF check**

Run: `pnpm test && pnpm build` → PASS. `grep -rn "requestAnimationFrame\|autoRaf" src/components/sky src/lib/sky-parallax.ts` → nothing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sky-parallax.ts src/lib/sky-parallax.test.ts src/components/sky/use-sky-parallax.ts src/components/sky/megastructure.tsx
git commit -m "feat(sky): megastructure parallax on the shared GSAP ticker"
```

---

## Phase 4 — The lens

### Task 10: Grain + vignette (coldnoon only)

**Files:**
- Create: `src/components/sky/lens.tsx`
- Modify: `src/components/sky/sky.module.css` (`.lens`, `.lensGrain`, `.lensVignette`)
- Modify: `src/app/layout.tsx` (mount above content, coldnoon-only)

**Interfaces:**
- Produces: `<Lens />`.

- [ ] **Step 1: Write `lens.tsx`**

```tsx
import styles from "@/components/sky/sky.module.css";

/** The lens (spec §8): static film grain + vignette, above content. Static, not
 *  animated. Not on a time curve. The single biggest lever for "grimy". */
export function Lens() {
  return (
    <div className={styles.lens} aria-hidden="true">
      <div className={styles.lensGrain} />
      <div className={styles.lensVignette} />
    </div>
  );
}
```

- [ ] **Step 2: Add CSS**

```css
/* ---------- the lens (coldnoon, spec §8) ---------- */
.lens { position: fixed; inset: 0; z-index: 30; pointer-events: none; }

.lensGrain {
  position: absolute; inset: 0;
  opacity: 0.05;                 /* capped — must not reduce text contrast */
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 140px 140px;  /* fixed tile — no shimmer at 2× DPR */
}

.lensVignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 44%, transparent 55%, rgba(0, 0, 0, 0.42) 100%);
}
```

- [ ] **Step 3: Mount above content, coldnoon-only**

In `layout.tsx`: `import { Lens } from "@/components/sky/lens";` and after `{children}`:

```tsx
{children}
{ACTIVE_STYLE === "coldnoon" && <Lens />}
<TimeScrubber />
<SceneTunePanel />
```

- [ ] **Step 4: Build + contrast check**

Run: `pnpm build` → PASS. (Manual: body copy stays legible; vignette darkens only the frame.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/lens.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): the lens — static grain + vignette (coldnoon)"
```

---

## Self-Review

**1. Spec coverage.** §3 palette → Tasks 1 (config), 4/5/6 (derivations). §3.2 accents → Task 1. §4 roster: haze → 2, transports → 3, megastructure → 7–9, sun/stars/rays → 4, gradient → 1; §4.1 no-flap → 3 (transports have no flap; the parked birds keep theirs); §4.3 recurves → 1. §5 megastructure → 7/8/9; §5.3 3D deferred. §6 materials → 5/6; §6.3 radius → 6. §7 contrast → 7. §8 lens → 10. §14 tests → 1 (active-style), 5 (continuity), 7 (sweep), 9 (parallax), pre-hydration kept green. §15 a11y/mobile → reduced-motion in 2/3/9, mobile crop in 8, grain tile in 10. §16 files → all covered plus the parked variants. §18 deferred → out of scope.

**Reversibility coverage (Jono's park-not-delete request):** nothing is deleted — clouds/birds/old sun/old materials/old palette all persist as parked files or `[data-style="diurnal"]` overrides. `ACTIVE_STYLE="diurnal"` + `pnpm build` restores the old design: old palette (Task 1), clouds+birds (2/3), disc sun + dense stars (4), frosted white-glass slab + radius 18 (6), no megastructure/lens (8/10 guarded). The one intentional stub (Task 5's `struct*` = `s.mid`) is replaced within the same phase (Task 7) and never renders (megastructure mounts in Task 8), so it is not a shipped placeholder.

**Gap flagged (not silently dropped):** the megastructure's *elaborate* night face (lit window-grids, signage bloom, §4.2) is not a separate component — the silhouette recolors to its clamped dark fill and running lights live on the transports. Lit window-grids on the structure itself are a bounded follow-up if wanted.

**2. Placeholder scan.** No "TBD"/"handle edge cases"/"similar to Task N". Complete code in every code step. Two deliberate, documented items: the `var(--struct-*, fallback)` graceful defaults (Task 3) and the Task-5 struct stub (replaced in Task 7, never rendered).

**3. Type consistency.** `haze`/`transports` consistent across config/sample/vars. `ACTIVE_STYLE`/`applyStyleAttribute` match. `SceneTokens` gains `daylight`/`slabBg`/`slabInk`/`struct*` in Task 5, both derivation fns satisfy it, consumers (CSS) match in 6/8. `deriveTokensColdNoon`/`deriveTokensDiurnal`/`deriveTokens` dispatcher names consistent. `clampToInk`/`CONTRAST_FLOOR`/`PARALLAX_RATES`/`parallaxTransforms`/`Depth` and the `data-depth` values match definition↔use.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-14-cold-noon-visual-language.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, task review (spec + quality) between tasks, broad review at the end.
2. **Inline Execution** — execute in this session with checkpoints.

Which approach?
