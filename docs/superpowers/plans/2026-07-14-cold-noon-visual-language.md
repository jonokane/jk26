# Cold Noon — Visual Language Implementation Plan (Plan A of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin jonokane.com's living-sky system into the "Cold Noon" cyberpunk register — new palette, repurposed sky roster (haze, transports, megastructure), dark-always materials with the contrast invariant, and the grain+vignette lens — all driven by the existing token engine.

**Architecture:** The scene system already samples the visitor's clock and writes ~24 CSS custom properties onto `<html>` via one pure function (`applySceneToRoot`). This plan changes the *values and derivations* that function produces and the *components* that read them; it does not change the architecture (no new RAF, still sampled once a minute, still one DOM writer). New sky layers are CSS/SVG components driven by the same weight tokens. Parallax rides the existing GSAP ticker.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 (CSS-first `@theme` in `globals.css`), GSAP + ScrollTrigger + Lenis (one shared RAF), Velite (content, untouched here), Vitest, pnpm.

## Global Constraints

Copied verbatim from the spec (`docs/superpowers/specs/2026-07-14-cold-noon-visual-language-design.md`). Every task's requirements implicitly include these.

- **pnpm only.** Never `npm`/`yarn`. Run `pnpm build` (Velite → next build) and `pnpm test` (vitest) before every commit. Never commit on red.
- **No copy in JSX** (spec §15 of the governing design spec). All visitor-facing strings live in `src/lib/site-content.ts`. This plan adds no visitor-facing copy.
- **Colours come only from scene tokens.** No hex literals or Tailwind palette colours in components. The only place hex lives is `scene-config.ts` (keyframes), `scene-engine.ts` (derivation constants), and the token *defaults* in `globals.css`.
- **No em-dashes** in any visitor-facing copy. (N/A here — no copy added.)
- **No second RAF loop.** Parallax and every animation ride the existing `gsap.ticker` that `smooth-scroll.tsx` drives. Adding `requestAnimationFrame`/`autoRaf` anywhere in the scene or parallax system is a hard failure.
- **The scene has exactly one DOM writer:** `applySceneToRoot`. No other module may call `root.style.setProperty` for scene tokens.
- **Zero new keyframe fields for the sky roster** beyond the two renames (`clouds`→`haze`, `birds`→`transports`). The `pass` weight (for the-pass) is **Plan B**, not this plan.
- **The megastructure has no weight** — it is always the world; its day/night presence is handled by the `--struct-*` colour derivation, not an opacity weight.
- **Accent colours (constants, not scene tokens):** signage cyan `#7fd8e8`, sodium amber `#ff9a3c`.
- **`prefers-reduced-motion`:** no parallax; haze drift stops; stars stop twinkling; transports **freeze in place** (do not vanish). Scene stays correct for the hour. Grain/vignette are static and unaffected.
- **Continuity is law.** Every per-hour derivation must be continuous across the day — no `if/else` on a luminance threshold that produces a visible pop. Blend across a band. Two unit tests enforce this (slab continuity, contrast-invariant sweep).

---

## File Structure

**Data / engine (pure, unit-tested — house style of `carve-engine.ts`):**
- `src/lib/scene-config.ts` — the 8 Cold Noon keyframes, renamed+recurved weights, accent constants. Single source of truth for the palette.
- `src/lib/scene-engine.ts` — sampling + token derivation. Gains `--daylight`, `--slab-bg`, `--slab-ink`, `--struct-{far,mass,pylon,gantry}`, the elevation formula, and the contrast-invariant clamp. Loses the `inkLight` card-glass branch.
- `src/lib/sky-parallax.ts` — **new.** Pure `parallaxTransforms(scroll)` → per-layer translateY. Unit-tested.
- `src/lib/pre-hydration-scene.ts` — unchanged logic; verified still in sync (its table auto-updates from `SCENE_KEYFRAMES`).

**Sky components (all visuals in CSS modules — spec §15):**
- `src/components/sky/haze.tsx` (+ `.haze` in `sky.module.css`) — **was clouds.tsx.** Volumetric bands.
- `src/components/sky/transports.tsx` (+ `.transports`) — **was birds.tsx.** Silent craft, running lights, no flap.
- `src/components/sky/megastructure.tsx` (+ `.megastructure`) — **new.** Flat SVG gesture, `--struct-*` fills, four parallax layers.
- `src/components/sky/lens.tsx` (+ `.lens`) — **new.** Static grain + vignette, mounted above content.
- `src/components/sky/sun-moon.tsx`, `stars.tsx` — retuned (sun = luminous region; stars sparser/harder).
- `src/components/sky/use-sky-parallax.ts` — **new.** Wires `sky-parallax.ts` to ScrollTrigger; no new RAF.
- `src/components/sky/sky.module.css` — all sky visuals; `@keyframes flap` deleted.

**App shell:**
- `src/app/globals.css` — token defaults (renamed weights, new tokens), radius tokens, `.slab`/`.pill` rebuilt on elevation, `backdrop-filter` dropped.
- `src/app/layout.tsx` — sky roster mount list updated (Clouds→Haze, Birds→Transports, +Megastructure); `<Lens />` mounted above content.

**Tests:**
- `src/lib/scene-engine.test.ts` — repalette values, new tokens, **slab continuity**, **contrast-invariant sweep**.
- `src/lib/sky-parallax.test.ts` — **new.** The pure rate math.
- `src/lib/pre-hydration-scene.test.ts` — parametric; must stay green.

---

## Phase 1 — Palette & sky vocabulary

### Task 1: Cold Noon keyframes, weight rename, accents

