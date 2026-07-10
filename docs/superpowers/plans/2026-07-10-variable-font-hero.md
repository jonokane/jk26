# Variable-Font Hero Wordmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hero's static "Jono Kane" h1 with a living wordmark where each letter of TotalBlack Variable independently animates through the weight axis (ambient loop + cursor "carve" interaction), tunable via a dev-only panel.

**Architecture:** A framework-agnostic engine (`wordmark-engine.ts`) ports the browser-validated prototype math and runs on GSAP's shared ticker, writing `font-variation-settings` directly to per-letter spans (zero React re-renders). A client component owns font-load gating, entrance, pointer tracking, and lifecycle; a typed config object is the single source of truth for all tuned values.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, GSAP ticker, Motion (entrance only), Tailwind v4, Adobe Fonts (Typekit kit `aqv1jgr`), Vitest + jsdom (new dev deps).

**Spec:** `docs/superpowers/specs/2026-07-10-variable-font-hero-design.md` — read it first.

## Global Constraints

- **pnpm only.** Never `npm`/`yarn`. Install deps with `pnpm add -D <pkg>`.
- **One RAF loop.** All frame work runs from `gsap.ticker` (import from `@/lib/gsap`). Never `requestAnimationFrame` directly, never Motion's loop for the letter engine.
- **Font family name is exactly `"totalblack-variable"`** (Adobe Fonts kit `aqv1jgr`, stylesheet `https://use.typekit.net/aqv1jgr.css`). Weight axis: **170–1000**, default 400.
- **No self-hosted font files.** Adobe license requires their CDN. Never copy any `.woff2` into `public/` or `src/`.
- **Reduced motion is a hard requirement:** `prefers-reduced-motion: reduce` must show a static frozen-weights wordmark with the engine never started.
- **Tune panel must not ship:** gate on `process.env.NODE_ENV === "development"`.
- **Wordmark text is `"Jono Kane"`** — 8 letters + 1 space. Screen readers must announce it exactly once.
- Run `pnpm build` before each commit that touches app code (repo convention).

## File Structure

```
vitest.config.ts                         NEW  Vitest config (jsdom + @/ alias)
src/lib/hero-config.ts                   NEW  Types + tuned config (single source of truth)
src/lib/hero-config.test.ts              NEW  Config sanity tests
src/lib/wordmark-engine.ts               NEW  Engine: pure math + createWordmarkEngine
src/lib/wordmark-engine.test.ts          NEW  Engine unit + jsdom integration tests
src/components/wordmark-tune-panel.tsx   NEW  Dev-only slider panel
src/components/hero-wordmark.tsx         NEW  Client component (spans, gating, lifecycle)
src/app/layout.tsx                       MOD  Typekit preconnect + stylesheet links
src/app/globals.css                      MOD  --font-wordmark theme token
src/app/page.tsx                         MOD  Hero h1 → <HeroWordmark />
package.json                             MOD  vitest deps + "test" script
PLAN.md                                  MOD  Hero decided; 3D parked
```

---

### Task 1: Test infrastructure + hero config

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/hero-config.ts`
- Create: `src/lib/hero-config.test.ts`
- Modify: `package.json` (devDependencies via pnpm, `test` script)

**Interfaces:**
- Produces: `WORDMARK_TEXT: string`, `AXIS_MIN = 170`, `AXIS_MAX = 1000`, types `EaseName`, `FalloffName`, `HoverMode`, `AmbientConfig`, `HoverConfig`, `HeroConfig`, and the value `heroConfig: HeroConfig`. Every later task imports from `@/lib/hero-config`.

- [ ] **Step 1: Install vitest + jsdom**

```bash
pnpm add -D vitest jsdom
```

- [ ] **Step 2: Create vitest config and test script**

Create `vitest.config.ts`:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

In `package.json`, add to `"scripts"` (after `"lint"`):

```json
"test": "vitest run"
```

- [ ] **Step 3: Write the failing config test**

Create `src/lib/hero-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AXIS_MAX, AXIS_MIN, heroConfig, WORDMARK_TEXT } from "@/lib/hero-config";

