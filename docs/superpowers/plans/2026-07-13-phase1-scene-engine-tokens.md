# Phase 1: Scene Engine, Design Tokens & Type System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The living time-of-day sky renders behind `/` — 8 keyframed scenes sampled from the visitor's clock, driving ~24 CSS design tokens that recolor the whole interface — plus the Mae type system, the frosted-slab/pill component classes, a visitor time scrubber, and a dev `?tune` palette panel.

**Architecture:** A pure, unit-tested math module (`scene-engine.ts`) samples keyframes (`scene-config.ts`) and derives tokens; a thin client provider writes them to `:root` once a minute (no per-frame work, no RAF). Sky layers are small React components animated by plain CSS keyframes in a CSS module. Spec: `docs/superpowers/specs/2026-07-11-site-experience-design.md` §3, §4, §12, §15.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 (CSS-first), vitest + jsdom. No new dependencies.

## Global Constraints

- **pnpm only** — never npm/yarn (CLAUDE.md).
- **Fonts are CDN-only** from Typekit kit `aqv1jgr` — never download or self-host font files (spec §4). `mae-variable` is already served by the kit stylesheet loaded in `src/app/layout.tsx`.
- **No new RAF loops** (CLAUDE.md one-loop rule). Phase 1 uses zero RAF: CSS animations + a 60-second interval only.
- **Scene keyframe values are locked** — copy the JSON in spec §3.1 verbatim, all 8 keyframes, every hex and weight exactly.
- **Token formulas are locked** (spec §3.2): `surface = mix(top, inkLight ? #07091a : #f8fafe, 0.6)`; `scrim = surface + "94"`; `cardBg = inkLight ? rgba(10,13,28,.55) : rgba(255,255,255,.62)`; `cardBorder = inkLight ? rgba(255,255,255,.15) : rgba(12,24,48,.13)`; `textGlow = inkLight ? rgba(4,7,18,.55) : rgba(255,255,255,.5)`; `elev = inkLight ? rgba(3,6,16,.5) : rgba(25,50,95,.28)`; `coverA = mid`, `coverB = hor`; `inkLight = luminance(ink) > 0.5`.
- **Type system** (spec §4): Mae variable for display and body; base weights `--dw: 180`, `--bw: 140`; role weights are `calc(var(--dw) + N)` offsets.
- **Code organization** (spec §15, binding): content/tunables in typed config modules, never in JSX; design decisions in CSS custom properties + `@theme`; repeated patterns become `@layer components` classes (`.slab`, `.pill`, …), utilities only for one-off layout; semantic markup; one component per file; pure math in unit-tested engine modules (the `wordmark-engine.ts` house style).
- **SSR/hydration safety**: no `Math.random()` in render paths (seeded PRNG only); no client-only values in the server render (post-mount effects only — the `mounted`-guard pattern from `hero-wordmark.tsx`).
- **Reduced motion** (spec §12): correct scene colors, static gradient — element animations off, birds hidden.
- **Do not touch** the existing hero (`hero-wordmark.tsx`, `wordmark-engine.ts`) — it is replaced in Phase 2, not here.
- Run `pnpm build` and `pnpm test` before every commit; baseline suite must stay green.

## File Structure

```
src/lib/scene-config.ts              8 locked keyframes + SceneKeyframe type (content/config, no logic)
src/lib/scene-engine.ts              pure math: sample, tokens, celestial positions, root writer
src/lib/scene-engine.test.ts         unit tests for all engine math
src/lib/seeded-random.ts             mulberry32 PRNG (hydration-safe randomness)
src/lib/seeded-random.test.ts
src/components/sky/scene-provider.tsx  client context: clock, scrub/resume, keyframe overrides
src/components/sky/sky.tsx             fixed background compositor (gradient + layers)
src/components/sky/sky.module.css      all sky visuals: layers, keyframes, reduced-motion
src/components/sky/stars.tsx           star + sparkle field (seeded)
src/components/sky/clouds.tsx          crisp vector clouds
src/components/sky/rays.tsx            "wash" god rays anchored to the sun
src/components/sky/sun-moon.tsx        sun + moon discs on token-driven positions
src/components/sky/birds.tsx           two flapping birds
src/components/sky/time-scrubber.tsx   visitor-facing time control
src/components/sky/scene-tune-panel.tsx  dev-only ?tune palette editor
src/app/globals.css                  MODIFY: scene token defaults, @theme mappings, component classes, Mae body type
src/app/page.tsx                     MODIFY: mount SceneProvider + Sky + TimeScrubber + tune gate
CLAUDE.md                            MODIFY: document scene system + ?tune
```

---

### Task 1: Scene config + sampling math

**Files:**
- Create: `src/lib/scene-config.ts`
- Create: `src/lib/scene-engine.ts`
- Test: `src/lib/scene-engine.test.ts`

**Interfaces:**
- Consumes: nothing (foundation task).
- Produces: `SceneKeyframe`, `SCENE_KEYFRAMES` (from scene-config); `sampleScene(hour, keyframes?) => SceneSample`, `mixHex(a, b, t) => string`, `luminance(hex) => number`, `smoothstep(t) => number`, `hourFromDate(date) => number` (from scene-engine). `SceneSample` has all `SceneKeyframe` color/weight fields plus `from`, `to`, `t`.