**Files:**
- Modify: `src/lib/scene-config.ts`
- Modify: `src/lib/scene-engine.ts` (`SceneSample`, `sampleScene`, `applySceneToRoot`)
- Modify: `src/app/globals.css` (token defaults `--w-clouds`/`--w-birds` → `--w-haze`/`--w-transports`, and the default palette values)
- Modify: `src/components/sky/sky.module.css` (opacity rules reading `--w-clouds`/`--w-birds`)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Produces: `SceneKeyframe`/`SceneSample` fields `haze`, `transports` (replacing `clouds`, `birds`); CSS vars `--w-haze`, `--w-transports`; exports `SIGNAGE_CYAN = "#7fd8e8"`, `SODIUM_AMBER = "#ff9a3c"` from `scene-config.ts`.
- Consumes: nothing new.

- [ ] **Step 1: Update the test expectations to Cold Noon values (RED)**

In `src/lib/scene-engine.test.ts`, replace the hardcoded Midday assertions and the `clouds` field references. Find the `sampleScene` block and change:

```ts
  it("returns exact keyframe values at a keyframe hour", () => {
    const s = sampleScene(12.5);
    expect(s.from.name).toBe("Midday");
    expect(s.t).toBe(0);
    expect(s.top).toBe("#75868d");   // Cold Noon Midday top
    expect(s.haze).toBe(1);          // renamed from clouds
  });

  it("blends between neighboring keyframes at the midpoint", () => {
    // 10.25 is halfway between Morning (8.0) and Midday (12.5)
    const s = sampleScene(10.25);
    expect(s.from.name).toBe("Morning");
    expect(s.to.name).toBe("Midday");
    expect(s.t).toBeCloseTo(0.5, 5);
    expect(s.top).toBe(mixHex("#566a72", "#75868d", 0.5));
    expect(s.sun).toBeCloseTo(0.875, 5); // lerp(0.75, 1, 0.5) — Morning 0.75 → Midday 1.0
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test scene-engine`
Expected: FAIL — old config still returns `#3e9bf4` for Midday top and has no `haze` field.

- [ ] **Step 3: Rewrite `scene-config.ts`**

Replace the `SceneKeyframe` interface's `clouds`/`birds` fields and the whole `SCENE_KEYFRAMES` array. Colours from spec §3.1; weights from spec §4.3.

```ts
/** One keyframe of the day: sky colors + element weights at local hour `h`. */
export interface SceneKeyframe {
  /** Local hour this keyframe sits at (fractional, 0–24). */
  h: number;
  name: string;
  /** Sky gradient stops (top → mid 55% → horizon). */
  top: string;
  mid: string;
  hor: string;
  /** Foreground text colors. */
  ink: string;
  sub: string;
  /** Element layer weights, 0–1. */
  stars: number;
  rays: number;
  haze: number;        // was `clouds`
  transports: number;  // was `birds`
  sun: number;
  moon: number;
}

/** Accent colors — constants, not scene tokens. Used by the night faces of
 *  world objects, the slab seam, and the terminal cursor (Plan B). */
export const SIGNAGE_CYAN = "#7fd8e8"; // the machine
export const SODIUM_AMBER = "#ff9a3c"; // the dying world

/**
 * The 8 scenes of the day — "Cold Noon" (spec 2026-07-14 §3.1, §4.3).
 * Saturation lives at the low-sun hours and drains out at midday; warm =
 * the world dying, cold = the machine. Starting values — refine via `?tune`.
 */
export const SCENE_KEYFRAMES: readonly SceneKeyframe[] = [
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

- [ ] **Step 4: Rename the fields in `scene-engine.ts`**

In `SceneSample` (the interface), change `clouds` → `haze` and `birds` → `transports`. In `sampleScene`'s return object, change the two lerp lines:

```ts
    haze: lerp(from.haze, to.haze, t),
    transports: lerp(from.transports, to.transports, t),
```

In `applySceneToRoot`, change the two `setWeight` calls (the weight-writing lines):

```ts
  setWeight("--w-haze", s.haze);
  setWeight("--w-transports", s.transports);
```

(Delete the old `--w-clouds` and `--w-birds` writes.)

- [ ] **Step 5: Rename the CSS var references**

In `src/app/globals.css`, in the `:root` scene-token defaults block: change `--w-clouds` → `--w-haze` and `--w-birds` → `--w-transports`, and update the *default palette values* to Midnight (top `#04060d`, mid `#0a1018`, hor `#112630`, ink `#dde9ef`, sub `#7b8f99`). The default weights become Midnight's: `--w-stars: 1; --w-rays: 0; --w-haze: 0.35; --w-transports: 0.5; --w-sun: 0; --w-moon: 1;`.

In `src/components/sky/sky.module.css`, update the opacity rules that reference the old vars:

```css
.clouds { opacity: calc(var(--w-haze) * 0.92); }   /* class stays .clouds for now; renamed in Task 2 */
.birds  { opacity: calc(var(--w-transports) * 0.85); }
```

- [ ] **Step 6: Run tests + build (GREEN)**

Run: `pnpm test scene-engine && pnpm test pre-hydration && pnpm build`
Expected: PASS. `scene-engine` passes the new values; `pre-hydration-scene` is parametric (compares to `sampleScene`) so it auto-tracks; `pnpm build` type-checks the rename across the tree.

- [ ] **Step 7: Commit**

```bash
git add src/lib/scene-config.ts src/lib/scene-engine.ts src/app/globals.css src/components/sky/sky.module.css src/lib/scene-engine.test.ts
git commit -m "feat(scene): Cold Noon palette + haze/transports weight rename"
```

---

### Task 2: Haze layer (was clouds)

**Files:**
- Create: `src/components/sky/haze.tsx`
- Delete: `src/components/sky/clouds.tsx`
- Modify: `src/components/sky/sky.module.css` (replace `.clouds`/`.cloud`/`drift` with `.haze` bands)
- Modify: `src/app/layout.tsx` (import + mount)