describe("heroConfig", () => {
  it("has one frozen reduced-motion weight per letter (spaces excluded)", () => {
    const letterCount = WORDMARK_TEXT.replace(/ /g, "").length;
    expect(heroConfig.reducedMotion.weights).toHaveLength(letterCount);
  });

  it("keeps every weight inside the font's axis bounds", () => {
    const { wmin, wmax } = heroConfig.ambient;
    expect(wmin).toBeGreaterThanOrEqual(AXIS_MIN);
    expect(wmax).toBeLessThanOrEqual(AXIS_MAX);
    expect(wmin).toBeLessThan(wmax);
    for (const w of heroConfig.reducedMotion.weights) {
      expect(w).toBeGreaterThanOrEqual(AXIS_MIN);
      expect(w).toBeLessThanOrEqual(AXIS_MAX);
    }
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — cannot resolve `@/lib/hero-config`.

- [ ] **Step 5: Write the config module**

Create `src/lib/hero-config.ts`:

```ts
// Tunable parameters for the hero wordmark animation. Values were dialed in
// live during the 2026-07-10 design session — see
// docs/superpowers/specs/2026-07-10-variable-font-hero-design.md.

export const WORDMARK_TEXT = "Jono Kane";

// TotalBlack Variable's weight-axis bounds (Adobe Fonts kit aqv1jgr).
export const AXIS_MIN = 170;
export const AXIS_MAX = 1000;

export type EaseName =
  | "sineInOut"
  | "cubicInOut"
  | "quintInOut"
  | "expoInOut"
  | "backInOut";
export type FalloffName = "smooth" | "linear" | "sharp";
export type HoverMode = "carve" | "swell";

export interface AmbientConfig {
  duration: number; // ms per weight move
  variancePct: number; // ± tempo randomness per move (0–100)
  hold: number; // avg ms rest at a weight; actual = hold × (0.5 + rand)
  biasPct: number; // % chance a move swings to the opposite extreme
  wmin: number; // weight floor (≥ AXIS_MIN)
  wmax: number; // weight ceiling (≤ AXIS_MAX)
  ease: EaseName;
  staggerMs: number; // per-letter start offset when the loop wakes
}

export interface HoverConfig {
  mode: HoverMode; // carve = cursor thins letters; swell = cursor fattens them
  radius: number; // px influence radius from letter center
  strengthPct: number; // influence at distance 0 (0–100)
  lagMs: number; // exponential smoothing time-constant; 0 = instant
  falloff: FalloffName;
}

export interface HeroConfig {
  ambient: AmbientConfig;
  hover: HoverConfig;
  reducedMotion: {
    // Frozen per-letter weights (spaces excluded) shown under
    // prefers-reduced-motion. One entry per letter of WORDMARK_TEXT.
    weights: number[];
  };
}

export const heroConfig: HeroConfig = {
  ambient: {
    duration: 1800,
    variancePct: 70,
    hold: 950,
    biasPct: 70,
    wmin: 170,
    wmax: 1000,
    ease: "cubicInOut",
    staggerMs: 140,
  },
  hover: {
    mode: "carve",
    radius: 240,
    strengthPct: 100,
    lagMs: 220,
    falloff: "smooth",
  },
  reducedMotion: {
    // J     o    n    o    K    a    n     e
    weights: [1000, 300, 700, 170, 900, 400, 1000, 250],
  },
};
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test`
Expected: 2 passed.

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml src/lib/hero-config.ts src/lib/hero-config.test.ts
git commit -m "feat: hero wordmark config + vitest infrastructure"
```

---

### Task 2: Engine pure math

**Files:**
- Create: `src/lib/wordmark-engine.ts` (pure functions only in this task)
- Create: `src/lib/wordmark-engine.test.ts`

**Interfaces:**
- Consumes: everything from `@/lib/hero-config` (Task 1).
- Produces (exact exports later tasks rely on):
  - `EASES: Record<EaseName, (t: number) => number>`
  - `FALLOFFS: Record<FalloffName, (d: number) => number>`
  - `nextTarget(current: number, cfg: AmbientConfig, random: () => number): number`
  - `moveDuration(cfg: AmbientConfig, random: () => number): number`
  - `restDelay(cfg: AmbientConfig, random: () => number): number`
  - `smoothingFactor(dtMs: number, lagMs: number): number`
  - `rawInfluence(distPx: number, cfg: HoverConfig): number`
  - `blendWeight(ambientW: number, influence: number, mode: HoverMode): number`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/wordmark-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { AmbientConfig, HoverConfig } from "@/lib/hero-config";
import { AXIS_MAX, AXIS_MIN, heroConfig } from "@/lib/hero-config";
import {
  blendWeight,
  EASES,
  FALLOFFS,
  moveDuration,
  nextTarget,
  rawInfluence,
  restDelay,
  smoothingFactor,
} from "@/lib/wordmark-engine";

const ambient: AmbientConfig = { ...heroConfig.ambient };
const hover: HoverConfig = { ...heroConfig.hover };

/** Returns queued values in order, then repeats the last one. */
function seq(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe("EASES", () => {
  it("all pass through 0, 0.5, and 1", () => {
    for (const ease of Object.values(EASES)) {
      expect(ease(0)).toBeCloseTo(0, 5);
      expect(ease(0.5)).toBeCloseTo(0.5, 5);
      expect(ease(1)).toBeCloseTo(1, 5);
    }
  });
});

describe("FALLOFFS", () => {
  it("all are 1 at the center and 0 at the edge", () => {
    for (const falloff of Object.values(FALLOFFS)) {
      expect(falloff(0)).toBeCloseTo(1, 5);
      expect(falloff(1)).toBeCloseTo(0, 5);
    }
  });

  it("sharp decays faster than linear; smooth is 0.5 at midpoint", () => {
    expect(FALLOFFS.sharp(0.5)).toBeLessThan(FALLOFFS.linear(0.5));
    expect(FALLOFFS.smooth(0.5)).toBeCloseTo(0.5, 5);
  });
});

describe("nextTarget", () => {
  it("bias branch swings to the far extreme (jitter 0 at rand 0.5)", () => {
    // 1st rand 0 < biasPct → extreme branch; current 400 is below the
    // midpoint (585), so the far extreme is wmax. 2nd rand 0.5 → zero jitter.
    expect(nextTarget(400, ambient, seq(0, 0.5))).toBe(1000);
  });

  it("uniform branch interpolates the configured range", () => {
    // 1st rand 0.99 ≥ biasPct (0.7) → uniform; 2nd rand 0.5 → midpoint.
    expect(nextTarget(400, ambient, seq(0.99, 0.5))).toBeCloseTo(585, 5);
  });

  it("clamps jittered targets to the font's axis", () => {
    // Extreme branch toward wmax with max positive jitter would overshoot 1000.
    expect(nextTarget(170, ambient, seq(0, 1))).toBe(AXIS_MAX);
  });
});

describe("timing", () => {
  it("moveDuration spans duration × (1 − v/2) … duration × (1 + v/2)", () => {
    expect(moveDuration(ambient, seq(0))).toBeCloseTo(1170, 5); // 1800 × 0.65
    expect(moveDuration(ambient, seq(0.5))).toBeCloseTo(1800, 5);
    expect(moveDuration(ambient, seq(1))).toBeCloseTo(2430, 5); // 1800 × 1.35
  });

  it("restDelay spans hold × 0.5 … hold × 1.5", () => {
    expect(restDelay(ambient, seq(0))).toBeCloseTo(475, 5);
    expect(restDelay(ambient, seq(1))).toBeCloseTo(1425, 5);
  });
});

describe("smoothingFactor", () => {
  it("is 1 when lag is 0 (instant response)", () => {
    expect(smoothingFactor(16.7, 0)).toBe(1);
  });

  it("matches 1 − e^(−dt/lag)", () => {
    expect(smoothingFactor(220, 220)).toBeCloseTo(1 - Math.exp(-1), 5);
  });
});

describe("rawInfluence", () => {
  it("is strength at the center, 0 at/beyond the radius", () => {
    expect(rawInfluence(0, hover)).toBeCloseTo(1, 5); // strengthPct 100
    expect(rawInfluence(hover.radius, hover)).toBe(0);
    expect(rawInfluence(hover.radius * 2, hover)).toBe(0);
  });

  it("scales with strengthPct", () => {
    expect(rawInfluence(0, { ...hover, strengthPct: 40 })).toBeCloseTo(0.4, 5);
  });
});

describe("blendWeight", () => {
  it("carve pulls fully to AXIS_MIN at influence 1", () => {
    expect(blendWeight(800, 1, "carve")).toBe(AXIS_MIN);
  });

  it("swell pulls fully to AXIS_MAX at influence 1", () => {
    expect(blendWeight(300, 1, "swell")).toBe(AXIS_MAX);
  });

  it("influence 0 leaves the ambient weight untouched", () => {
    expect(blendWeight(637, 0, "carve")).toBe(637);
  });

  it("interpolates linearly in between", () => {
    expect(blendWeight(800, 0.5, "carve")).toBeCloseTo((800 + AXIS_MIN) / 2, 5);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — cannot resolve `@/lib/wordmark-engine`.

- [ ] **Step 3: Implement the pure math**

Create `src/lib/wordmark-engine.ts`:

```ts
import {
  AXIS_MAX,
  AXIS_MIN,
  type AmbientConfig,
  type EaseName,
  type FalloffName,
  type HoverConfig,
  type HoverMode,
} from "@/lib/hero-config";

// ---------------------------------------------------------------------------
// Pure math — ported verbatim from the browser prototype validated in the
// 2026-07-10 design session. Change the spec before changing these.
// ---------------------------------------------------------------------------

export const EASES: Record<EaseName, (t: number) => number> = {
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  quintInOut: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  expoInOut: (t) =>
    t === 0 || t === 1
      ? t
      : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2,
  backInOut: (t) => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
  },
};

/** Influence shape across the hover radius; d is normalized distance [0, 1). */
export const FALLOFFS: Record<FalloffName, (d: number) => number> = {
  smooth: (d) => (Math.cos(Math.PI * d) + 1) / 2,
  linear: (d) => 1 - d,
  sharp: (d) => Math.pow(1 - d, 3),
};

const clampToAxis = (w: number) => Math.min(AXIS_MAX, Math.max(AXIS_MIN, w));

/**
 * Pick a letter's next ambient weight target. With probability biasPct the
 * move swings to whichever extreme is farther from the current weight
 * (±4%-of-range jitter) — this is the "contrast bias" drama dial.
 */
export function nextTarget(
  current: number,
  cfg: AmbientConfig,
  random: () => number,
): number {
  const range = cfg.wmax - cfg.wmin;
  let target: number;
  if (random() < cfg.biasPct / 100) {
    const mid = cfg.wmin + range / 2;
    const extreme = current > mid ? cfg.wmin : cfg.wmax;
    target = extreme + (random() - 0.5) * range * 0.08;
  } else {
    target = cfg.wmin + random() * range;
  }
  return clampToAxis(target);
}

export function moveDuration(cfg: AmbientConfig, random: () => number): number {
  const v = cfg.variancePct / 100;
  return cfg.duration * (1 - v / 2 + random() * v);
}

export function restDelay(cfg: AmbientConfig, random: () => number): number {
  return cfg.hold * (0.5 + random());
}

/** Exponential smoothing coefficient for a frame of dtMs; lagMs ≤ 0 = instant. */
export function smoothingFactor(dtMs: number, lagMs: number): number {
  return lagMs <= 0 ? 1 : 1 - Math.exp(-dtMs / lagMs);
}

/** Cursor influence [0, 1] for a letter distPx away from the pointer. */
export function rawInfluence(distPx: number, cfg: HoverConfig): number {
  const d = distPx / cfg.radius;
  if (d >= 1) return 0;
  return FALLOFFS[cfg.falloff](d) * (cfg.strengthPct / 100);
}

/** Blend the ambient weight toward the hover extreme by influence. */
export function blendWeight(
  ambientW: number,
  influence: number,
  mode: HoverMode,
): number {
  const target = mode === "carve" ? AXIS_MIN : AXIS_MAX;
  return clampToAxis(ambientW + (target - ambientW) * influence);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: all pass (config tests + 14 engine math tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/wordmark-engine.ts src/lib/wordmark-engine.test.ts
git commit -m "feat: wordmark engine pure math (eases, falloffs, retarget, blend)"
```

---

### Task 3: Engine core — createWordmarkEngine

**Files:**
- Modify: `src/lib/wordmark-engine.ts` (append engine below the pure math)
- Modify: `src/lib/wordmark-engine.test.ts` (append engine tests)

**Interfaces:**
- Consumes: pure math from Task 2; `gsap` from `@/lib/gsap`.
- Produces:
  - `interface WordmarkEngine { start(): void; stop(): void; tick(nowMs: number): void; setPointer(x: number, y: number): void; clearPointer(): void; updateConfig(patch: Partial<HeroConfig>): void }`
  - `createWordmarkEngine(letterEls: HTMLElement[], config: HeroConfig, random?: () => number): WordmarkEngine`
  - `tick(nowMs)` is public so tests can drive time; `start()` registers a `gsap.ticker` callback that calls it (ticker time is **seconds** → `tick(time * 1000)`).

- [ ] **Step 1: Write the failing engine tests**

Append to `src/lib/wordmark-engine.test.ts` (new imports merge with existing ones):

```ts
import { afterEach, vi } from "vitest";
import { gsap } from "@/lib/gsap";
import { createWordmarkEngine } from "@/lib/wordmark-engine";
import type { HeroConfig } from "@/lib/hero-config";

function makeLetters(n = 8): HTMLElement[] {
  return Array.from({ length: n }, () => {
    const el = document.createElement("span");
    document.body.appendChild(el);
    return el;
  });
}

/** jsdom rects are all zero — pin a letter to a viewport position. */
function mockRect(el: HTMLElement, left: number, top: number, width = 60, height = 80) {
  el.getBoundingClientRect = () =>
    ({
      left, top, width, height,
      right: left + width, bottom: top + height,
      x: left, y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

const readWght = (el: HTMLElement) =>
  parseFloat(el.style.fontVariationSettings.replace(/[^\d.]/g, ""));

/** Constant rand 0.5 → bias branch, zero jitter, dur 1800, rest 950. */
const HALF = () => 0.5;

const baseConfig = (): HeroConfig => structuredClone(heroConfig);

describe("createWordmarkEngine", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("first tick initializes; letters hold 400 until their staggered start", () => {
    const letters = makeLetters();
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.tick(0);
    // With rand=0.5: every letter's first move starts at i×140 + 950 and
    // takes 1800ms toward weight 1000 (bias branch from 400 → far extreme).
    engine.tick(2000);
    expect(readWght(letters[0])).toBeGreaterThan(800); // 58% through its move
    expect(readWght(letters[7])).toBeLessThan(410); // barely started (t0=1930)
  });

  it("letters snap to target and retarget when a move completes", () => {
    const letters = makeLetters(1);
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.tick(0);
    engine.tick(2750); // move 0 ends at 950 + 1800 = 2750 → snap + retarget
    expect(readWght(letters[0])).toBe(1000);
    engine.tick(5500); // next move: 2750 + 950 rest + 1800 dur → back to 170
    expect(readWght(letters[0])).toBe(170);
  });

  it("pointer at a letter's center carves it toward Thin; others untouched", () => {
    const letters = makeLetters(2);
    mockRect(letters[0], 100, 100); // center (130, 140)
    mockRect(letters[1], 5000, 100); // far outside the 240px radius
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.tick(0);
    engine.setPointer(130, 140);
    for (let t = 16; t <= 3000; t += 16) engine.tick(t); // let lag settle
    expect(readWght(letters[0])).toBeLessThan(200); // fully carved
    expect(readWght(letters[1])).toBeGreaterThan(300); // ambient only
  });

  it("clearPointer releases the carve back to ambient", () => {
    const letters = makeLetters(1);
    mockRect(letters[0], 100, 100);
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.tick(0);
    engine.setPointer(130, 140);
    for (let t = 16; t <= 2000; t += 16) engine.tick(t);
    expect(readWght(letters[0])).toBeLessThan(200);
    engine.clearPointer();
    for (let t = 2016; t <= 4000; t += 16) engine.tick(t);
    expect(readWght(letters[0])).toBeGreaterThan(300);
  });

  it("start registers one gsap.ticker callback (idempotent); stop removes the same one", () => {
    const add = vi.spyOn(gsap.ticker, "add");
    const remove = vi.spyOn(gsap.ticker, "remove");
    const engine = createWordmarkEngine(makeLetters(1), baseConfig(), HALF);
    engine.start();
    engine.start();
    expect(add).toHaveBeenCalledTimes(1);
    engine.stop();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0][0]).toBe(add.mock.calls[0][0]);
  });

  it("the ticker callback converts seconds to ms", () => {
    const add = vi.spyOn(gsap.ticker, "add");
    const letters = makeLetters(1);
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.start();
    const tickerFn = add.mock.calls[0][0] as (time: number) => void;
    tickerFn(0);
    tickerFn(2.75); // 2750ms → first move complete → weight 1000
    expect(readWght(letters[0])).toBe(1000);
    engine.stop();
  });

  it("updateConfig switches hover mode live", () => {
    const letters = makeLetters(1);
    mockRect(letters[0], 100, 100);
    const engine = createWordmarkEngine(letters, baseConfig(), HALF);
    engine.tick(0);
    engine.setPointer(130, 140);
    engine.updateConfig({ hover: { ...baseConfig().hover, mode: "swell" } });
    for (let t = 16; t <= 3000; t += 16) engine.tick(t);
    expect(readWght(letters[0])).toBeGreaterThan(900); // swelled, not carved
  });
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `pnpm test`
Expected: FAIL — `createWordmarkEngine` is not exported. (Task 2 tests still pass.)

- [ ] **Step 3: Implement the engine**

Append to `src/lib/wordmark-engine.ts` (add `HeroConfig` to the existing type imports from `@/lib/hero-config`, and add `import { gsap } from "@/lib/gsap";` at the top):

```ts
// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface LetterState {
  el: HTMLElement;
  from: number;
  to: number;
  t0: number; // ms timestamp the current move starts
  dur: number; // ms length of the current move
  ambientW: number;
  influence: number; // smoothed cursor influence [0, 1]
}

export interface WordmarkEngine {
  /** Register on gsap.ticker (idempotent). */
  start(): void;
  /** Unregister from gsap.ticker (idempotent). Safe to start() again. */
  stop(): void;
  /** Advance to an absolute time in ms. start() drives this from the ticker;
   *  exposed so tests can drive time deterministically. */
  tick(nowMs: number): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  /** Live-patch config (tune panel). Ambient changes apply from the next
   *  retarget; hover changes apply immediately. */
  updateConfig(patch: Partial<HeroConfig>): void;
}

export function createWordmarkEngine(
  letterEls: HTMLElement[],
  config: HeroConfig,
  random: () => number = Math.random,
): WordmarkEngine {
  let cfg: HeroConfig = structuredClone(config);
  let states: LetterState[] | null = null;
  let pointer: { x: number; y: number } | null = null;
  let lastNow: number | null = null;
  let tickerFn: ((time: number) => void) | null = null;

  function retargetState(s: LetterState, nowMs: number) {
    s.from = s.to;
    s.to = nextTarget(s.from, cfg.ambient, random);
    s.dur = moveDuration(cfg.ambient, random);
    s.t0 = nowMs + restDelay(cfg.ambient, random);
  }

  function init(nowMs: number) {
    states = letterEls.map((el, i) => ({
      el,
      from: 400,
      to: 400,
      t0: nowMs + i * cfg.ambient.staggerMs,
      dur: 1,
      ambientW: 400,
      influence: 0,
    }));
    for (const s of states) retargetState(s, s.t0);
  }

  function tick(nowMs: number) {
    if (states === null) init(nowMs);
    const dt = lastNow === null ? 16.7 : Math.min(64, Math.max(0, nowMs - lastNow));
    lastNow = nowMs;
    const ease = EASES[cfg.ambient.ease];

    for (const s of states!) {
      // 1. Advance the ambient move.
      const p = (nowMs - s.t0) / s.dur;
      if (p >= 1) {
        s.ambientW = s.to;
        retargetState(s, nowMs);
      } else if (p >= 0) {
        s.ambientW = s.from + (s.to - s.from) * ease(p);
      }

      // 2. Raw cursor influence from pointer→letter-center distance.
      let raw = 0;
      if (pointer) {
        const r = s.el.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        raw = rawInfluence(Math.hypot(dx, dy), cfg.hover);
      }

      // 3. Smooth influence toward raw (the "liquid" lag).
      s.influence += (raw - s.influence) * smoothingFactor(dt, cfg.hover.lagMs);

      // 4. Blend and write. One inline-style write per letter per frame.
      const w = blendWeight(s.ambientW, s.influence, cfg.hover.mode);
      s.el.style.fontVariationSettings = `'wght' ${w}`;
    }
  }

  return {
    start() {
      if (tickerFn) return;
      lastNow = null;
      tickerFn = (time: number) => tick(time * 1000); // gsap.ticker time is seconds
      gsap.ticker.add(tickerFn);
    },
    stop() {
      if (!tickerFn) return;
      gsap.ticker.remove(tickerFn);
      tickerFn = null;
    },
    tick,
    setPointer(x: number, y: number) {
      pointer = { x, y };
    },
    clearPointer() {
      pointer = null;
    },
    updateConfig(patch: Partial<HeroConfig>) {
      cfg = {
        ambient: { ...cfg.ambient, ...patch.ambient },
        hover: { ...cfg.hover, ...patch.hover },
        reducedMotion: patch.reducedMotion ?? cfg.reducedMotion,
      };
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: all pass (config + math + 7 engine tests).

- [ ] **Step 5: Verify the app still builds**

Run: `pnpm build`
Expected: clean build (engine module is not yet imported by app code, but must typecheck).

- [ ] **Step 6: Commit**

```bash
git add src/lib/wordmark-engine.ts src/lib/wordmark-engine.test.ts
git commit -m "feat: wordmark engine core on the shared GSAP ticker"
```

---

### Task 4: Font wiring — Typekit links + theme token

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: the `font-wordmark` Tailwind utility class and the loaded `"totalblack-variable"` webfont, both consumed by Task 6.

- [ ] **Step 1: Add Typekit links to the root layout**

In `src/app/layout.tsx`, inside the returned `<html>` element, directly above `<body …>`, add (React 19 hoists `<link>` elements into `<head>`; the stylesheet needs the `precedence` prop to be managed):

```tsx
      <link rel="preconnect" href="https://use.typekit.net" />
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://use.typekit.net/aqv1jgr.css"
        precedence="default"
      />
```

(Two preconnects: the CSS fetch is no-CORS, the font fetch is CORS — each warms its own connection type.)

- [ ] **Step 2: Add the wordmark font token**

In `src/app/globals.css`, inside the existing `@theme inline` block, after `--font-mono`:

```css
  --font-wordmark: "totalblack-variable", var(--font-geist-sans), sans-serif;
```

- [ ] **Step 3: Verify in the browser**

Run: `pnpm dev`, open http://localhost:3000, check DevTools → Network:
- `aqv1jgr.css` loads with status 200.
- A font file from `use.typekit.net` loads (may require an element using the family — if none yet, just confirm the CSS loaded; the font request appears in Task 6).

**If the CSS or font 403s/404s:** the Adobe Fonts kit's domain list is missing `localhost` — Jono must add `localhost`, `*.vercel.app`, and `jonokane.com` in Adobe Fonts kit settings (kit `aqv1jgr`). Flag this and pause the task until fixed.

- [ ] **Step 4: Build and commit**

Run: `pnpm build` — expected clean.

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat: load TotalBlack Variable from Adobe Fonts, add font-wordmark token"
```

---

### Task 5: Dev-only tune panel

**Files:**
- Create: `src/components/wordmark-tune-panel.tsx`

**Interfaces:**
- Consumes: types + `AXIS_MIN`/`AXIS_MAX` from `@/lib/hero-config`.
- Produces: `WordmarkTunePanel(props: { initial: HeroConfig; onChange: (patch: Partial<HeroConfig>) => void })` — Task 6 renders it behind a `NODE_ENV === "development"` gate and forwards `onChange` to `engine.updateConfig`.

- [ ] **Step 1: Write the component**

Create `src/components/wordmark-tune-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  AXIS_MAX,
  AXIS_MIN,
  type EaseName,
  type FalloffName,
  type HeroConfig,
  type HoverMode,
} from "@/lib/hero-config";

const EASE_NAMES: readonly EaseName[] = [
  "sineInOut",
  "cubicInOut",
  "quintInOut",
  "expoInOut",
  "backInOut",
];
const FALLOFF_NAMES: readonly FalloffName[] = ["smooth", "linear", "sharp"];
const HOVER_MODES: readonly HoverMode[] = ["carve", "swell"];

function Row(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onInput: (v: number) => void;
}) {
  const { label, value, min, max, step, format, onInput } = props;
  return (
    <label className="block text-[11px]">
      <span className="flex justify-between text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-200">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onInput(Number(e.target.value))}
        className="w-full accent-emerald-400"
      />
    </label>
  );
}

function Select<T extends string>(props: {
  label: string;
  value: T;
  options: readonly T[];
  onSelect: (v: T) => void;
}) {
  return (
    <label className="block text-[11px]">
      <span className="text-zinc-400">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onSelect(e.target.value as T)}
        className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-zinc-200"
      >
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Dev-only floating tuning panel for the hero wordmark. Only ever rendered
 * behind a NODE_ENV === "development" gate (see hero-wordmark.tsx), so it is
 * dead-code-eliminated from production builds.
 */
export function WordmarkTunePanel({
  initial,
  onChange,
}: {
  initial: HeroConfig;
  onChange: (patch: Partial<HeroConfig>) => void;
}) {
  const [cfg, setCfg] = useState<HeroConfig>(() => structuredClone(initial));
  const [copied, setCopied] = useState(false);

  function update(patch: {
    ambient?: Partial<HeroConfig["ambient"]>;
    hover?: Partial<HeroConfig["hover"]>;
  }) {
    const next: HeroConfig = {
      ...cfg,
      ambient: { ...cfg.ambient, ...patch.ambient },
      hover: { ...cfg.hover, ...patch.hover },
    };
    setCfg(next);
    onChange(next);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-h-[80vh] w-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
        Wordmark tune
      </p>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Ambient</p>
      <Row label="duration" value={cfg.ambient.duration} min={400} max={5000} step={50}
        format={(v) => (v / 1000).toFixed(2) + "s"}
        onInput={(v) => update({ ambient: { duration: v } })} />
      <Row label="variance" value={cfg.ambient.variancePct} min={0} max={100} step={5}
        format={(v) => "±" + v + "%"}
        onInput={(v) => update({ ambient: { variancePct: v } })} />
      <Row label="hold" value={cfg.ambient.hold} min={0} max={2500} step={50}
        format={(v) => (v / 1000).toFixed(2) + "s"}
        onInput={(v) => update({ ambient: { hold: v } })} />
      <Row label="contrast bias" value={cfg.ambient.biasPct} min={0} max={100} step={5}
        format={(v) => v + "%"}
        onInput={(v) => update({ ambient: { biasPct: v } })} />
      <Row label="weight floor" value={cfg.ambient.wmin} min={AXIS_MIN} max={900} step={10}
        onInput={(v) =>
          update({ ambient: { wmin: v, wmax: Math.max(cfg.ambient.wmax, v + 100) } })
        } />
      <Row label="weight ceiling" value={cfg.ambient.wmax} min={270} max={AXIS_MAX} step={10}
        onInput={(v) =>
          update({ ambient: { wmax: v, wmin: Math.min(cfg.ambient.wmin, v - 100) } })
        } />
      <Row label="stagger" value={cfg.ambient.staggerMs} min={0} max={500} step={10}
        format={(v) => v + "ms"}
        onInput={(v) => update({ ambient: { staggerMs: v } })} />
      <Select label="ease" value={cfg.ambient.ease} options={EASE_NAMES}
        onSelect={(v) => update({ ambient: { ease: v } })} />

      <p className="pt-1 text-[10px] uppercase tracking-wider text-zinc-500">Cursor</p>
      <Select label="mode" value={cfg.hover.mode} options={HOVER_MODES}
        onSelect={(v) => update({ hover: { mode: v } })} />
      <Row label="radius" value={cfg.hover.radius} min={50} max={450} step={10}
        format={(v) => v + "px"}
        onInput={(v) => update({ hover: { radius: v } })} />
      <Row label="strength" value={cfg.hover.strengthPct} min={0} max={100} step={5}
        format={(v) => v + "%"}
        onInput={(v) => update({ hover: { strengthPct: v } })} />
      <Row label="lag" value={cfg.hover.lagMs} min={0} max={800} step={20}
        format={(v) => v + "ms"}
        onInput={(v) => update({ hover: { lagMs: v } })} />
      <Select label="falloff" value={cfg.hover.falloff} options={FALLOFF_NAMES}
        onSelect={(v) => update({ hover: { falloff: v } })} />

      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="w-full rounded bg-emerald-500 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
      >
        {copied ? "✓ copied — paste into hero-config.ts" : "copy config JSON"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks and lints**

Run: `pnpm build && pnpm lint`
Expected: clean (component not yet rendered anywhere — visual check happens in Task 6).

- [ ] **Step 3: Commit**

```bash
git add src/components/wordmark-tune-panel.tsx
git commit -m "feat: dev-only wordmark tune panel"
```

---

### Task 6: HeroWordmark component + page integration

**Files:**
- Create: `src/components/hero-wordmark.tsx`
- Modify: `src/app/page.tsx:23-30` (the `motion.h1` block)

**Interfaces:**
- Consumes: `createWordmarkEngine`/`WordmarkEngine` (Task 3), `heroConfig`/`WORDMARK_TEXT` (Task 1), `WordmarkTunePanel` (Task 5), `font-wordmark` class (Task 4).
- Produces: `HeroWordmark({ className }: { className?: string })` rendered by the homepage.

- [ ] **Step 1: Write the component**

Create `src/components/hero-wordmark.tsx`:

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { heroConfig, WORDMARK_TEXT } from "@/lib/hero-config";
import {
  createWordmarkEngine,
  type WordmarkEngine,
} from "@/lib/wordmark-engine";
import { WordmarkTunePanel } from "@/components/wordmark-tune-panel";

const entranceEase = [0.22, 1, 0.36, 1] as const;
const FONT_LOAD_SPEC = '400 1rem "totalblack-variable"';
const FONT_TIMEOUT_MS = 3000;

type FontState = "loading" | "ready" | "fallback";

// Letters with their index into reducedMotion.weights (spaces excluded).
const GLYPHS = (() => {
  let li = 0;
  return WORDMARK_TEXT.split("").map((ch) =>
    ch === " "
      ? { ch, letterIndex: null }
      : { ch, letterIndex: li++ },
  );
})();

/**
 * The hero wordmark: each letter of TotalBlack Variable drifts through the
 * weight axis (ambient loop) and thins under the cursor (carve). The engine
 * runs on the shared GSAP ticker; this component owns gating and lifecycle.
 * See docs/superpowers/specs/2026-07-10-variable-font-hero-design.md.
 */
export function HeroWordmark({ className }: { className?: string }) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const engineRef = useRef<WordmarkEngine | null>(null);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [entranceDone, setEntranceDone] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;

  // The wordmark must never appear in a fallback font mid-animation: stay
  // invisible until the webfont is confirmed, and give up after ~3s.
  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise<"fallback">((resolve) =>
      setTimeout(() => resolve("fallback"), FONT_TIMEOUT_MS),
    );
    const load = document.fonts
      .load(FONT_LOAD_SPEC)
      .then((faces): FontState => (faces.length > 0 ? "ready" : "fallback"))
      .catch((): FontState => "fallback");
    Promise.race([load, timeout]).then((state) => {
      if (!cancelled) setFontState(state === "ready" ? "ready" : "fallback");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Engine lifecycle: font in, entrance done, and the visitor is OK with motion.
  useEffect(() => {
    if (fontState !== "ready" || !entranceDone || reducedMotion) return;
    const h1 = h1Ref.current;
    if (!h1) return;

    const letters = Array.from(h1.querySelectorAll<HTMLElement>("[data-letter]"));
    const engine = createWordmarkEngine(letters, heroConfig);
    engineRef.current = engine;

    // Pause while the hero is off-screen so it never competes with scroll
    // choreography further down the page.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) engine.start();
      else engine.stop();
    });
    io.observe(h1);

    // Cursor layer only where a cursor exists; ambient-only on touch.
    const canHover = window.matchMedia("(hover: hover)").matches;
    const onMove = (e: PointerEvent) => engine.setPointer(e.clientX, e.clientY);
    const onLeave = () => engine.clearPointer();
    if (canHover) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      io.disconnect();
      if (canHover) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      engine.stop();
      engineRef.current = null;
    };
  }, [fontState, entranceDone, reducedMotion]);

  const visible = fontState !== "loading";

  return (
    <>
      <motion.h1
        ref={h1Ref}
        aria-label={WORDMARK_TEXT}
        className={`font-wordmark ${className ?? ""}`}
        initial={{ opacity: 0, y: 24 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.8, ease: entranceEase, delay: 0.08 }
        }
        onAnimationComplete={() => {
          if (visible) setEntranceDone(true);
        }}
      >
        {GLYPHS.map(({ ch, letterIndex }, i) =>
          letterIndex === null ? (
            <span key={i} aria-hidden="true" className="inline-block w-[0.32em]" />
          ) : (
            <span
              key={i}
              data-letter
              aria-hidden="true"
              style={
                fontState === "fallback"
                  ? undefined
                  : {
                      fontVariationSettings: `'wght' ${
                        reducedMotion
                          ? (heroConfig.reducedMotion.weights[letterIndex] ?? 400)
                          : 400
                      }`,
                    }
              }
            >
              {ch}
            </span>
          ),
        )}
      </motion.h1>
      {process.env.NODE_ENV === "development" && (
        <WordmarkTunePanel
          initial={heroConfig}
          onChange={(patch) => engineRef.current?.updateConfig(patch)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Swap the hero h1 in the homepage**

In `src/app/page.tsx`, add the import:

```tsx
import { HeroWordmark } from "@/components/hero-wordmark";
```

Replace the entire `motion.h1` block (lines 23–30):

```tsx
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.08 }}
            className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
          >
            Jono Kane
          </motion.h1>
```

with:

```tsx
          <HeroWordmark className="mt-6 text-5xl leading-[1.05] sm:text-7xl lg:text-8xl" />
```

(`font-semibold` and `tracking-tight` are deliberately dropped: weight now belongs to the animation, and tight tracking would collide glyphs at Display 1000.)

- [ ] **Step 3: Verify in the browser**

Run: `pnpm dev`, open http://localhost:3000. Check:

1. Wordmark appears in TotalBlack (dramatic weight contrast, not Geist), after the fade/rise entrance.
2. Letters begin drifting between weights after the entrance; the word breathes horizontally.
3. Moving the cursor across the wordmark thins letters near it (carve) with a liquid lag; leaving releases them.
4. The tune panel appears bottom-right; dragging "contrast bias" to 0 visibly calms the animation; "copy config JSON" fills the clipboard.
5. No console errors.

- [ ] **Step 4: Run the full check suite**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero-wordmark.tsx src/app/page.tsx
git commit -m "feat: living variable-font hero wordmark"
```

---

### Task 7: PLAN.md update + final verification sweep

**Files:**
- Modify: `PLAN.md`

**Interfaces:** none — documentation + verification.

- [ ] **Step 1: Update PLAN.md**

Three edits:

1. In **Current state**, replace:

```markdown
**Not yet built:** shared nav/header/footer, About/contact, real content, a real design system beyond defaults, and the 3D hero (still a text placeholder).
```

with:

```markdown
**Not yet built:** shared nav/header/footer, About/contact, real content, and a real design system beyond defaults. The hero is built: a living variable-font wordmark (see `docs/superpowers/specs/2026-07-10-variable-font-hero-design.md`).
```

2. Replace the **Open decisions** bullet:

```markdown
- **3D hero engine.** Leaning **React Three Fiber** over Spline (lighter bundle, more control). Deferred — nothing 3D installed yet. Decide and install only once the hero concept is designed, so the tool fits the vision rather than the reverse.
```

with:

```markdown
- **3D hero layer.** Parked. The hero concept is decided and shipped as the animated variable-font wordmark; a 3D layer (likely React Three Fiber) remains a possible future evolution *behind* the wordmark. Nothing 3D is installed.
```

3. In **Roadmap**, replace item 5:

```markdown
5. **The hero** — design the "wow" concept, then pick and install the 3D engine (likely R3F), then build it.
```

with:

```markdown
5. **The hero** — done 2026-07-10: animated variable-font wordmark in TotalBlack Variable (ambient weight loop + cursor carve), tunable via dev panel. Spec: `docs/superpowers/specs/2026-07-10-variable-font-hero-design.md`.
```

- [ ] **Step 2: Full verification sweep**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all clean.

Browser checklist (dev server):
- [ ] Ambient feel matches the approved playground settings (deliberate, desynchronized, dramatic swings).
- [ ] Carve interaction: 240px reach, full carve under cursor, liquid ~220ms trail.
- [ ] DevTools device emulation (touch): no cursor effect, ambient still runs.
- [ ] DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, reload: static mixed-weight wordmark, zero movement.
- [ ] DevTools → Network → block `use.typekit.net`, reload: after ~3s the name appears static in Geist, no animation, no broken flash.
- [ ] Scroll the hero fully out of view: engine stops (confirm via Performance panel or a temporary `console.log` in `tick` — remove it after).

- [ ] **Step 3: Remind Jono (human action item)**

Confirm with Jono that the Adobe Fonts kit `aqv1jgr` domain list includes `localhost`, `*.vercel.app`, and `jonokane.com` — production will 403 otherwise.

- [ ] **Step 4: Commit**

```bash
git add PLAN.md
git commit -m "docs: hero decided — variable-font wordmark shipped, 3D parked"
```