- [ ] **Step 1: Write the config module** (content first — it's data, no logic, no test needed beyond the engine tests consuming it)

```ts
// src/lib/scene-config.ts

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
  clouds: number;
  birds: number;
  sun: number;
  moon: number;
}

/**
 * The 8 scenes of the day, tuned interactively during the 2026-07 design
 * prototyping. Values are locked by the spec (§3.1) — change them via the
 * dev tune panel (`?tune`), not by hand-editing mid-implementation.
 */
export const SCENE_KEYFRAMES: readonly SceneKeyframe[] = [
  { h: 0.0,  name: "Midnight",    top: "#050818", mid: "#16173f", hor: "#2c4a78", ink: "#edf2ff", sub: "#a9b6e6", stars: 1,    rays: 0,    clouds: 0,    birds: 0,    sun: 0,    moon: 1 },
  { h: 4.7,  name: "Night's end", top: "#090b22", mid: "#251b4e", hor: "#513668", ink: "#f1ecff", sub: "#bfaede", stars: 0.75, rays: 0.2,  clouds: 0,    birds: 0,    sun: 0,    moon: 0.5 },
  { h: 6.0,  name: "Dawn",        top: "#32204e", mid: "#8a4a6a", hor: "#f7a75d", ink: "#fff3e3", sub: "#f5cda6", stars: 0.2,  rays: 1,    clouds: 0.15, birds: 0.1,  sun: 0.25, moon: 0 },
  { h: 8.0,  name: "Morning",     top: "#4e93d9", mid: "#8ec6ee", hor: "#ffe7bd", ink: "#123252", sub: "#33608a", stars: 0,    rays: 0.3,  clouds: 0.55, birds: 0.6,  sun: 0.75, moon: 0 },
  { h: 12.5, name: "Midday",      top: "#3e9bf4", mid: "#7fc6fb", hor: "#d3efff", ink: "#0e3a63", sub: "#2f6292", stars: 0,    rays: 0,    clouds: 1,    birds: 0.9,  sun: 1,    moon: 0 },
  { h: 17.8, name: "Golden hour", top: "#5f7cc0", mid: "#ec9c66", hor: "#ffd47e", ink: "#45230f", sub: "#7b4a26", stars: 0,    rays: 0.4,  clouds: 0.6,  birds: 0.4,  sun: 0.55, moon: 0 },
  { h: 19.8, name: "Dusk",        top: "#2d2a67", mid: "#7d4b90", hor: "#e87f8b", ink: "#ffeaf0", sub: "#dcb6d8", stars: 0.45, rays: 0.12, clouds: 0.3,  birds: 0.05, sun: 0.08, moon: 0.25 },
  { h: 21.5, name: "Evening",     top: "#0d1132", mid: "#2d2363", hor: "#4b5099", ink: "#eef1ff", sub: "#adb3e6", stars: 0.9,  rays: 0,    clouds: 0.08, birds: 0,    sun: 0,    moon: 0.7 },
];
```

- [ ] **Step 2: Write the failing engine tests**

```ts
// src/lib/scene-engine.test.ts
import { describe, expect, it } from "vitest";
import {
  hourFromDate,
  luminance,
  mixHex,
  sampleScene,
  smoothstep,
} from "@/lib/scene-engine";

describe("mixHex", () => {
  it("returns endpoints at t=0 and t=1", () => {
    expect(mixHex("#050818", "#ffffff", 0)).toBe("#050818");
    expect(mixHex("#050818", "#ffffff", 1)).toBe("#ffffff");
  });
  it("blends channels linearly", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});

describe("luminance", () => {
  it("is 0 for black and ~1 for white", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("smoothstep", () => {
  it("clamps and eases", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 5);
    expect(smoothstep(0.25)).toBeLessThan(0.25); // ease-in at the start
  });
});

describe("sampleScene", () => {
  it("returns exact keyframe values at a keyframe hour", () => {
    const s = sampleScene(12.5);
    expect(s.from.name).toBe("Midday");
    expect(s.t).toBe(0);
    expect(s.top).toBe("#3e9bf4");
    expect(s.clouds).toBe(1);
  });

  it("blends between neighboring keyframes at the midpoint", () => {
    // 10.25 is halfway between Morning (8.0) and Midday (12.5)
    const s = sampleScene(10.25);
    expect(s.from.name).toBe("Morning");
    expect(s.to.name).toBe("Midday");
    expect(s.t).toBeCloseTo(0.5, 5);
    expect(s.top).toBe(mixHex("#4e93d9", "#3e9bf4", 0.5));
    expect(s.sun).toBeCloseTo(0.875, 5); // lerp(0.75, 1, 0.5)
  });

  it("wraps across midnight (Evening 21.5 → Midnight 24.0)", () => {
    const s = sampleScene(23.0);
    expect(s.from.name).toBe("Evening");
    expect(s.to.name).toBe("Midnight");
    expect(s.t).toBeCloseTo(smoothstep(1.5 / 2.5), 5);
  });

  it("covers the pre-dawn wrap segment (0 ≤ h < first keyframe handled by wrap)", () => {
    const s = sampleScene(2.0);
    expect(s.from.name).toBe("Midnight");
    expect(s.to.name).toBe("Night's end");
  });

  it("normalizes out-of-range hours", () => {
    expect(sampleScene(25).top).toBe(sampleScene(1).top);
    expect(sampleScene(-1).top).toBe(sampleScene(23).top);
  });
});

describe("hourFromDate", () => {
  it("converts local time to fractional hours", () => {
    expect(hourFromDate(new Date(2026, 0, 1, 14, 30))).toBeCloseTo(14.5, 5);
    expect(hourFromDate(new Date(2026, 0, 1, 0, 0))).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- src/lib/scene-engine.test.ts`
Expected: FAIL — `Cannot find module '@/lib/scene-engine'` (or equivalent resolve error).

- [ ] **Step 4: Write the engine sampling math**

```ts
// src/lib/scene-engine.ts

/**
 * Pure math for the time-of-day scene system (spec §3). No DOM access in
 * the sampling functions; `applySceneToRoot` (Task 2) is the only writer.
 * House style follows wordmark-engine.ts: framework-agnostic, unit-tested.
 */
import { SCENE_KEYFRAMES, type SceneKeyframe } from "@/lib/scene-config";

export interface SceneSample {
  top: string;
  mid: string;
  hor: string;
  ink: string;
  sub: string;
  stars: number;
  rays: number;
  clouds: number;
  birds: number;
  sun: number;
  moon: number;
  from: SceneKeyframe;
  to: SceneKeyframe;
  t: number;
}

const COLOR_KEYS = ["top", "mid", "hor", "ink", "sub"] as const;
const WEIGHT_KEYS = ["stars", "rays", "clouds", "birds", "sun", "moon"] as const;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
}

/** Relative luminance approximation on 0–1 (sufficient for the light/dark ink test). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Clamped smoothstep — the easing between scene keyframes. */
export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Local wall-clock time as fractional hours (14:30 → 14.5). */
export function hourFromDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/** Sample the scene at `hour`, blending between the two surrounding keyframes (wraps midnight). */
export function sampleScene(
  hour: number,
  keyframes: readonly SceneKeyframe[] = SCENE_KEYFRAMES,
): SceneSample {
  const h = ((hour % 24) + 24) % 24;
  const kfs = [...keyframes].sort((a, b) => a.h - b.h);
  let from = kfs[kfs.length - 1];
  let to = kfs[0];
  for (let i = 0; i < kfs.length; i++) {
    if (kfs[i].h <= h) {
      from = kfs[i];
      to = kfs[(i + 1) % kfs.length];
    }
  }
  const span = (to.h - from.h + 24) % 24 || 24;
  const t = smoothstep(((h - from.h + 24) % 24) / span);

  const sample = { from, to, t } as SceneSample;
  for (const k of COLOR_KEYS) sample[k] = mixHex(from[k], to[k], t);
  for (const k of WEIGHT_KEYS) sample[k] = lerp(from[k], to[k], t);
  return sample;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test -- src/lib/scene-engine.test.ts`
Expected: PASS (all describes green).

- [ ] **Step 6: Run the full suite and build**

Run: `pnpm test && pnpm build`
Expected: existing suite + new tests green; build clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/scene-config.ts src/lib/scene-engine.ts src/lib/scene-engine.test.ts
git commit -m "feat: scene keyframes + sampling engine (time-of-day math)"
```

---

### Task 2: Token derivation, celestial positions, root writer

**Files:**
- Modify: `src/lib/scene-engine.ts` (append)
- Test: `src/lib/scene-engine.test.ts` (append)

**Interfaces:**
- Consumes: `sampleScene`, `SceneSample`, `mixHex`, `luminance`, `lerp` (Task 1).
- Produces: `SceneTokens` interface; `deriveTokens(s: SceneSample) => SceneTokens`; `sunPosition(hour) => { xVw: number; yVh: number }`; `moonPosition(hour) => { xVw: number; yVh: number; visible: boolean }`; `applySceneToRoot(root: HTMLElement, hour: number, keyframes?) => void` writing the CSS custom properties listed in Step 3 — later tasks and phases rely on those exact var names.

- [ ] **Step 1: Write the failing tests** (append to `src/lib/scene-engine.test.ts`; extend the import to include `deriveTokens`, `sunPosition`, `moonPosition`, `applySceneToRoot`)

```ts
describe("deriveTokens", () => {
  it("derives dark-scene tokens at Midnight (light ink)", () => {
    const tk = deriveTokens(sampleScene(0));
    expect(tk.inkLight).toBe(true);
    expect(tk.surface).toBe(mixHex("#050818", "#07091a", 0.6));
    expect(tk.scrim).toBe(tk.surface + "94");
    expect(tk.cardBg).toBe("rgba(10,13,28,.55)");
    expect(tk.cardBorder).toBe("rgba(255,255,255,.15)");
    expect(tk.textGlow).toBe("rgba(4,7,18,.55)");
    expect(tk.elev).toBe("rgba(3,6,16,.5)");
    expect(tk.coverA).toBe("#16173f");
    expect(tk.coverB).toBe("#2c4a78");
  });

  it("derives light-scene tokens at Midday (dark ink)", () => {
    const tk = deriveTokens(sampleScene(12.5));
    expect(tk.inkLight).toBe(false);
    expect(tk.surface).toBe(mixHex("#3e9bf4", "#f8fafe", 0.6));
    expect(tk.cardBg).toBe("rgba(255,255,255,.62)");
    expect(tk.textGlow).toBe("rgba(255,255,255,.5)");
  });
});

describe("celestial positions", () => {
  it("puts the sun at apex at solar noon (h=13)", () => {
    const p = sunPosition(13);
    expect(p.xVw).toBeCloseTo(50, 5);
    expect(p.yVh).toBeCloseTo(20, 5);
  });
  it("clamps the sun to the horizon outside daylight", () => {
    expect(sunPosition(3).xVw).toBeCloseTo(6, 5);
    expect(sunPosition(3).yVh).toBeCloseTo(78, 5);
  });
  it("tracks the moon across the night window", () => {
    expect(moonPosition(19.5).visible).toBe(true);
    expect(moonPosition(19.5).xVw).toBeCloseTo(8, 5);
    expect(moonPosition(12).visible).toBe(false);
  });
});

describe("applySceneToRoot", () => {
  it("writes gradient, token, weight, and position variables", () => {
    const root = document.createElement("div");
    applySceneToRoot(root, 0);
    expect(root.style.getPropertyValue("--sky-top")).toBe("#050818");
    expect(root.style.getPropertyValue("--ink")).toBe("#edf2ff");
    expect(root.style.getPropertyValue("--card-bg")).toBe("rgba(10,13,28,.55)");
    expect(root.style.getPropertyValue("--w-stars")).toBe("1");
    expect(root.style.getPropertyValue("--w-moon")).toBe("1");
    expect(root.style.getPropertyValue("--moon-x")).toMatch(/vw$/);
  });
  it("accepts keyframe overrides (tune panel path)", () => {
    const root = document.createElement("div");
    const custom = SCENE_KEYFRAMES.map((k) => ({ ...k, top: "#123456" }));
    applySceneToRoot(root, 0, custom);
    expect(root.style.getPropertyValue("--sky-top")).toBe("#123456");
  });
});
```

Also add `SCENE_KEYFRAMES` to the imports from `@/lib/scene-config` in the test file.

- [ ] **Step 2: Run tests to verify the new describes fail**

Run: `pnpm test -- src/lib/scene-engine.test.ts`
Expected: FAIL — `deriveTokens is not a function` (Task 1 tests still pass).

- [ ] **Step 3: Implement** (append to `src/lib/scene-engine.ts`)

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
}

/** Derived UI tokens (spec §3.2) — every formula is locked by the spec. */
export function deriveTokens(s: SceneSample): SceneTokens {
  const inkLight = luminance(s.ink) > 0.5;
  const surface = mixHex(s.top, inkLight ? "#07091a" : "#f8fafe", 0.6);
  return {
    ink: s.ink,
    sub: s.sub,
    surface,
    scrim: surface + "94",
    cardBg: inkLight ? "rgba(10,13,28,.55)" : "rgba(255,255,255,.62)",
    cardBorder: inkLight ? "rgba(255,255,255,.15)" : "rgba(12,24,48,.13)",
    textGlow: inkLight ? "rgba(4,7,18,.55)" : "rgba(255,255,255,.5)",
    elev: inkLight ? "rgba(3,6,16,.5)" : "rgba(25,50,95,.28)",
    coverA: s.mid,
    coverB: s.hor,
    inkLight,
  };
}

/** Sun arc: rises 5.5h, sets 20.5h; horizon at 78vh, apex at 20vh. */
export function sunPosition(hour: number): { xVw: number; yVh: number } {
  const f = Math.max(0, Math.min(1, (hour - 5.5) / 15));
  return { xVw: lerp(6, 94, f), yVh: 78 - Math.sin(f * Math.PI) * 58 };
}

/** Moon arc across the 19.5h → 7h window. */
export function moonPosition(hour: number): { xVw: number; yVh: number; visible: boolean } {
  const m = (hour + 24 - 19.5) % 24;
  if (m >= 11.5) return { xVw: 0, yVh: 0, visible: false };
  const f = m / 11.5;
  return { xVw: lerp(8, 92, f), yVh: 72 - Math.sin(f * Math.PI) * 52, visible: true };
}

/**
 * The single DOM writer: samples the scene at `hour` and writes every scene
 * CSS custom property onto `root`. Called by SceneProvider ~once a minute
 * and on scrub — never per frame.
 */
export function applySceneToRoot(
  root: HTMLElement,
  hour: number,
  keyframes: readonly SceneKeyframe[] = SCENE_KEYFRAMES,
): void {
  const s = sampleScene(hour, keyframes);
  const tk = deriveTokens(s);
  const set = (name: string, value: string | number) =>
    root.style.setProperty(name, String(value));

  set("--sky-top", s.top);
  set("--sky-mid", s.mid);
  set("--sky-hor", s.hor);
  set("--ink", tk.ink);
  set("--sub", tk.sub);
  set("--surface", tk.surface);
  set("--scrim", tk.scrim);
  set("--card-bg", tk.cardBg);
  set("--card-border", tk.cardBorder);
  set("--text-glow", tk.textGlow);
  set("--elev", tk.elev);
  set("--cover-a", tk.coverA);
  set("--cover-b", tk.coverB);
  set("--w-stars", s.stars);
  set("--w-rays", s.rays);
  set("--w-clouds", s.clouds);
  set("--w-birds", s.birds);
  set("--w-sun", s.sun);
  set("--w-moon", s.moon);

  const sun = sunPosition(hour);
  set("--sun-x", `${sun.xVw.toFixed(2)}vw`);
  set("--sun-y", `${sun.yVh.toFixed(2)}vh`);
  const moon = moonPosition(((hour % 24) + 24) % 24);
  if (moon.visible) {
    set("--moon-x", `${moon.xVw.toFixed(2)}vw`);
    set("--moon-y", `${moon.yVh.toFixed(2)}vh`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/lib/scene-engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + build, then commit**

Run: `pnpm test && pnpm build`

```bash
git add src/lib/scene-engine.ts src/lib/scene-engine.test.ts
git commit -m "feat: scene token derivation, sun/moon arcs, CSS var writer"
```

---

### Task 3: Global tokens, component classes, Mae type system

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: the CSS var names written by `applySceneToRoot` (Task 2).
- Produces: `:root` token defaults; Tailwind color/font mappings (`text-ink`, `text-sub`, `bg-surface`, `border-card` utilities); component classes `.slab`, `.pill`, `.pill-secondary`, `.heading-display`, `.text-kicker`; body set in Mae at `--bw`. Later phases style everything with these.

- [ ] **Step 1: Read the current file**

Run: `cat src/app/globals.css` — note the existing `@theme inline` block (contains `--font-wordmark`) and the existing body/font rules. The steps below **append or extend**; do not remove existing tokens used by current pages.

- [ ] **Step 2: Add scene token defaults** (append after the existing `:root`/theme declarations; defaults are the Midnight keyframe so SSR paints a coherent dark sky before hydration)

```css
/* ---------- scene tokens (written live by applySceneToRoot; defaults = Midnight) ---------- */
:root {
  --sky-top: #050818;
  --sky-mid: #16173f;
  --sky-hor: #2c4a78;
  --ink: #edf2ff;
  --sub: #a9b6e6;
  --surface: #060a19;
  --scrim: #060a1994;
  --card-bg: rgba(10, 13, 28, 0.55);
  --card-border: rgba(255, 255, 255, 0.15);
  --text-glow: rgba(4, 7, 18, 0.55);
  --elev: rgba(3, 6, 16, 0.5);
  --cover-a: #16173f;
  --cover-b: #2c4a78;
  --w-stars: 1;
  --w-rays: 0;
  --w-clouds: 0;
  --w-birds: 0;
  --w-sun: 0;
  --w-moon: 1;
  --sun-x: 6vw;
  --sun-y: 78vh;
  --moon-x: 50vw;
  --moon-y: 20vh;

  /* type system (spec §4): Mae for display + body, tunable base weights */
  --font-display: "mae-variable", var(--font-geist-sans), sans-serif;
  --font-body: "mae-variable", var(--font-geist-sans), sans-serif;
  --dw: 180;
  --bw: 140;
}
```

- [ ] **Step 3: Map tokens into Tailwind** (add these lines **inside the existing `@theme inline` block**)

```css
  --color-ink: var(--ink);
  --color-sub: var(--sub);
  --color-surface: var(--surface);
  --color-card: var(--card-bg);
  --color-card-border: var(--card-border);
  --font-display: var(--font-display);
  --font-body: var(--font-body);
```

- [ ] **Step 4: Add the component classes** (append at the end of the file)

```css
/* ---------- scene-aware materials & type roles (spec §3.2, §4, §15) ---------- */
@layer components {
  /* Frosted slab: the system's contrast material (nav pill, forms, text slabs). */
  .slab {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 18px;
    padding: 26px 28px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 12px 40px var(--elev);
  }

  /* Pill buttons/chips — primary carries the slab material. */
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8125rem 1.625rem;
    border-radius: 9999px;
    background: var(--card-bg);
    color: var(--ink);
    border: 1px solid var(--card-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 8px 28px var(--elev);
  }

  /* Secondary CTA: outline-only variant of .pill (use together: class="pill pill-secondary"). */
  .pill-secondary {
    background: transparent;
    box-shadow: none;
    border-width: 1.5px;
  }

  /* Display headings: Mae at the section-heading role weight, scene glow. */
  .heading-display {
    font-family: var(--font-display);
    font-variation-settings: "wght" calc(var(--dw) + 260);
    text-shadow: 0 2px 26px var(--text-glow);
  }

  /* Uppercase kicker/label style. */
  .text-kicker {
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--sub);
    font-variation-settings: "wght" calc(var(--bw) + 150);
  }
}
```

- [ ] **Step 5: Set the site body face to Mae** — in the existing `body` rule, change the `font-family` to `var(--font-body)` and add `font-variation-settings: "wght" var(--bw);`. Keep everything else in the rule as-is.

- [ ] **Step 6: Verify**

Run: `pnpm build` — clean. Then `pnpm dev`, open `localhost:3000`: page text now renders in Mae (visibly rounder than Geist); no layout breakage on `/`, `/work`, and one case study page.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: scene design tokens, slab/pill materials, Mae type system"
```