**Interfaces:**
- Consumes: `--w-haze` (Task 1).
- Produces: `<Haze />` React component; `.haze` CSS class reading `--w-haze`.

- [ ] **Step 1: Write `haze.tsx`**

Volumetric bands — soft, layered, drifting slowly. Not objects; atmosphere. Colour comes from the sky, so bands are white-ish tinted and rely on opacity.

```tsx
import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** Haze bands (spec §4): vast, soft, layered volumetric smog. Replaces the
 *  four-ellipse cloud. Colour is carried by the sky behind; the band only
 *  adds soft luminance, so it reads at every hour. top (vh), height (vh),
 *  drift duration (s), negative delay (s), base blur (px). */
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
          style={
            {
              top: `${topVh}vh`,
              height: `${hVh}vh`,
              "--d": `${durS}s`,
              "--dl": `${delayS}s`,
              "--blur": `${blurPx}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Replace the cloud CSS with haze CSS**

In `src/components/sky/sky.module.css`, delete the `.clouds`, `.cloud`, and `@keyframes drift` blocks and add:

```css
/* ---------- haze: volumetric smog bands (spec §4) ---------- */
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

/* reduced motion: bands hold their resting position, still present (spec §15) */
@media (prefers-reduced-motion: reduce) {
  .hazeBand { animation: none; }
}
```

- [ ] **Step 3: Swap the mount in `layout.tsx`**

Change the import `import { Clouds } from "@/components/sky/clouds";` to `import { Haze } from "@/components/sky/haze";` and in the `<Sky>` children replace `<Clouds />` with `<Haze />`. Delete `src/components/sky/clouds.tsx`.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS — no reference to the deleted `clouds.tsx` remains.

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/haze.tsx src/components/sky/sky.module.css src/app/layout.tsx
git rm src/components/sky/clouds.tsx
git commit -m "feat(sky): clouds become haze bands"
```

---

### Task 3: Transports layer (was birds) + delete the flap

**Files:**
- Create: `src/components/sky/transports.tsx`
- Delete: `src/components/sky/birds.tsx`
- Modify: `src/components/sky/sky.module.css` (replace `.birds`/`.bird`/`@keyframes fly`/`@keyframes flap` with `.transports`)
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `--w-transports` (Task 1), `SIGNAGE_CYAN`/`SODIUM_AMBER` (Task 1) via inline style.
- Produces: `<Transports />`; `.transports` CSS reading `--w-transports`.

- [ ] **Step 1: Write `transports.tsx`**

Enormous, silent, distant, dead-straight. Running lights (cyan + one amber). No flap keyframe — rigidity is the menace.

```tsx
import type { CSSProperties } from "react";
import { SIGNAGE_CYAN, SODIUM_AMBER } from "@/lib/scene-config";
import styles from "@/components/sky/sky.module.css";

/** A silent craft: a long thin silhouette carrying running lights. It crosses
 *  dead-straight and never flaps. top (vh), length (px), crossing duration (s),
 *  negative delay (s), opacity. */
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
          style={
            {
              top: `${topVh}vh`,
              width: `${lenPx}px`,
              opacity: op,
              "--d": `${durS}s`,
              "--dl": `${delayS}s`,
            } as CSSProperties
          }
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

- [ ] **Step 2: Replace the bird CSS**

In `sky.module.css`, delete the `.birds`, `.bird`, `.bird svg`, `@keyframes fly`, `@keyframes flap`, and the birds reduced-motion block. Add:

```css
/* ---------- transports: silent craft, running lights, NO flap (spec §4.1) ---------- */
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

/* reduced motion: the machine FREEZES in place (it is scenery, not decoration) */
@media (prefers-reduced-motion: reduce) {
  .craft { animation: none; }
  .runLight { animation: none; }
}
```

(The `var(--struct-mass, …)` fallback lets the craft render before Task 7 ships the struct tokens; once Task 7 lands, the craft silhouette recolours with the megastructure.)

- [ ] **Step 3: Swap the mount**

In `layout.tsx`: `import { Transports } from "@/components/sky/transports";`, replace `<Birds />` with `<Transports />`, drop the `Birds` import. Delete `birds.tsx`.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/transports.tsx src/components/sky/sky.module.css src/app/layout.tsx
git rm src/components/sky/birds.tsx
git commit -m "feat(sky): birds become silent transports; delete @keyframes flap"
```

---

### Task 4: Sun as a luminous region; stars retuned

**Files:**
- Modify: `src/components/sky/sky.module.css` (`.sun`, `.stars`/`.star`)
- Modify: `src/components/sky/stars.tsx` (counts)

**Interfaces:**
- Consumes: existing `--sun-x`/`--sun-y`, `--w-sun`, `--w-stars`.
- Produces: no new interface.

- [ ] **Step 1: Redraw the sun**

In `sky.module.css`, replace the `.sun` rule. It is no longer a friendly disc — it is a white hole punched through smog: a soft luminous region, larger, no hard edge.

```css
.sun {
  position: absolute;
  left: calc(var(--sun-x) - 130px);
  top: calc(var(--sun-y) - 130px);
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9) 0 14%,
    rgba(240, 248, 250, 0.5) 30%,
    rgba(210, 228, 235, 0.18) 52%,
    transparent 72%
  );
  filter: blur(6px);
  mix-blend-mode: screen;
}
```

- [ ] **Step 2: Retune the stars**

In `src/components/sky/stars.tsx`, reduce and harden the field. Change the count constants:

```ts
const STAR_COUNT = 64;   // was 110 — sparser; the city competes for light now
const SPARKLE_COUNT = 4;  // was 9 — harder, fewer
```

In `sky.module.css`, tighten the star twinkle floor so they read as hard points, not soft glimmers:

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 1; }
}
```

- [ ] **Step 3: Build + visual check**