---

### Task 4: SceneProvider + Sky gradient, mounted on the homepage

**Files:**
- Create: `src/components/sky/scene-provider.tsx`
- Create: `src/components/sky/sky.tsx`
- Create: `src/components/sky/sky.module.css`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `applySceneToRoot`, `hourFromDate` (Task 2); `SCENE_KEYFRAMES`, `SceneKeyframe` (Task 1); CSS vars (Task 3).
- Produces: `SceneProvider` (client component wrapping children), `useScene() => { hour: number | null; live: boolean; scrub(h: number): void; resume(): void; keyframes: readonly SceneKeyframe[]; setKeyframes(k: SceneKeyframe[]): void }`, `Sky` (renders the fixed background; accepts children layers in later tasks). Tasks 5–7 consume both.

- [ ] **Step 1: Write the provider**

```tsx
// src/components/sky/scene-provider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SCENE_KEYFRAMES, type SceneKeyframe } from "@/lib/scene-config";
import { applySceneToRoot, hourFromDate } from "@/lib/scene-engine";

interface SceneContextValue {
  /** Current scene hour; null until mounted (the server cannot know the visitor's clock). */
  hour: number | null;
  /** True while following the real clock (false while the visitor scrubs). */
  live: boolean;
  scrub: (hour: number) => void;
  resume: () => void;
  /** Live keyframes — replaceable by the dev tune panel. */
  keyframes: readonly SceneKeyframe[];
  setKeyframes: (keyframes: SceneKeyframe[]) => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used inside <SceneProvider>");
  return ctx;
}

/**
 * Owns the scene clock. Samples the visitor's local time once a minute
 * (skipping ticks while the tab is hidden) and writes the scene tokens to
 * <html> via applySceneToRoot. No RAF, no per-frame work (spec §12).
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const [hour, setHour] = useState<number | null>(null);
  const [live, setLive] = useState(true);
  const [keyframes, setKeyframes] = useState<readonly SceneKeyframe[]>(SCENE_KEYFRAMES);
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: the clock is client-only
    setHour(hourFromDate(new Date()));
    const tick = () => {
      if (liveRef.current && !document.hidden) setHour(hourFromDate(new Date()));
    };
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (hour !== null) applySceneToRoot(document.documentElement, hour, keyframes);
  }, [hour, keyframes]);

  return (
    <SceneContext.Provider
      value={{
        hour,
        live,
        keyframes,
        scrub: (h) => {
          setLive(false);
          setHour(h);
        },
        resume: () => {
          setLive(true);
          setHour(hourFromDate(new Date()));
        },
        setKeyframes: (k) => setKeyframes(k),
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
```

- [ ] **Step 2: Write the sky compositor + its module CSS**

```tsx
// src/components/sky/sky.tsx
import type { ReactNode } from "react";
import styles from "@/components/sky/sky.module.css";

/**
 * The fixed full-viewport living background (spec §3). Layers mount as
 * children so each element family stays its own small component.
 */
export function Sky({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.sky} aria-hidden="true">
      <div className={styles.gradient} />
      {children}
    </div>
  );
}
```

```css
/* src/components/sky/sky.module.css — all sky visuals live here (spec §15) */
.sky {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.sky > * {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gradient {
  background: linear-gradient(
    180deg,
    var(--sky-top) 0%,
    var(--sky-mid) 55%,
    var(--sky-hor) 100%
  );
}
```

- [ ] **Step 3: Mount on the homepage** — in `src/app/page.tsx`, wrap the page contents:

```tsx
import { SceneProvider } from "@/components/sky/scene-provider";
import { Sky } from "@/components/sky/sky";
```

Then wrap the existing JSX return value (keep every existing child exactly as it is):

```tsx
return (
  <SceneProvider>
    <Sky />
    {/* existing page content, unchanged */}
  </SceneProvider>
);
```

- [ ] **Step 4: Verify in the browser**

Run: `pnpm dev`, open `localhost:3000`. Expected: full-viewport sky gradient behind the existing content, colored for your current local time (compare against spec §3.1 palette for the current hour); no hydration warnings in the console; gradient repaints if you change the system clock ±few hours and reload.