Run: `pnpm build`
Expected: PASS. (Manual: `pnpm dev`, open `localhost:3000/?tune`, scrub to Midday — the sun is a soft bloom, not a disc — and to Midnight — stars are sparse and hard.)

- [ ] **Step 4: Commit**

```bash
git add src/components/sky/sky.module.css src/components/sky/stars.tsx
git commit -m "feat(sky): sun as luminous region; stars sparser and harder"
```

---

## Phase 2 — Materials

### Task 5: `--daylight`, `--slab-bg`, `--slab-ink` + the elevation formula

**Files:**
- Modify: `src/lib/scene-engine.ts` (`SceneTokens`, `deriveTokens`, `applySceneToRoot`)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Consumes: `luminance`, `mixHex`, `smoothstep` (already in `scene-engine.ts`).
- Produces: tokens `daylight` (0–1), `slabBg` (hex), `slabInk` (constant `#e6edee`) on `SceneTokens`; CSS vars `--daylight`, `--slab-bg`, `--slab-ink`.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/scene-engine.test.ts`:

```ts
import { sampleScene, deriveTokens } from "@/lib/scene-engine";

describe("elevation slab (spec §6.1)", () => {
  it("is fully lifted at midnight and fully dark at midday", () => {
    const night = deriveTokens(sampleScene(0));    // L(mid) low
    const noon = deriveTokens(sampleScene(12.5));   // L(mid) high
    // lifted = mid mixed toward light; dark = mid mixed toward near-black
    expect(luminance(night.slabBg)).toBeGreaterThan(luminance("#0a1018"));
    expect(luminance(noon.slabBg)).toBeLessThan(luminance("#95a4a8"));
  });

  it("slabInk is the constant light ink, never flipped", () => {
    expect(deriveTokens(sampleScene(0)).slabInk).toBe("#e6edee");
    expect(deriveTokens(sampleScene(12.5)).slabInk).toBe("#e6edee");
  });

  it("slabBg is CONTINUOUS across the day — no pop (spec §6.1 CRITICAL)", () => {
    let prev = luminance(deriveTokens(sampleScene(0)).slabBg);
    for (let h = 0.25; h < 24; h += 0.25) {
      const cur = luminance(deriveTokens(sampleScene(h)).slabBg);
      // adjacent quarter-hours must not jump — the threshold band is smoothed
      expect(Math.abs(cur - prev)).toBeLessThan(0.06);
      prev = cur;
    }
  });

  it("daylight is normalized luminance of the mid stop, 0..1", () => {
    const d = deriveTokens(sampleScene(12.5)).daylight;
    expect(d).toBeGreaterThan(0.4);
    expect(deriveTokens(sampleScene(0)).daylight).toBeLessThan(0.15);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test scene-engine`
Expected: FAIL — `slabBg`, `slabInk`, `daylight` are not on `SceneTokens`.

- [ ] **Step 3: Extend `SceneTokens` and `deriveTokens`**

In `scene-engine.ts`, add the three fields to `SceneTokens`:

```ts
export interface SceneTokens {
  ink: string;
  sub: string;
  surface: string;
  scrim: string;
  cardBg: string;
  cardBorder: string;
  textGlow: string;
  elev: string;
  coverA: string;
  coverB: string;
  inkLight: boolean;
  daylight: number;   // NEW — 0..1 normalized luminance of the mid stop
  slabBg: string;     // NEW — the elevation slab background
  slabInk: string;    // NEW — constant light ink on the slab
}

/** The slab background (spec §6.1): a constant contrast step from the sky —
 *  darker when there is room below it, LIFTED when there is not. Blended
 *  across a band so the day crosses the threshold with no visible pop. */
function slabBackground(midHex: string): string {
  const L = luminance(midHex);
  const dark = mixHex(midHex, "#05080a", 0.88); // room below: go dark
  const lift = mixHex(midHex, "#cfe0e8", 0.13);  // no room: lift above the sky
  const b = smoothstep((L - 0.18) / (0.26 - 0.18)); // 0 at L≤0.18, 1 at L≥0.26
  return mixHex(lift, dark, b);
}
```

In `deriveTokens`, add to the returned object (leave the existing `inkLight`-branched card tokens in place — they are removed in Task 6):

```ts
    daylight: Math.min(1, Math.max(0, luminance(s.mid))),
    slabBg: slabBackground(s.mid),
    slabInk: "#e6edee",
```

- [ ] **Step 4: Write the new vars in `applySceneToRoot`**

Add three `set(...)` calls alongside the existing token writes:

```ts
  set("--daylight", String(Number(tk.daylight.toFixed(4))));
  set("--slab-bg", tk.slabBg);
  set("--slab-ink", tk.slabInk);
```

- [ ] **Step 5: Run tests (GREEN)**

Run: `pnpm test scene-engine`
Expected: PASS — including the continuity sweep.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts
git commit -m "feat(scene): --daylight, elevation --slab-bg, constant --slab-ink"
```

---

### Task 6: Materials rebuild — radius tokens, slab on elevation, drop the frosted glass

**Files:**
- Modify: `src/app/globals.css` (`:root` radius tokens; `.slab`, `.pill`, `.site-header` radii; `--card-bg` default)
- Modify: `src/lib/scene-engine.ts` (`deriveTokens`: delete the `inkLight` card-glass branch; make `textGlow`/`elev` dark-world constants)
- Modify: `src/components/work/case-study-cover.module.css`, `src/components/contact/contact.module.css`, `src/components/site-header.module.css` (radius → tokens)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Consumes: `--slab-bg`, `--slab-ink` (Task 5).
- Produces: radius tokens `--r-slab`, `--r-input`, `--r-header`, `--r-cover`, `--r-pill`; `.slab`/`.pill` on the elevation material; `deriveTokens` no longer flips card tokens on `inkLight`.

- [ ] **Step 1: Write the failing test**

Add to `scene-engine.test.ts`:

```ts
describe("materials are dark-always (spec §6.1)", () => {
  it("card background never becomes white glass, even at noon", () => {
    const noon = deriveTokens(sampleScene(12.5));
    // old behaviour flipped to rgba(255,255,255,.62); new behaviour is the dark slab
    expect(noon.cardBg).toBe(noon.slabBg);
    expect(noon.cardBg).not.toContain("255,255,255");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test scene-engine`
Expected: FAIL — `cardBg` at noon is still the white-glass rgba.

- [ ] **Step 3: Collapse the card branch in `deriveTokens`**

Replace the `inkLight`-flipped card lines. `inkLight` stays (Task 7's clamp needs it); only the *card material* stops flipping:

```ts
  const inkLight = luminance(s.ink) > 0.5;
  const surface = mixHex(s.top, inkLight ? "#07091a" : "#f8fafe", 0.6);
  const slabBg = slabBackground(s.mid);
  return {
    ink: s.ink,
    sub: s.sub,
    surface,
    scrim: surface + "94",
    cardBg: slabBg,                              // was inkLight ? dark : WHITE glass — deleted
    cardBorder: "rgba(150,180,190,.14)",          // constant hairline; no flip
    textGlow: "rgba(4,7,18,.55)",                 // dark-world constant
    elev: "rgba(3,6,16,.5)",                      // dark-world constant
    coverA: s.mid,
    coverB: s.hor,
    inkLight,
    daylight: Math.min(1, Math.max(0, luminance(s.mid))),
    slabBg,
    slabInk: "#e6edee",
  };
```

- [ ] **Step 4: Add radius tokens + rebuild `.slab`/`.pill` in `globals.css`**

In the `:root` block (with the type tokens), add:

```css
  /* material radii (spec §6.3) — tokenized so they change in one place */
  --r-slab: 4px;
  --r-input: 4px;
  --r-header: 4px;
  --r-cover: 4px;
  --r-pill: 9999px;
```

Rewrite `.slab` and `.pill` in `@layer components`: use `--slab-bg`/`--slab-ink`, the radius token, and **drop `backdrop-filter`** (cyberpunk glass is dirty, not frosted):

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
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8125rem 1.625rem;
    border-radius: var(--r-pill);
    background: var(--slab-bg);
    color: var(--slab-ink);
    border: 1px solid var(--card-border);
    box-shadow: 0 8px 28px var(--elev);
  }
```

Change `.site-header` `border-radius: 15px;` → `var(--r-header)`. In the `:root` scene-token defaults, set `--slab-bg`, `--slab-ink` defaults (Midnight): `--slab-bg: #1a222b; --slab-ink: #e6edee;` and change the `--card-bg` default line to reference nothing stale (the `.slab` no longer reads `--card-bg`, but keep the var defined for any other consumer; set `--card-bg: #1a222b;`). Set `--card-border: rgba(150,180,190,.14);` and `--daylight: 0;`.

- [ ] **Step 5: Tokenize the other radii**

- `src/components/work/case-study-cover.module.css`: `border-radius: 18px;` → `var(--r-cover)`.
- `src/components/contact/contact.module.css`: `border-radius: 10px;` → `var(--r-input)`.
- `src/components/site-header.module.css`: the pill `border-radius: 9999px;` → `var(--r-pill)`.

- [ ] **Step 6: Run tests + build**

Run: `pnpm test scene-engine && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts src/app/globals.css src/components/work/case-study-cover.module.css src/components/contact/contact.module.css src/components/site-header.module.css
git commit -m "feat(materials): dark-always slab on elevation, radius tokens, drop backdrop-filter"
```

---

## Phase 3 — Megastructure & the contrast invariant

### Task 7: `--struct-*` tokens + the contrast-invariant clamp

**Files:**
- Modify: `src/lib/scene-engine.ts` (`SceneTokens`, `deriveTokens`, `applySceneToRoot`, `CONTRAST_FLOOR`)
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Consumes: `luminance`, `mixHex`, `s.mid`, `s.hor`, `s.ink`, `inkLight`.
- Produces: `SceneTokens` fields `structFar`, `structMass`, `structPylon`, `structGantry`; CSS vars `--struct-far`, `--struct-mass`, `--struct-pylon`, `--struct-gantry`; exported `CONTRAST_FLOOR = 0.18` and `clampToInk(hex, inkHex, inkLight, horHex)`.

- [ ] **Step 1: Write the failing tests (the sweep is the important one)**

Add to `scene-engine.test.ts`:

```ts
import { deriveTokens, sampleScene, luminance } from "@/lib/scene-engine";

describe("contrast invariant — the ink is the darkest thing (spec §7)", () => {
  const FLOOR = 0.18;
  const structKeys = ["structFar", "structMass", "structPylon", "structGantry"] as const;

  it("holds at every quarter-hour across the whole day, not just keyframes", () => {
    for (let h = 0; h < 24; h += 0.25) {
      const t = deriveTokens(sampleScene(h));
      const Li = luminance(t.ink);
      for (const k of structKeys) {
        const Ls = luminance(t[k]);
        if (t.inkLight) {
          // night: no structure may be BRIGHTER than the ink (minus floor)
          expect(Ls).toBeLessThanOrEqual(Li - FLOOR + 1e-6);
        } else {
          // day: no structure may be DARKER than the ink (plus floor)
          expect(Ls).toBeGreaterThanOrEqual(Li + FLOOR - 1e-6);
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test scene-engine`
Expected: FAIL — the struct fields do not exist.

- [ ] **Step 3: Add the clamp + struct derivation**

In `scene-engine.ts`, add the exported constant and helper, then the four tokens.

```ts
/** Spec §7. The content always wins the value contest. */
export const CONTRAST_FLOOR = 0.18;

/**
 * Push a structure colour to the correct side of the ink by mixing it toward
 * the horizon (spec §7). Closed-form: move luminance to the boundary, capped
 * at fully-horizon. Day (dark ink): structure must be LIGHTER than ink+floor.
 * Night (light ink): structure must be DARKER than ink-floor.
 */
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

/** The four megastructure depths: a base mixed toward the horizon by its
 *  aerial-perspective amount, then clamped so the ink still wins (spec §6.2, §7). */
function structTokens(s: SceneSample, inkLight: boolean) {
  const base = (aerial: number) => mixHex(s.mid, s.hor, aerial);
  const clamp = (hex: string) => clampToInk(hex, s.ink, inkLight, s.hor);
  return {
    structFar: clamp(base(0.8)),    // nearly dissolved into the sky
    structMass: clamp(base(0.5)),
    structPylon: clamp(base(0.32)),
    structGantry: clamp(base(0.14)), // nearest, least washed
  };
}
```

Add the four fields to `SceneTokens`:

```ts
  structFar: string;
  structMass: string;
  structPylon: string;
  structGantry: string;
```

And spread them into the `deriveTokens` return (before the closing brace):

```ts
    ...structTokens(s, inkLight),
```

- [ ] **Step 4: Write the vars in `applySceneToRoot`**

```ts
  set("--struct-far", tk.structFar);
  set("--struct-mass", tk.structMass);
  set("--struct-pylon", tk.structPylon);
  set("--struct-gantry", tk.structGantry);
```

Add matching defaults to the `:root` block in `globals.css` (Midnight values are fine as placeholders since the engine overwrites on mount): `--struct-far: #14202a; --struct-mass: #101a22; --struct-pylon: #0d1620; --struct-gantry: #0a121a;`.

- [ ] **Step 5: Run tests (GREEN)**

Run: `pnpm test scene-engine`
Expected: PASS — the quarter-hour sweep holds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts src/app/globals.css
git commit -m "feat(scene): --struct-* tokens + contrast-invariant clamp"
```

---

### Task 8: The megastructure component (flat SVG gesture)

**Files:**
- Create: `src/components/sky/megastructure.tsx`
- Modify: `src/components/sky/sky.module.css` (`.megastructure` + `.megaLayer`)
- Modify: `src/app/layout.tsx` (mount inside `<Sky>`)

**Interfaces:**
- Consumes: `--struct-far`, `--struct-mass`, `--struct-pylon`, `--struct-gantry` (Task 7).
- Produces: `<Megastructure />`; four layer nodes with `data-depth` attributes (`far`/`mass`/`pylon`/`gantry`) that Task 9's hook parallaxes.

- [ ] **Step 1: Write `megastructure.tsx`**

A gesture, not a skyline (spec §5.1): a vanishing point, aerial perspective (far washed toward the horizon by Task 7's `--struct-far`), a gantry overhead, an inverted mass wider at the top, pylons receding, two scale specks. Detail lives in the surface, never the silhouette. Two `viewBox`es — wide for desktop, a portrait crop for phones (spec §15) — chosen by a CSS media query on the SVG.

```tsx
import styles from "@/components/sky/sky.module.css";

/**
 * The megastructure (spec §5): one colossal form the viewer cannot name.
 * Pure flat vector filled with scene tokens, so it recolours at every hour
 * for free. Four layers carry the parallax depth (Task 9 reads data-depth).
 */
export function Megastructure() {
  return (
    <div className={styles.megastructure} aria-hidden="true">
      <svg
        className={styles.megaSvg}
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMax slice"
      >
        {/* far: monoliths dissolving into the horizon */}
        <g className={styles.megaLayer} data-depth="far">
          <rect x="600" y="150" width="74" height="350" fill="var(--struct-far)" />
          <rect x="690" y="200" width="42" height="300" fill="var(--struct-far)" opacity="0.8" />
          <rect x="548" y="230" width="30" height="270" fill="var(--struct-far)" opacity="0.65" />
        </g>

        {/* mass: the inverted megablock — WIDER at the top, leaning over you */}
        <g className={styles.megaLayer} data-depth="mass">
          <path d="M 96 500 L 130 210 L 396 160 L 430 500 Z" fill="var(--struct-mass)" />
          <path d="M 130 210 L 396 160 L 404 196 L 126 244 Z" fill="var(--struct-pylon)" opacity="0.22" />
        </g>

        {/* pylons: receding into fog, each smaller and lighter */}
        <g className={styles.megaLayer} data-depth="pylon" fill="var(--struct-pylon)">
          <polygon points="452,500 452,320 470,314 470,500" opacity="0.78" />
          <polygon points="486,500 486,350 500,346 500,500" opacity="0.62" />
          <polygon points="512,500 512,378 523,375 523,500" opacity="0.5" />
          <polygon points="532,500 532,402 540,400 540,500" opacity="0.4" />
        </g>

        {/* gantry: overhead, converging to the same vanishing point (560,500) */}
        <g className={styles.megaLayer} data-depth="gantry">
          <path d="M 0 20 L 560 470 L 560 500 L 0 92 Z" fill="var(--struct-gantry)" opacity="0.93" />
          <path d="M 0 92 L 560 500 L 548 500 L 0 122 Z" fill="var(--struct-gantry)" opacity="0.6" />
          {/* two scale specks — the only way you know any of this is enormous */}
          <circle cx="470" cy="486" r="2.4" fill="var(--struct-gantry)" />
          <circle cx="481" cy="488" r="2" fill="var(--struct-gantry)" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Add the CSS (with the phone crop)**

In `sky.module.css`:

```css
/* ---------- megastructure (spec §5): always the world ---------- */
/* No z-index: it renders after .gradient in DOM order (so it sits above the
   gradient) and before the sun/rays/stars/haze/transports children (so those
   layer over it). The whole .sky is already z-index:-1 behind the content. */
.megastructure {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.megaSvg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.megaLayer {
  will-change: transform;
}

/* phone: a portrait crop keeps the vanishing point instead of squishing the
   wide frame flat (spec §15) */
@media (max-width: 640px) {
  .megaSvg {
    width: 180%;
    left: -40%;
  }
}
```

- [ ] **Step 3: Mount it**

In `layout.tsx`, `import { Megastructure } from "@/components/sky/megastructure";` and add `<Megastructure />` as the FIRST child of `<Sky>` (behind the sun/rays/etc so structures sit deepest):

```tsx
            <Sky>
              <Megastructure />
              <SunMoon />
              <Rays />
              <Stars />
              <Haze />
              <Transports />
            </Sky>
```

- [ ] **Step 4: Build + visual check**

Run: `pnpm build`
Expected: PASS. (Manual: `?tune` → Midday shows a grey monumental gesture washing into the horizon; Midnight shows it near-black; the wordmark is never eaten because Task 7 keeps structures off the ink's value.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/megastructure.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): flat-vector megastructure gesture"
```

---

### Task 9: Parallax on the GSAP ticker

**Files:**
- Create: `src/lib/sky-parallax.ts`
- Create: `src/components/sky/use-sky-parallax.ts`
- Test: `src/lib/sky-parallax.test.ts`
- Modify: `src/components/sky/megastructure.tsx` (call the hook)

**Interfaces:**
- Consumes: `ScrollTrigger` from `@/lib/gsap`; the four `data-depth` nodes (Task 8).
- Produces: `parallaxTransforms(scroll: number): Record<Depth, number>` (pure); `useSkyParallax(rootRef)` (wires ScrollTrigger, no new RAF).

- [ ] **Step 1: Write the failing test for the pure math**

Create `src/lib/sky-parallax.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PARALLAX_RATES, parallaxTransforms } from "@/lib/sky-parallax";

describe("parallaxTransforms", () => {
  it("is zero at scroll 0", () => {
    const t = parallaxTransforms(0);
    expect(t.far).toBe(0);
    expect(t.gantry).toBe(0);
  });

  it("moves each layer by scroll × its rate (nearer = faster)", () => {
    const t = parallaxTransforms(1000);
    expect(t.far).toBeCloseTo(-1000 * PARALLAX_RATES.far, 5);
    expect(t.gantry).toBeCloseTo(-1000 * PARALLAX_RATES.gantry, 5);
    expect(Math.abs(t.gantry)).toBeGreaterThan(Math.abs(t.far)); // gantry is nearest
  });

  it("uses the spec's four rates", () => {
    expect(PARALLAX_RATES).toEqual({ far: 0.03, mass: 0.09, pylon: 0.18, gantry: 0.4 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test sky-parallax`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `sky-parallax.ts`**

```ts
/** Sky-layer parallax (spec §5.2). Pure math; the hook applies it on the
 *  existing GSAP ticker. Rates are fraction of scroll distance. */
export type Depth = "far" | "mass" | "pylon" | "gantry";

export const PARALLAX_RATES: Record<Depth, number> = {
  far: 0.03,
  mass: 0.09,
  pylon: 0.18,
  gantry: 0.4,
};

/** translateY (px) per layer for a given scroll offset. Negative = layers
 *  drift up slower than the page, so nearer layers appear to move more. */
export function parallaxTransforms(scroll: number): Record<Depth, number> {
  return {
    far: -scroll * PARALLAX_RATES.far,
    mass: -scroll * PARALLAX_RATES.mass,
    pylon: -scroll * PARALLAX_RATES.pylon,
    gantry: -scroll * PARALLAX_RATES.gantry,
  };
}
```

- [ ] **Step 4: Run the math test (GREEN)**

Run: `pnpm test sky-parallax`
Expected: PASS.

- [ ] **Step 5: Write the wiring hook (no new RAF)**

Create `src/components/sky/use-sky-parallax.ts`. It reads scroll from ScrollTrigger's own update (which `smooth-scroll.tsx` already drives off the GSAP ticker via Lenis) and writes transforms directly to the `data-depth` nodes. It respects `prefers-reduced-motion`.

```ts
"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { parallaxTransforms, type Depth } from "@/lib/sky-parallax";

/** Applies sky parallax to the [data-depth] layers under `rootRef`. Rides the
 *  existing ScrollTrigger update (no new RAF — spec constraint). Off under
 *  prefers-reduced-motion. */
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
      nodes.forEach((el, d) => {
        el.style.transform = `translateY(${t[d].toFixed(2)}px)`;
      });
    };

    // ScrollTrigger.update fires on every Lenis-driven scroll tick (wired in
    // smooth-scroll.tsx). We hook the same event; we do NOT start a new loop.
    const st = ScrollTrigger.create({ onUpdate: apply });
    apply();
    return () => st.kill();
  }, [rootRef]);
}
```

- [ ] **Step 6: Call the hook from the megastructure**

In `megastructure.tsx`, add the ref and hook:

```tsx
import { useRef } from "react";
import { useSkyParallax } from "@/components/sky/use-sky-parallax";
import styles from "@/components/sky/sky.module.css";

export function Megastructure() {
  const ref = useRef<HTMLDivElement>(null);
  useSkyParallax(ref);
  return (
    <div className={styles.megastructure} aria-hidden="true" ref={ref}>
      {/* ...svg unchanged... */}
    </div>
  );
}
```

(Add `"use client";` at the top of `megastructure.tsx` since it now uses hooks.)

- [ ] **Step 7: Build + verify no second RAF**

Run: `pnpm test && pnpm build`
Expected: PASS. Manual check: `grep -rn "requestAnimationFrame\|autoRaf" src/components/sky src/lib/sky-parallax.ts` returns nothing.

- [ ] **Step 8: Commit**

```bash
git add src/lib/sky-parallax.ts src/lib/sky-parallax.test.ts src/components/sky/use-sky-parallax.ts src/components/sky/megastructure.tsx
git commit -m "feat(sky): megastructure parallax on the shared GSAP ticker"
```

---

## Phase 4 — The lens

### Task 10: Grain + vignette

**Files:**
- Create: `src/components/sky/lens.tsx`
- Modify: `src/components/sky/sky.module.css` (`.lens`, `.lensGrain`, `.lensVignette`)
- Modify: `src/app/layout.tsx` (mount above content)

**Interfaces:**
- Consumes: nothing (static, not on a time curve).
- Produces: `<Lens />`.

- [ ] **Step 1: Write `lens.tsx`**

Static grain (a tiled `feTurbulence` data-URI, so it never shimmers) plus a vignette. Fixed, above content, `aria-hidden`, `pointer-events:none`.

```tsx
import styles from "@/components/sky/sky.module.css";

/** The lens (spec §8): static film grain + vignette, above the content. The
 *  single biggest lever for "grimy". Static, not animated — a still grain is
 *  more Neuromancer than a crawling one. Not on a time-of-day curve. */
export function Lens() {
  return (
    <div className={styles.lens} aria-hidden="true">
      <div className={styles.lensGrain} />
      <div className={styles.lensVignette} />
    </div>
  );
}
```

- [ ] **Step 2: Add the CSS**

In `sky.module.css`. The grain opacity is capped low so it never drops text contrast (spec §8 a11y); the vignette is soft and does not encroach on reading columns.

```css
/* ---------- the lens (spec §8): grain + vignette, above content ---------- */
.lens {
  position: fixed;
  inset: 0;
  z-index: 30; /* above content, below the header (z-40) and tune/scrubber */
  pointer-events: none;
}

.lensGrain {
  position: absolute;
  inset: 0;
  opacity: 0.05; /* capped — must not reduce text contrast (spec §8) */
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 140px 140px; /* fixed tile — no shimmer at 2× DPR (spec §15) */
}

.lensVignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 44%, transparent 55%, rgba(0, 0, 0, 0.42) 100%);
}
```

- [ ] **Step 3: Mount above content**

In `layout.tsx`, `import { Lens } from "@/components/sky/lens";` and place `<Lens />` immediately after `{children}` (so it layers above the page but its `z-index` keeps it below the header and dev panels):

```tsx
            {children}
            <Lens />
            <TimeScrubber />
            <SceneTunePanel />
```

- [ ] **Step 4: Build + contrast check**

Run: `pnpm build`
Expected: PASS. (Manual: body copy remains legible with the lens on; the vignette darkens only the outer frame.)

- [ ] **Step 5: Commit**

```bash
git add src/components/sky/lens.tsx src/components/sky/sky.module.css src/app/layout.tsx
git commit -m "feat(sky): the lens — static grain + vignette"
```

---

## Self-Review

**1. Spec coverage.**

- §3 palette → Task 1. §3.1 keyframes → Task 1. §3.2 accents → Task 1.
- §4 roster: haze → Task 2, transports → Task 3, megastructure → Tasks 7–9, rays/stars/sun → Task 4, gradient re-tune → Task 1. §4.1 delete flap → Task 3. §4.2 day/night face: transports running lights → Task 3; megastructure day/night is carried by the `--struct-*` derivation (Task 7) — **note:** the full window-grid/signage *night face* of the megastructure is a richer treatment; this plan ships the silhouette + running-light transports, and the megastructure's night appearance is its clamped dark fill. A distinct window-grid overlay, if wanted, is a small follow-up — flagged, not silently dropped. §4.3 re-curves → Task 1.
- §5 megastructure → Tasks 7 (tokens), 8 (component), 9 (parallax). §5.3 3D → deferred by the spec; nothing to build.
- §6 materials → Task 5 (elevation tokens), Task 6 (rebuild, radius, drop blur, delete white-glass). §6.2 tokens → Tasks 5 & 7. §6.3 radius → Task 6.
- §7 contrast invariant → Task 7 (clamp + sweep test).
- §8 lens → Task 10.
- §14 tests → Tasks 5 (continuity), 7 (sweep), 9 (parallax math), plus the parametric pre-hydration test kept green in Task 1.
- §15 a11y/mobile: reduced-motion built into Tasks 2, 3, 9; mobile megastructure crop → Task 8; grain fixed tile → Task 10.
- §16 files → all covered. §17 rejected → design-time, nothing to build. §18 deferred → out of scope (Plan B + layout/type passes).

**Gap found & handled:** the megastructure's *elaborate* night face (window grids, signage bloom, §4.2) is not a separate component here — the silhouette recolours to its clamped dark fill and the running lights live on the transports. If Jono wants lit window-grids on the structure itself, that is a bounded follow-up task, noted above rather than assumed.

**2. Placeholder scan.** No "TBD"/"handle edge cases"/"similar to Task N". Every code step carries complete code. The two `var(--struct-*, fallback)` uses in Task 3 are deliberate graceful-degradation defaults, not placeholders.

**3. Type consistency.** `haze`/`transports` used consistently (config → sample → vars). `slabBg`/`slabInk`/`daylight` defined in Task 5, consumed in Task 6. `structFar/Mass/Pylon/Gantry` defined in Task 7, consumed by the CSS in Task 8. `clampToInk`/`CONTRAST_FLOOR`/`PARALLAX_RATES`/`parallaxTransforms`/`Depth` names match across definition and use. `data-depth` values (`far`/`mass`/`pylon`/`gantry`) match between the SVG (Task 8) and the hook (Task 9).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-14-cold-noon-visual-language.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, task review (spec + quality) between tasks, broad review at the end.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?