- [ ] **Step 5: Full suite + build, then commit**

Run: `pnpm test && pnpm build`

```bash
git add src/components/sky/ src/app/page.tsx
git commit -m "feat: scene provider (clock → tokens) and sky gradient layer"
```

---

### Task 5: Seeded randomness + stars and clouds layers

**Files:**
- Create: `src/lib/seeded-random.ts`
- Test: `src/lib/seeded-random.test.ts`
- Create: `src/components/sky/stars.tsx`
- Create: `src/components/sky/clouds.tsx`
- Modify: `src/components/sky/sky.module.css` (append)
- Modify: `src/app/page.tsx` (mount layers inside `<Sky>`)

**Interfaces:**
- Consumes: `Sky` children slot (Task 4); `--w-stars`/`--w-clouds` vars (Task 2/3).
- Produces: `mulberry32(seed: number) => () => number`; `Stars`, `Clouds` components (no props). Task 6 reuses the same PRNG and CSS patterns.

- [ ] **Step 1: Write the failing PRNG test**

```ts
// src/lib/seeded-random.test.ts
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/seeded-random";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("stays in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/lib/seeded-random.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the PRNG**

```ts
// src/lib/seeded-random.ts

/**
 * mulberry32 — tiny seeded PRNG. Sky layers must render identically on the
 * server and the client (hydration), so Math.random() is banned in render
 * paths; derive all "random" placement from a fixed seed instead.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Run: `pnpm test -- src/lib/seeded-random.test.ts` → PASS.

- [ ] **Step 4: Write the stars layer**

```tsx
// src/components/sky/stars.tsx
import type { CSSProperties } from "react";
import { mulberry32 } from "@/lib/seeded-random";
import styles from "@/components/sky/sky.module.css";

const STAR_COUNT = 110;
const SPARKLE_COUNT = 9;
const SEED = 20260711;

interface Star {
  leftVw: number;
  topVh: number;
  sizePx: number;
  durS: number;
  delayS: number;
}

function makeField(): { stars: Star[]; sparkles: Star[] } {
  const rnd = mulberry32(SEED);
  const make = (size: () => number, topMax: number): Star => ({
    leftVw: rnd() * 100,
    topVh: rnd() * topMax,
    sizePx: size(),
    durS: 2 + rnd() * 4,
    delayS: -rnd() * 5,
  });
  return {
    stars: Array.from({ length: STAR_COUNT }, () => make(() => 1 + rnd() * 1.8, 72)),
    sparkles: Array.from({ length: SPARKLE_COUNT }, () => make(() => 8 + rnd() * 8, 60)),
  };
}

const FIELD = makeField(); // module-level: computed once, identical on server & client

const starStyle = (s: Star): CSSProperties =>
  ({
    left: `${s.leftVw}vw`,
    top: `${s.topVh}vh`,
    width: s.sizePx,
    height: s.sizePx,
    "--d": `${s.durS.toFixed(1)}s`,
    "--dl": `${s.delayS.toFixed(1)}s`,
  }) as CSSProperties;

export function Stars() {
  return (
    <div className={styles.stars}>
      {FIELD.stars.map((s, i) => (
        <span key={i} className={styles.star} style={starStyle(s)} />
      ))}
      {FIELD.sparkles.map((s, i) => (
        <span key={i} className={styles.sparkle} style={starStyle(s)}>
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path
              d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"
              fill="#fff"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write the clouds layer**

```tsx
// src/components/sky/clouds.tsx
import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** Crisp vector cloud: single silhouette, semi-transparent as a whole (group
 *  opacity — never per-ellipse, which would show overlap seams). */
function CloudShape() {
  return (
    <svg width="240" height="100" viewBox="0 0 240 100">
      <g fill="#fff" opacity="0.82">
        <ellipse cx="60" cy="66" rx="52" ry="24" />
        <ellipse cx="112" cy="46" rx="46" ry="30" />
        <ellipse cx="168" cy="64" rx="50" ry="24" />
        <ellipse cx="120" cy="70" rx="80" ry="22" />
      </g>
    </svg>
  );
}

/** scale, top (vh), drift duration (s), negative delay (s) — from the approved prototype. */
const CLOUDS: Array<[number, number, number, number]> = [
  [0.9, 10, 150, -40],
  [0.65, 24, 205, -120],
  [1.25, 16, 110, -70],
  [0.5, 34, 175, -20],
  [1.0, 6, 240, -180],
];

export function Clouds() {
  return (
    <div className={styles.clouds}>
      {CLOUDS.map(([scale, topVh, durS, delayS], i) => (
        <div
          key={i}
          className={styles.cloud}
          style={
            {
              top: `${topVh}vh`,
              "--s": scale,
              "--d": `${durS}s`,
              "--dl": `${delayS}s`,
            } as CSSProperties
          }
        >
          <CloudShape />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Append layer CSS** (to `src/components/sky/sky.module.css`)

```css
/* ---------- stars ---------- */
.stars {
  opacity: var(--w-stars);
}

.star,
.sparkle {
  position: absolute;
  animation: twinkle var(--d) ease-in-out var(--dl) infinite;
}

.star {
  background: #fff;
  border-radius: 50%;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.15;
  }
  50% {
    opacity: 0.95;
  }
}

/* ---------- clouds ---------- */
.clouds {
  opacity: calc(var(--w-clouds) * 0.92);
}

.cloud {
  position: absolute;
  animation: drift var(--d) linear var(--dl) infinite;
}

@keyframes drift {
  from {
    transform: translateX(-30vw) scale(var(--s));
  }
  to {
    transform: translateX(135vw) scale(var(--s));
  }
}

/* ---------- reduced motion: correct scene, still sky (spec §12) ---------- */
@media (prefers-reduced-motion: reduce) {
  .sky *,
  .sky *::before,
  .sky *::after {
    animation: none !important;
  }
}
```

- [ ] **Step 7: Mount** — in `src/app/page.tsx`, change `<Sky />` to:

```tsx
<Sky>
  <Stars />
  <Clouds />
</Sky>
```

with imports `import { Stars } from "@/components/sky/stars";` and `import { Clouds } from "@/components/sky/clouds";`.

- [ ] **Step 8: Verify in the browser**

`pnpm dev` → at night hours stars twinkle and clouds are absent; scrub isn't built yet, so to check day state temporarily run `document.documentElement.style.setProperty("--w-clouds", "1")` in the console — clouds drift crisp-edged. No hydration warnings (the seeded field must match server/client). With macOS Reduce Motion enabled (or DevTools emulation), all sky animation freezes.

- [ ] **Step 9: Full suite + build, then commit**

Run: `pnpm test && pnpm build`

```bash
git add src/lib/seeded-random.ts src/lib/seeded-random.test.ts src/components/sky/stars.tsx src/components/sky/clouds.tsx src/components/sky/sky.module.css src/app/page.tsx
git commit -m "feat: star and cloud sky layers with hydration-safe seeded placement"
```

---

### Task 6: Rays, sun/moon, and birds layers

**Files:**
- Create: `src/components/sky/rays.tsx`
- Create: `src/components/sky/sun-moon.tsx`
- Create: `src/components/sky/birds.tsx`
- Modify: `src/components/sky/sky.module.css` (append)
- Modify: `src/app/page.tsx` (mount inside `<Sky>`, order: SunMoon, Rays, Stars, Clouds, Birds)

**Interfaces:**
- Consumes: `mulberry32` (Task 5); `--w-rays`/`--w-sun`/`--w-moon`/`--w-birds`, `--sun-x/y`, `--moon-x/y` vars (Task 2).
- Produces: `Rays`, `SunMoon`, `Birds` components (no props). Completes the sky.

- [ ] **Step 1: Write the rays layer** (the "wash" — one object, anchored to the sun, spec §3.3)

```tsx
// src/components/sky/rays.tsx
import { mulberry32 } from "@/lib/seeded-random";
import styles from "@/components/sky/sky.module.css";

/** Irregular conic wedges, generated once from a fixed seed (hydration-safe). */
function washGradient(): string {
  const rnd = mulberry32(19790608);
  const wedges: string[] = [];
  let acc = 0;
  while (acc < 360) {
    const w = 4 + rnd() * 7;
    const gap = 6 + rnd() * 11;
    wedges.push(
      `rgba(255,216,150,.20) ${acc}deg ${acc + w}deg, rgba(255,216,150,0) ${acc + w}deg ${acc + w + gap}deg`,
    );
    acc += w + gap;
  }
  return `radial-gradient(circle, rgba(255,240,205,.55) 0 7%, rgba(255,240,205,0) 34%), conic-gradient(${wedges.join(",")})`;
}

const WASH_BACKGROUND = washGradient();

export function Rays() {
  return (
    <div className={styles.rays}>
      <div className={styles.raysAnchor}>
        <div className={styles.wash} style={{ background: WASH_BACKGROUND }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write the sun/moon layer**

```tsx
// src/components/sky/sun-moon.tsx
import styles from "@/components/sky/sky.module.css";

export function SunMoon() {
  return (
    <>
      <div className={styles.sunLayer}>
        <div className={styles.sun} />
      </div>
      <div className={styles.moonLayer}>
        <div className={styles.moon} />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Write the birds layer**

```tsx
// src/components/sky/birds.tsx
import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** top (vh), flight duration (s), negative delay (s). */
const BIRDS: Array<[number, number, number]> = [
  [24, 30, -6],
  [33, 42, -22],
];

export function Birds() {
  return (
    <div className={styles.birds}>
      {BIRDS.map(([topVh, durS, delayS], i) => (
        <div
          key={i}
          className={styles.bird}
          style={{ top: `${topVh}vh`, "--d": `${durS}s`, "--dl": `${delayS}s` } as CSSProperties}
        >
          <svg width="26" height="12" viewBox="0 0 26 12">
            <path
              d="M1 9 Q7 1 13 9 Q19 1 25 9"
              stroke="currentColor"
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Append layer CSS** (to `src/components/sky/sky.module.css`)

```css
/* ---------- god rays: the "wash", one object anchored to the sun ---------- */
.rays {
  opacity: var(--w-rays);
  overflow: hidden;
}

.raysAnchor {
  position: absolute;
  left: var(--sun-x);
  top: var(--sun-y);
  width: 0;
  height: 0;
}

.wash {
  position: absolute;
  left: -1300px;
  top: -1300px;
  width: 2600px;
  height: 2600px;
  mix-blend-mode: screen;
  filter: blur(14px);
  -webkit-mask: radial-gradient(circle, #000 0 42%, transparent 70%);
  mask: radial-gradient(circle, #000 0 42%, transparent 70%);
  animation: sway 16s ease-in-out infinite alternate;
}

@keyframes sway {
  from {
    transform: rotate(-2.5deg) scale(1);
  }
  to {
    transform: rotate(2.5deg) scale(1.04);
  }
}

/* ---------- sun & moon ---------- */
.sunLayer {
  opacity: var(--w-sun);
}

.moonLayer {
  opacity: var(--w-moon);
}

.sun {
  position: absolute;
  left: calc(var(--sun-x) - 65px);
  top: calc(var(--sun-y) - 65px);
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 238, 175, 0.95) 0 26%,
    rgba(255, 215, 125, 0.35) 46%,
    transparent 70%
  );
  filter: blur(1.5px);
}

.moon {
  position: absolute;
  left: calc(var(--moon-x) - 35px);
  top: calc(var(--moon-y) - 35px);
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 36%, #f5f7ff 0 55%, #c7d1ef 100%);
  box-shadow: 0 0 44px 10px rgba(219, 229, 255, 0.35);
}

/* ---------- birds ---------- */
.birds {
  opacity: calc(var(--w-birds) * 0.85);
  color: var(--sub);
}

.bird {
  position: absolute;
  animation: fly var(--d) linear var(--dl) infinite;
}

.bird svg {
  display: block;
  animation: flap 0.55s ease-in-out infinite alternate;
}

@keyframes fly {
  from {
    transform: translate(-12vw, 0);
  }
  to {
    transform: translate(118vw, -7vh);
  }
}

@keyframes flap {
  from {
    transform: scaleY(0.5);
  }
  to {
    transform: scaleY(1.2);
  }
}

/* birds vanish (not freeze mid-air) under reduced motion */
@media (prefers-reduced-motion: reduce) {
  .birds {
    display: none;
  }
}
```

- [ ] **Step 5: Mount all layers** — in `src/app/page.tsx`:

```tsx
<Sky>
  <SunMoon />
  <Rays />
  <Stars />
  <Clouds />
  <Birds />
</Sky>
```

with the three new imports.

- [ ] **Step 6: Verify in the browser**

`pnpm dev` → at night: moon disc visible on its arc, stars on, rays/clouds/birds off. Console-set `document.documentElement.style.setProperty("--w-rays", "1")` — the wash appears anchored at the sun position with slow sway, blended (not painted) over the gradient. Reduced motion hides birds and freezes everything else.

- [ ] **Step 7: Full suite + build, then commit**

Run: `pnpm test && pnpm build`

```bash
git add src/components/sky/rays.tsx src/components/sky/sun-moon.tsx src/components/sky/birds.tsx src/components/sky/sky.module.css src/app/page.tsx
git commit -m "feat: rays, sun/moon, and birds sky layers"
```

---

### Task 7: Time scrubber, dev tune panel, docs

**Files:**
- Create: `src/components/sky/time-scrubber.tsx`
- Create: `src/components/sky/scene-tune-panel.tsx`
- Modify: `src/app/page.tsx` (mount both inside `SceneProvider`)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `useScene` (Task 4); `.pill` class (Task 3); `SceneKeyframe` (Task 1).
- Produces: `TimeScrubber` (visitor-facing), `SceneTunePanel` (dev-only, `?tune`-gated — same gate pattern as `wordmark-tune-panel.tsx`).

- [ ] **Step 1: Write the visitor scrubber**

```tsx
// src/components/sky/time-scrubber.tsx
"use client";

import { useScene } from "@/components/sky/scene-provider";

function formatHour(hour: number): string {
  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Visitor-facing sun/moon scrubber (spec §3.4): preview any time of day.
 * Visual styling is a punch-list item; behavior is final.
 */
export function TimeScrubber() {
  const { hour, live, scrub, resume } = useScene();
  if (hour === null) return null;

  return (
    <div
      className="pill fixed right-4 bottom-4 z-40 gap-3 px-4 py-2 text-sm"
      role="group"
      aria-label="Time of day"
    >
      <button
        type="button"
        onClick={resume}
        aria-pressed={live}
        className={live ? "underline underline-offset-4" : "opacity-60"}
      >
        now
      </button>
      <input
        type="range"
        min={0}
        max={24}
        step={0.1}
        value={hour}
        onChange={(e) => scrub(Number(e.target.value))}
        aria-label="Scrub time of day"
        className="w-36 accent-current"
      />
      <span className="tabular-nums" aria-live="polite">
        {formatHour(hour)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Write the dev tune panel**

```tsx
// src/components/sky/scene-tune-panel.tsx
"use client";

import { useEffect, useState } from "react";
import { useScene } from "@/components/sky/scene-provider";

const COLOR_FIELDS = ["top", "mid", "hor", "ink", "sub"] as const;

/**
 * Dev-only palette editor for the scene keyframes. Only rendered behind a
 * NODE_ENV === "development" gate AND an explicit `?tune` URL param (the
 * same opt-in pattern as wordmark-tune-panel.tsx, documented in CLAUDE.md).
 * "copy scenes JSON" → paste into src/lib/scene-config.ts to persist.
 */
export function SceneTunePanel() {
  const { hour, scrub, keyframes, setKeyframes } = useScene();
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tuneRequested, setTuneRequested] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is client-only
    setTuneRequested(new URLSearchParams(window.location.search).has("tune"));
  }, []);

  if (process.env.NODE_ENV !== "development" || !tuneRequested || hour === null) {
    return null;
  }

  const kf = keyframes[selected];

  function updateColor(field: (typeof COLOR_FIELDS)[number], value: string) {
    const next = keyframes.map((k, i) => (i === selected ? { ...k, [field]: value } : k));
    setKeyframes(next);
    scrub(next[selected].h); // jump to the edited keyframe so the change is visible
  }

  return (
    <div className="slab fixed right-4 bottom-20 z-50 w-64 space-y-2 text-xs text-ink">
      <p className="text-kicker text-[10px]">Scene tune</p>
      <select
        value={selected}
        onChange={(e) => {
          const i = Number(e.target.value);
          setSelected(i);
          scrub(keyframes[i].h);
        }}
        className="w-full rounded border border-card-border bg-transparent px-1 py-0.5"
      >
        {keyframes.map((k, i) => (
          <option key={k.name} value={i}>
            {k.name} ({k.h}h)
          </option>
        ))}
      </select>
      {COLOR_FIELDS.map((field) => (
        <label key={field} className="flex items-center justify-between">
          <span>{field}</span>
          <input
            type="color"
            value={kf[field]}
            onChange={(e) => updateColor(field, e.target.value)}
          />
        </label>
      ))}
      <button
        type="button"
        className="pill w-full justify-center px-2 py-1 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(JSON.stringify(keyframes, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "✓ copied — paste into scene-config.ts" : "copy scenes JSON"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Mount both** — in `src/app/page.tsx`, inside `<SceneProvider>` after the existing content:

```tsx
<TimeScrubber />
<SceneTunePanel />
```

with imports for both components.

- [ ] **Step 4: Verify in the browser**

`pnpm dev`:
- Scrubber pill bottom-right; dragging it sweeps the whole gradient + elements through the day; "now" returns to the live clock (verify the readout matches your actual time).
- `localhost:3000/?tune` shows the tune panel; editing Dawn's `hor` color visibly changes the dawn horizon; copy JSON puts the full keyframe array on the clipboard. Without `?tune`, no panel.
- `pnpm build && pnpm start` — production build shows the scrubber but never the tune panel (even with `?tune`).

- [ ] **Step 5: Update CLAUDE.md** — two edits:

In the hero/tuning section, generalize the tuning paragraph to cover both panels:

```markdown
**Tuning (dev):** append `?tune` to the URL (`localhost:3000/?tune`) to open the dev tuning panels (hidden otherwise; never ship to production): the wordmark panel (values → `src/lib/hero-config.ts`) and the scene palette panel (values → `src/lib/scene-config.ts`). Dial in, hit *copy JSON*, paste into the config module.
```

In the Structure block, add:

```
src/components/sky/       living time-of-day background: scene-provider, sky + element layers, time-scrubber, scene-tune-panel
src/lib/scene-config.ts   scene keyframes (single source of truth for the 8 scenes)
src/lib/scene-engine.ts   scene sampling + token derivation (pure, unit-tested)
```

- [ ] **Step 6: Full suite + build, then commit**

Run: `pnpm test && pnpm build`

```bash
git add src/components/sky/time-scrubber.tsx src/components/sky/scene-tune-panel.tsx src/app/page.tsx CLAUDE.md
git commit -m "feat: visitor time scrubber and dev scene tune panel"
```

---

## Self-Review

**Spec coverage (Phase 1 scope = spec §16 phase 1):** §3.1 keyframes → Task 1 (verbatim values). §3.2 tokens + slab material → Tasks 2–3 (formulas locked + tested). §3.3 elements → Tasks 5–6 (stars/sparkles, wash rays anchored to sun, crisp group-opacity clouds, birds, sun/moon arcs). §3.4 behavior → Task 4 (minute cadence, visibility pause) + Task 7 (visitor scrubber, `?tune` panel with copy-JSON). §4 → Task 3 (Mae display/body, `--dw`/`--bw`, role classes; wordmark/area is Phase 2 by design). §12 reduced-motion sky → Tasks 5–6 (freeze + hide birds). §15 → structure table (config/content modules, module CSS, component classes, one component per file, tested pure math). Out of Phase 1 scope, deliberately: hero/nav (Phase 2), collector (Phase 3), shelf (Phase 4), contact/farewell (Phase 5).

**Placeholder scan:** none — every code step ships complete code; the scrubber's visual polish is explicitly a spec punch-list item, with final behavior implemented here.

**Type consistency:** `SceneKeyframe`/`SCENE_KEYFRAMES` (T1) consumed by T2/T4/T7 with matching shapes; `applySceneToRoot(root, hour, keyframes?)` signature identical in T2 tests, T4 provider; CSS var names in T2's writer match T3 defaults and T5/T6 module CSS (`--sky-*`, `--w-*`, `--sun-x/y`, `--moon-x/y`); `useScene` return shape identical in T4 definition and T7 consumers; `mulberry32` (T5) reused in T6.
