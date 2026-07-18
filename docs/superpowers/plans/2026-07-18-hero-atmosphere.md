# Hero atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a subtle, ethereal, animated colour wash behind the hero only — two blurred depth planes (a drifting aurora haze + flowing liquid folds) drawn from the site's accents, with a reading lane that keeps the type legible and a gentle cursor push/pull — kept cheap enough not to spin fans.

**Architecture:** A decorative `HeroAtmosphere` client component mounts behind the hero's content, painting two `<canvas>` planes plus a reading-lane div, driven off the app's existing GSAP ticker (never a second RAF loop), rendered at reduced resolution, throttled to ~30fps, and removed entirely when the hero scrolls off-screen. Pure maths live in a unit-tested `atmosphere-engine.ts`; every tunable lives in `hero-atmosphere-config.ts`.

**Tech Stack:** Next.js 16 (App Router, React 19, Turbopack), TypeScript, CSS Modules, Canvas 2D, GSAP ticker (already driving Lenis), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-18-hero-atmosphere-design.md` (read it — this plan implements it).

## Global Constraints

Every task's requirements implicitly include these.

- **pnpm only.** Test command is `pnpm test` (already non-watch); **never** `pnpm test run`. Single file: `pnpm test <path>`. Run `pnpm build && pnpm test && pnpm lint` green before each commit.
- **Never `git add -A`.** Stage only the files a task names. Never touch `content/work/collaya.mdx` or `next.config.ts`.
- **The locked recipe (verbatim, goes in the config):** `intensity 1.3`, `blur 33`, `variation 0.75`, `depth 0.3`, `lane 0.8`, `cursor 0.5`, `balance 0.8` (fold-forward). Palette: the site accents `--about` / `--work` / `--contact`, read live off computed style.
- **Derived, never hardcoded:** `farBlur = blur * (1 + 0.9 * variation)`, `nearBlur = max(0, blur * (1 - 0.75 * variation))`.
- **No second RAF loop (CLAUDE.md).** Drive the draw from `gsap.ticker` (import `gsap` from `@/lib/gsap`): `gsap.ticker.add(cb)` while the hero is on screen, `gsap.ticker.remove(cb)` when it isn't. Never call `requestAnimationFrame` or set `autoRaf`. Never change `gsap.ticker.fps()` (Lenis needs full rate — throttle *inside* the callback).
- **Theme colours differ per theme** (`globals.css`): re-read the accents when `<html>`'s `data-theme` changes (a `MutationObserver`).
- **Both themes:** light draws `source-over` at low alpha (pale tints on white); dark draws with `globalCompositeOperation = "lighter"` (luminous glows on black).
- **Reduced motion is first-class (spec §11):** under `prefers-reduced-motion: reduce`, draw ONE static frame and never subscribe to the ticker.
- **Low-power / touch downgrade:** on a coarse pointer OR a viewport narrower than `PERF.staticMaxWidth`, draw one static frame (no ticker, no cursor). Cursor interaction is fine-pointer only regardless.
- **Decorative:** the whole component is `aria-hidden="true"`, no focusable elements, no semantic content. It never transforms or gates the lockup.
- **Canvas may be unavailable** (jsdom, ancient browsers): if `canvas.getContext("2d")` returns null, mount but render nothing and start no animation — never throw.
- **Commit trailers** (every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_011b64DrxdY9bE8xYAnAbWM7
  ```

## File structure

- **Create `src/components/hero/hero-atmosphere-config.ts`** — the recipe + perf constants. The single place to tune by feel.
- **Create `src/components/hero/atmosphere-engine.ts`** — pure, DOM-free maths (hex→rgb, plane-blur split, alpha derivations, fold displacement, easing). Unit-tested.
- **Create `src/components/hero/atmosphere-engine.test.ts`** — its tests.
- **Create `src/components/hero/hero-atmosphere.tsx`** — the client component (canvases, lane, ticker lifecycle, cursor, theme re-read, perf gating).
- **Create `src/components/hero/hero-atmosphere.module.css`** — layer positioning (overscan), `.lane`, `.fade`, fade-in, reduced-motion.
- **Create `src/components/hero/hero-atmosphere.test.tsx`** — a jsdom smoke test (mounts, aria-hidden, layers, no throw without canvas).
- **Modify `src/components/hero/hero.tsx`** — render `<HeroAtmosphere />` as the first child of the section.
- **Modify `src/components/hero/hero.module.css`** — lift the kicker/wordmark/tagline above the atmosphere with `position: relative; z-index: 1`.

---

### Task 1: Config module

**Files:**
- Create: `src/components/hero/hero-atmosphere-config.ts`

**Interfaces:**
- Produces: `ATMOSPHERE` (recipe) and `PERF` (perf constants), consumed by the engine tests (Task 2) and the component (Tasks 3–5).

- [ ] **Step 1: Write the config.**

```ts
/**
 * Hero atmosphere tunables (spec 2026-07-18-hero-atmosphere-design.md). The one
 * place to tune the effect by feel — nothing here is derived from anything else.
 * Recipe locked with Jono; do not change without his call.
 */
export const ATMOSPHERE = {
  /** Overall alpha multiplier. */
  intensity: 1.3,
  /** Base blur (px); the two planes derive their blurs from this + variation. */
  blur: 33,
  /** How far the far/near plane blurs spread apart (0 = uniform). */
  variation: 0.75,
  /** Contrast between sheer and dense. */
  depth: 0.3,
  /** Reading-lane centre opacity (0 = off). */
  lane: 0.8,
  /** Cursor push/pull + parallax-lean strength (0 = none). */
  cursor: 0.5,
  /** Aurora ↔ fold balance (0 = all aurora, 1 = all fold). */
  balance: 0.8,
} as const;

/** Performance + lifecycle constants — the perf contract lives here. */
export const PERF = {
  /** Backing-store scale vs CSS size; the heavy blur hides sub-native res. */
  renderScale: 0.65,
  /** Draw cap — slow ambient drift needs no more. */
  fps: 30,
  /** Opacity fade-in on mount (ms), so it doesn't pop during the wordmark build. */
  fadeInMs: 1200,
  /** Each canvas overscans the hero by this fraction per side, so blur bleeds off-frame. */
  overscan: 0.12,
  /** Below this viewport width (px), render a single static frame (phones/low-power). */
  staticMaxWidth: 820,
} as const;
```

- [ ] **Step 2: Typecheck.** Run: `pnpm build`. Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add src/components/hero/hero-atmosphere-config.ts
git commit -m "feat(hero): atmosphere config — recipe + perf constants"
# + trailers
```

---

### Task 2: Atmosphere engine (pure maths, TDD)

**Files:**
- Create: `src/components/hero/atmosphere-engine.ts`
- Test: `src/components/hero/atmosphere-engine.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (the component in Tasks 3–5 imports these):
  - `hexToRgb(hex: string): [number, number, number]`
  - `planeBlurs(blur: number, variation: number): { far: number; near: number }`
  - `auroraPeak(intensity: number, balance: number, depth: number, dark: boolean): number`
  - `foldAlpha(intensity: number, balance: number, depth: number, dark: boolean): number`
  - `foldBulge(x: number, w: number, cursorX: number, cursorNormY: number, amp: number, strength: number): number`
  - `ease(current: number, target: number, factor: number): number`

- [ ] **Step 1: Write the failing tests** at `src/components/hero/atmosphere-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  auroraPeak, ease, foldAlpha, foldBulge, hexToRgb, planeBlurs,
} from "@/components/hero/atmosphere-engine";

describe("hexToRgb", () => {
  it("parses 6-digit hex, with or without #", () => {
    expect(hexToRgb("#6d4bd8")).toEqual([109, 75, 216]);
    expect(hexToRgb("3f9b4e")).toEqual([63, 155, 78]);
  });
  it("parses the pure black/white grounds", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });
});

describe("planeBlurs", () => {
  it("spreads far above near as variation grows; never negative", () => {
    const { far, near } = planeBlurs(33, 0.75);
    expect(far).toBeCloseTo(33 * 1.675, 5); // 33*(1+0.9*0.75)
    expect(near).toBeCloseTo(33 * 0.4375, 5); // 33*(1-0.75*0.75)
    expect(far).toBeGreaterThan(near);
  });
  it("is uniform at variation 0", () => {
    const { far, near } = planeBlurs(20, 0);
    expect(far).toBe(20);
    expect(near).toBe(20);
  });
  it("clamps near at zero when the spread would push it negative", () => {
    expect(planeBlurs(10, 2).near).toBe(0); // 10*(1-1.5) = -5 → clamped to 0
    expect(planeBlurs(20, 1).near).toBeGreaterThan(0); // 20*0.25 = 5, positive across the slider's own range
  });
});

describe("aurora/fold alpha derivations", () => {
  it("aurora falls and fold rises as balance moves toward fold", () => {
    const aLow = auroraPeak(1.3, 0.1, 0.3, true);
    const aHigh = auroraPeak(1.3, 0.9, 0.3, true);
    expect(aHigh).toBeLessThan(aLow); // more fold → less aurora
    const fLow = foldAlpha(1.3, 0.1, 0.3, true);
    const fHigh = foldAlpha(1.3, 0.9, 0.3, true);
    expect(fHigh).toBeGreaterThan(fLow);
  });
  it("both scale up with intensity and depth, and dark is brighter than light", () => {
    expect(auroraPeak(1.6, 0.8, 0.3, true)).toBeGreaterThan(auroraPeak(1.0, 0.8, 0.3, true));
    expect(foldAlpha(1.3, 0.8, 0.6, true)).toBeGreaterThan(foldAlpha(1.3, 0.8, 0.0, true));
    expect(auroraPeak(1.3, 0.8, 0.3, true)).toBeGreaterThan(auroraPeak(1.3, 0.8, 0.3, false));
  });
});

describe("foldBulge (cursor push/pull)", () => {
  it("is ~zero far from the cursor", () => {
    expect(Math.abs(foldBulge(0, 1000, 0.9, 0.3, 50, 0.5))).toBeLessThan(1e-3);
  });
  it("is signed by whether the cursor is above/below centre", () => {
    const above = foldBulge(500, 1000, 0.5, 0.2, 50, 0.5); // cursor above centre (y<0.5)
    const below = foldBulge(500, 1000, 0.5, 0.8, 50, 0.5); // cursor below centre
    expect(above).toBeGreaterThan(0);
    expect(below).toBeLessThan(0);
  });
  it("scales with strength", () => {
    expect(Math.abs(foldBulge(500, 1000, 0.5, 0.2, 50, 1.0)))
      .toBeGreaterThan(Math.abs(foldBulge(500, 1000, 0.5, 0.2, 50, 0.4)));
  });
});

describe("ease", () => {
  it("moves toward the target and rests once there", () => {
    expect(ease(0, 1, 0.1)).toBeCloseTo(0.1, 5);
    expect(ease(1, 1, 0.1)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to confirm it fails.** Run: `pnpm test src/components/hero/atmosphere-engine.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement the engine** at `src/components/hero/atmosphere-engine.ts`:

```ts
/**
 * Pure maths for the hero atmosphere (spec §Testing) — no canvas, no DOM, so the
 * decisions that must stay correct are unit-tested; the canvas drawing that
 * consumes these lives in the component and is verified by eye.
 */

/** "#6d4bd8" or "6d4bd8" → [109, 75, 216]. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** The two depth planes' blurs, spread apart by `variation` (spec Global Constraints). */
export function planeBlurs(blur: number, variation: number): { far: number; near: number } {
  return { far: blur * (1 + 0.9 * variation), near: Math.max(0, blur * (1 - 0.75 * variation)) };
}

/** Base blob peak alpha for the aurora plane. Aurora weakens as balance → fold. */
export function auroraPeak(intensity: number, balance: number, depth: number, dark: boolean): number {
  return (dark ? 0.5 : 0.17) * (intensity * (1 - 0.55 * balance)) * (1 + 0.85 * depth);
}

/** Base fill alpha for a fold band. Folds strengthen as balance → fold. */
export function foldAlpha(intensity: number, balance: number, depth: number, dark: boolean): number {
  return (dark ? 0.15 : 0.095) * (intensity * (0.45 + 0.55 * balance)) * (1 + 0.7 * depth);
}

/**
 * The cursor push/pull for a fold at horizontal position `x` (the amount to
 * SUBTRACT from the fold's y). A Gaussian falloff around the cursor's x; signed
 * by whether the cursor sits above (pull up) or below (push down) centre.
 * `cursorNormY` is 0..1 down the hero; `strength` is the cursor recipe.
 */
export function foldBulge(
  x: number, w: number, cursorX: number, cursorNormY: number, amp: number, strength: number,
): number {
  const pull = (0.5 - cursorNormY) * 2;
  const d = (x - cursorX * w) / (w * 0.17);
  return strength * amp * 2.6 * Math.exp(-d * d) * pull;
}

/** Frame-rate-independent-enough linear ease toward a target. */
export function ease(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}
```

- [ ] **Step 4: Run to confirm pass.** Run: `pnpm test src/components/hero/atmosphere-engine.test.ts`. Expected: all pass.

- [ ] **Step 5: Commit.**

```bash
git add src/components/hero/atmosphere-engine.ts src/components/hero/atmosphere-engine.test.ts
git commit -m "feat(hero): atmosphere engine — pure maths, unit-tested"
# + trailers
```

---

### Task 3: The atmosphere component + CSS (static render)

Build the component that paints the two planes + reading lane, sized with overscan, coloured from the live accents — drawing ONE static frame for now (the ticker loop, cursor, and perf gating come in Tasks 4–5). Includes a jsdom smoke test.

**Files:**
- Create: `src/components/hero/hero-atmosphere.tsx`
- Create: `src/components/hero/hero-atmosphere.module.css`
- Test: `src/components/hero/hero-atmosphere.test.tsx`

**Interfaces:**
- Consumes: `ATMOSPHERE`, `PERF` (Task 1); `hexToRgb`, `planeBlurs`, `auroraPeak`, `foldAlpha`, `foldBulge`, `ease` (Task 2).
- Produces: `<HeroAtmosphere />` — default export-free named component, `aria-hidden`, rendering `.far` + `.near` canvases, `.lane`, `.fade`. Tasks 4–5 extend the same file; Task 6 mounts it.

- [ ] **Step 1: Write `hero-atmosphere.module.css`:**

```css
/* Decorative layers behind the hero content (spec §Architecture). The canvases
   overscan the hero (PERF.overscan per side) so the heavy blur bleeds off-frame
   and never shows a hard edge; overflow is clipped by the hero. */
.atmosphere {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  /* Fade in on mount so the field doesn't pop during the wordmark build-in. */
  opacity: 0;
  transition: opacity var(--atmo-fade, 1200ms) ease;
}
.atmosphere[data-ready="true"] {
  opacity: 1;
}

.canvas {
  position: absolute;
  inset: -12%;
  width: 124%;
  height: 124%;
  display: block;
  will-change: filter, transform;
}

/* The reading lane: a soft clearing in the canvas colour behind the type, its own
   blur feathering the edges so it melts into the field. JS sets its background
   (theme ground + strength) and geometry. */
.lane {
  position: absolute;
  inset: -6%;
  filter: blur(26px);
  pointer-events: none;
}

/* Closes the seam to the section below — the field fades to canvas before the fold. */
.fade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent 60%, var(--canvas) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .atmosphere { transition: none; }
}
```

- [ ] **Step 2: Write `hero-atmosphere.tsx`** (static render — draws once on mount/resize/theme; no ticker yet):

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { ATMOSPHERE, PERF } from "@/components/hero/hero-atmosphere-config";
import {
  auroraPeak, foldAlpha, hexToRgb, planeBlurs,
} from "@/components/hero/atmosphere-engine";
import styles from "@/components/hero/hero-atmosphere.module.css";

type Rgb = [number, number, number];

/**
 * The hero's ambient wash (spec 2026-07-18). Two blurred depth planes — a
 * drifting aurora haze (far) and flowing folds (near) — drawn from the live
 * accents, with a reading lane. Purely decorative (aria-hidden). This task draws
 * a single static frame; the animation loop, cursor, and perf gating are added in
 * later tasks on this same file.
 */
export function HeroAtmosphere() {
  const rootRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLCanvasElement>(null);
  const nearRef = useRef<HTMLCanvasElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current, farEl = farRef.current, nearEl = nearRef.current, laneEl = laneRef.current;
    if (!root || !farEl || !nearEl || !laneEl) return;
    const farCtx = farEl.getContext("2d");
    const nearCtx = nearEl.getContext("2d");
    if (!farCtx || !nearCtx) return; // canvas unavailable (jsdom): mount, draw nothing

    let W = 0, H = 0, baseSize = 0;

    const accents = (): Rgb[] => {
      const cs = getComputedStyle(document.documentElement);
      return [
        hexToRgb(cs.getPropertyValue("--about")),
        hexToRgb(cs.getPropertyValue("--work")),
        hexToRgb(cs.getPropertyValue("--contact")),
      ];
    };
    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
    const ground = (): Rgb => (isDark() ? [0, 0, 0] : [255, 255, 255]);
    const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: Rgb, peak: number, depth: number) {
      if (r <= 0 || peak <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(c, peak));
      g.addColorStop(0.45, rgba(c, peak * (0.4 - 0.22 * depth)));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    }

    // The far aurora plane: 6 drifting blobs + 2 denser cores.
    function drawAurora(ctx: CanvasRenderingContext2D, t: number, tri: Rgb[], dark: boolean) {
      const peak = auroraPeak(ATMOSPHERE.intensity, ATMOSPHERE.balance, ATMOSPHERE.depth, dark);
      for (let i = 0; i < 6; i++) {
        const c = tri[i % 3], ph = i * 1.7;
        const x = W * (0.5 + 0.42 * Math.sin(t * 0.05 + ph) * Math.cos(t * 0.028 + ph * 0.5));
        const y = H * (0.5 + 0.34 * Math.cos(t * 0.043 + ph * 1.2));
        blob(ctx, x, y, baseSize * (0.42 + 0.16 * Math.sin(t * 0.07 + ph)), c, peak, ATMOSPHERE.depth);
      }
      for (let i = 0; i < 2; i++) {
        const c = tri[(i + 1) % 3], ph = i * 3.1 + 1;
        const x = W * (0.5 + 0.3 * Math.sin(t * 0.09 + ph)), y = H * (0.46 + 0.22 * Math.cos(t * 0.07 + ph));
        blob(ctx, x, y, baseSize * 0.24, c, peak * 1.5 * ATMOSPHERE.depth, ATMOSPHERE.depth);
      }
    }

    // The near folds plane: 4 flowing ribbons. `cursorX/cursorNormY/cursorK` drive
    // the push/pull; this task passes 0 strength (static, no cursor yet).
    function drawFolds(ctx: CanvasRenderingContext2D, t: number, tri: Rgb[], dark: boolean, cursorX: number, cursorNormY: number, cursorK: number) {
      const a = foldAlpha(ATMOSPHERE.intensity, ATMOSPHERE.balance, ATMOSPHERE.depth, dark);
      for (let L = 0; L < 4; L++) {
        const c = tri[L % 3];
        const baseY = H * (0.3 + 0.13 * L), amp = H * (0.05 + 0.02 * L), thick = H * (0.12 + 0.03 * L);
        const f1 = (1.0 + 0.4 * L) * 6.2832 / W, f2 = (2.3 + 0.5 * L) * 6.2832 / W, sp = 0.18 + 0.07 * L;
        const shape = (x: number) => baseY + amp * Math.sin(f1 * x + t * sp + L * 1.3) + amp * 0.4 * Math.sin(f2 * x - t * sp * 0.7 + L);
        const yAt = (x: number) => shape(x) - (cursorK > 0 ? foldBulge(x, W, cursorX, cursorNormY, amp, cursorK) : 0);
        ctx.beginPath();
        ctx.moveTo(-70, yAt(-70));
        for (let x = -70; x <= W + 70; x += 12) ctx.lineTo(x, yAt(x));
        for (let x = W + 70; x >= -70; x -= 12) ctx.lineTo(x, yAt(x) + thick);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp + thick);
        g.addColorStop(0, rgba(c, a));
        g.addColorStop(1, rgba(c, a * 0.1));
        ctx.fillStyle = g;
        ctx.fill();
      }
    }

    // Exposed on the instance so Tasks 4–5 can call it each frame with a real `t`
    // and cursor. Kept here so the static render and the animated render share one
    // draw path (one definition of what the field is).
    const paint = (t: number, cursorX: number, cursorNormY: number, cursorK: number) => {
      const tri = accents(), dark = isDark(), comp = dark ? "lighter" : "source-over";
      farCtx.clearRect(0, 0, W, H);
      farCtx.globalCompositeOperation = comp;
      drawAurora(farCtx, t, tri, dark);
      farCtx.globalCompositeOperation = "source-over";
      nearCtx.clearRect(0, 0, W, H);
      nearCtx.globalCompositeOperation = comp;
      drawFolds(nearCtx, t, tri, dark, cursorX, cursorNormY, cursorK);
      nearCtx.globalCompositeOperation = "source-over";
    };
    // stash for later tasks
    (root as HTMLDivElement & { __paint?: typeof paint }).__paint = paint;

    const applyStyles = () => {
      const { far, near } = planeBlurs(ATMOSPHERE.blur, ATMOSPHERE.variation);
      farEl.style.filter = `blur(${far.toFixed(1)}px)`;
      nearEl.style.filter = `blur(${near.toFixed(1)}px)`;
      const gr = ground();
      laneEl.style.background =
        `radial-gradient(ellipse 56% 44% at 30% 50%, rgba(${gr.join(",")},${ATMOSPHERE.lane}) 0%, rgba(${gr.join(",")},0) 66%)`;
    };

    const measure = () => {
      const r = root.getBoundingClientRect();
      const os = 1 + PERF.overscan * 2;
      W = r.width * os; H = r.height * os; baseSize = Math.min(W, H);
      const px = Math.min(2, window.devicePixelRatio || 1) * PERF.renderScale;
      for (const el of [farEl, nearEl]) {
        el.width = Math.round(W * px);
        el.height = Math.round(H * px);
        el.getContext("2d")!.setTransform(px, 0, 0, px, 0, 0);
      }
      applyStyles();
      paint(6.5, 0.5, 0.44, 0); // one static frame
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    const themeObserver = new MutationObserver(() => { applyStyles(); paint(6.5, 0.5, 0.44, 0); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // reveal after the first paint
    root.setAttribute("data-ready", "true");

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.atmosphere}
      aria-hidden="true"
      style={{ "--atmo-fade": `${PERF.fadeInMs}ms` } as CSSProperties}
    >
      <canvas ref={farRef} className={styles.canvas} />
      <canvas ref={nearRef} className={styles.canvas} />
      <div ref={laneRef} className={styles.lane} />
      <div className={styles.fade} />
    </div>
  );
}
```

> Note: `foldBulge` is imported and used inside `drawFolds`. Add it to the import from `atmosphere-engine` now even though this task always passes `cursorK: 0` — Task 5 activates it. (Import line: `auroraPeak, foldAlpha, foldBulge, hexToRgb, planeBlurs`.)

- [ ] **Step 3: Write the smoke test** at `src/components/hero/hero-atmosphere.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { HeroAtmosphere } from "@/components/hero/hero-atmosphere";

/* No global afterEach is registered (vitest.config.ts has no test.globals) — every
   render-based test in this repo cleans up explicitly. */
afterEach(cleanup);

describe("HeroAtmosphere", () => {
  it("mounts without throwing when canvas is unavailable (jsdom returns no 2d context)", () => {
    const { container } = render(<HeroAtmosphere />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("renders two canvases, a lane, and a fade", () => {
    const { container } = render(<HeroAtmosphere />);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    // lane + fade are the two non-canvas decorative divs inside the root
    expect(container.querySelectorAll('[aria-hidden="true"] > div')).toHaveLength(2);
  });
});
```

- [ ] **Step 4: Run test + gates.** Run: `pnpm test src/components/hero/hero-atmosphere.test.tsx` (expect 2 passed), then `pnpm build && pnpm lint` clean.

- [ ] **Step 5: Commit.**

```bash
git add src/components/hero/hero-atmosphere.tsx src/components/hero/hero-atmosphere.module.css src/components/hero/hero-atmosphere.test.tsx
git commit -m "feat(hero): atmosphere component — two blurred planes + reading lane (static)"
# + trailers
```

---

### Task 4: Animation lifecycle + performance contract

Drive the draw from the shared GSAP ticker, throttled to ~30fps, paused when the hero is off-screen or the tab is hidden, static under reduced-motion / low-power. This is the perf contract (spec §The performance contract).

**Files:**
- Modify: `src/components/hero/hero-atmosphere.tsx` (the effect body from Task 3)

**Interfaces:**
- Consumes: `gsap` from `@/lib/gsap`; the `paint(t, cursorX, cursorNormY, cursorK)` closure defined in Task 3.
- Produces: an animated field that stops entirely off-screen. Task 5 adds cursor values to the `paint` call.

- [ ] **Step 1: Add the import** at the top of `hero-atmosphere.tsx`:

```tsx
import { gsap } from "@/lib/gsap";
```

- [ ] **Step 2: Add the lifecycle** inside the effect, AFTER `root.setAttribute("data-ready", "true")` and BEFORE the `return () => { ... }` cleanup. Replace the cleanup with the version below so it also tears down the ticker/listeners:

```tsx
    // ---- perf contract: reduced motion / low-power → one static frame, no loop ----
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const staticOnly = reduced || coarse || window.innerWidth < PERF.staticMaxWidth;

    let running = false;
    let lastMs = 0;
    const frameMs = 1000 / PERF.fps;
    // gsap.ticker passes time in seconds; throttle to PERF.fps inside the callback.
    const tick = (time: number) => {
      const ms = time * 1000;
      if (ms - lastMs < frameMs) return;
      lastMs = ms;
      paint(time, cursor.x, cursor.y, cursor.k);
    };
    const play = () => { if (!running && !staticOnly) { running = true; gsap.ticker.add(tick); } };
    const stop = () => { if (running) { running = false; gsap.ticker.remove(tick); } };

    // Only animate while the hero is on screen (the effect costs nothing elsewhere).
    const io = new IntersectionObserver((es) => { es[0].isIntersecting ? play() : stop(); }, { threshold: 0.04 });
    io.observe(root);
    const onVisibility = () => { if (document.hidden) stop(); else if (isOnScreen()) play(); };
    document.addEventListener("visibilitychange", onVisibility);
    // isOnScreen is a cheap re-check for the visibility handler
    const isOnScreen = () => {
      const r = root.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      themeObserver.disconnect();
    };
```

- [ ] **Step 3: Add the cursor state object** near the top of the effect (Task 5 populates it; for now it holds the resting values so `paint` has real inputs):

```tsx
    const cursor = { x: 0.5, y: 0.44, k: 0 };
```

Place this line right after `let W = 0, H = 0, baseSize = 0;`.

- [ ] **Step 4: Remove the now-duplicate old cleanup** — ensure there is exactly ONE `return () => { ... }` in the effect (the one from Step 2). Delete the Task 3 cleanup that only disconnected the two observers.

- [ ] **Step 5: Build + test + lint.** Run: `pnpm build && pnpm test && pnpm lint`. Expected: all green (the smoke test still passes — under jsdom `getContext` is null so the effect early-returns before any of this runs).

- [ ] **Step 6: Commit.**

```bash
git add src/components/hero/hero-atmosphere.tsx
git commit -m "feat(hero): atmosphere runs on the shared ticker, pauses off-screen (perf contract)"
# + trailers
```

---

### Task 5: Cursor interaction (push/pull + parallax lean)

Track the pointer over the hero (fine pointer only), ease a cursor position, feed the fold push/pull, and lean the two planes a few px for parallax.

**Files:**
- Modify: `src/components/hero/hero-atmosphere.tsx`

**Interfaces:**
- Consumes: `ease` from `atmosphere-engine`; the `cursor` state and `paint` from Task 4.

- [ ] **Step 1: Add `ease` to the engine import** (line becomes `auroraPeak, ease, foldAlpha, foldBulge, hexToRgb, planeBlurs`).

- [ ] **Step 2: Add pointer tracking + easing.** After the `const cursor = { x: 0.5, y: 0.44, k: 0 };` line, add the target + hover state and the listeners:

```tsx
    const target = { x: 0.5, y: 0.44 };
    let hovering = false;
    if (!staticOnly) {
      root.parentElement?.addEventListener("pointermove", (e) => {
        const r = root.getBoundingClientRect();
        target.x = (e.clientX - r.left) / r.width;
        target.y = (e.clientY - r.top) / r.height;
        hovering = true;
      });
      root.parentElement?.addEventListener("pointerleave", () => { hovering = false; });
    }
```

> `staticOnly` is defined in Task 4's block; this Step must run after it — place this pointer block immediately below the `staticOnly` line. (Move the `const cursor` line up to just under `let W…` per Task 4 Step 3; keep this pointer block after `staticOnly`.)

- [ ] **Step 3: Ease the cursor each frame.** Change the `tick` callback (from Task 4) to update the eased cursor before painting:

```tsx
    const tick = (time: number) => {
      const ms = time * 1000;
      if (ms - lastMs < frameMs) return;
      lastMs = ms;
      const tgX = hovering ? target.x : 0.5, tgY = hovering ? target.y : 0.44;
      cursor.x = ease(cursor.x, tgX, 0.06);
      cursor.y = ease(cursor.y, tgY, 0.06);
      cursor.k = ease(cursor.k, hovering ? ATMOSPHERE.cursor : 0, 0.08);
      paint(time, cursor.x, cursor.y, cursor.k);
      // parallax lean — a few px toward the cursor, near plane leading (composited,
      // cheap). Derived straight from the eased strength (cursor.k tops out at
      // ATMOSPHERE.cursor = 0.5 → ~12px), so no divide-by-recipe.
      const lean = 24 * cursor.k;
      farEl.style.transform = `translate(${(cursor.x - 0.5) * lean * 0.4}px, ${(cursor.y - 0.5) * lean * 0.4}px)`;
      nearEl.style.transform = `translate(${(cursor.x - 0.5) * lean}px, ${(cursor.y - 0.5) * lean}px)`;
    };
```

- [ ] **Step 4: Build + test + lint.** Run: `pnpm build && pnpm test && pnpm lint`. Expected: green.

- [ ] **Step 5: Commit.**

```bash
git add src/components/hero/hero-atmosphere.tsx
git commit -m "feat(hero): atmosphere cursor push/pull + parallax lean (fine pointer)"
# + trailers
```

---

### Task 6: Mount it in the hero

**Files:**
- Modify: `src/components/hero/hero.tsx`
- Modify: `src/components/hero/hero.module.css`

**Interfaces:**
- Consumes: `<HeroAtmosphere />` (Task 3).

- [ ] **Step 1: Import and render.** In `src/components/hero/hero.tsx`, add the import:

```tsx
import { HeroAtmosphere } from "@/components/hero/hero-atmosphere";
```

and render it as the FIRST child of the `<section className={styles.hero} …>`, before `<p className={styles.kicker}>`:

```tsx
      <HeroAtmosphere />
      <p className={styles.kicker}>{siteContent.kicker}</p>
```

- [ ] **Step 2: Lift the content above the atmosphere.** In `src/components/hero/hero.module.css`, the atmosphere is `position:absolute; z-index:0` (its own module). Give the hero's own content a higher stacking so the type sits over it. Add `position: relative; z-index: 1;` to `.kicker` and `.tagline`, and add `z-index: 1;` to the existing `.wordmark` rule (it is already `position: relative`). Concretely, change:

```css
.kicker {
  font-family: var(--font-mono);
  font-size: 12px;
```

to:

```css
.kicker {
  position: relative;
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 12px;
```

and the `.tagline` rule — add `position: relative; z-index: 1;` at its top — and in the `.wordmark` rule add `z-index: 1;` (below its existing `position: relative;`). The `.fly` is `position: fixed; z-index: 45` and is unaffected.

- [ ] **Step 3: Build + test + lint.** Run: `pnpm build && pnpm test && pnpm lint`. Expected: green.

- [ ] **Step 4: Commit.**

```bash
git add src/components/hero/hero.tsx src/components/hero/hero.module.css
git commit -m "feat(hero): mount the atmosphere behind the hero content"
# + trailers
```

---

### Task 7: Browser verification (both themes + perf + reduced motion)

The atmosphere is a motion/perf feature — not done until the pixels and the perf contract are verified. Verification and tuning only; no new component code unless a defect surfaces.

**Files:**
- Possibly small tunes to `hero-atmosphere-config.ts` (recipe/perf) or `hero-atmosphere.module.css` if verification finds a defect.

- [ ] **Step 1: Fresh dev server.** Kill any stale `next dev`; start `pnpm dev`; confirm ready and postdating the commits (CLAUDE.md — stale servers have produced false results here).

- [ ] **Step 2: Visual (light + dark).** Load `/`. Confirm: a soft, ethereal wash sits behind the hero — pale accent tints on white / luminous accent glows on black; the near folds read as more-defined than the far haze (depth of field); it fades to canvas before the About section; and the **kicker, wordmark, and tagline stay fully legible** (reading lane). Toggle the theme and confirm the field re-colours (the MutationObserver) rather than staying light-mode colours.

- [ ] **Step 3: Build-in.** Reload and watch: the atmosphere fades in over ~1.2s and does not pop or fight the JONOKANE build-in.

- [ ] **Step 4: Cursor.** Move the cursor across the hero: the folds gently push/pull toward it and both planes lean a few px (near leading). Confirm it is subtle, not showy.

- [ ] **Step 5: The perf contract (the headline check).** In DevTools, confirm the effect **stops** when the hero scrolls off-screen and when the tab is hidden — e.g. run in the console: `let n=0; const _r=gsap.ticker.add; ` is not needed; instead verify by scrolling past the hero and confirming CPU/GPU drops (Performance monitor) and the canvases stop updating. Then scroll back and confirm it resumes. Confirm the canvases' backing store is `~0.65×` CSS size (`document.querySelector('canvas').width` vs its CSS width × dpr).

- [ ] **Step 6: Reduced motion + low-power.** Enable `prefers-reduced-motion: reduce`: the field is a single static frame (no drift, no cursor response), still fades in. Emulate a narrow viewport (< 820px) or a coarse pointer: also static. No stuck/blank state.

- [ ] **Step 7: Regression sweep.** `pnpm build && pnpm test && pnpm lint` green. Confirm the wordmark's cohesive gradient, the tagline width-lock, the nav hover-reveal, and the floating scroll button all still behave (the atmosphere shares the hero with them).

- [ ] **Step 8: Commit any tunes** (only if Steps 2–6 required changes).

```bash
git add <only the files you tuned>
git commit -m "fix(hero): tune atmosphere after browser pass"
# + trailers
```

---

## Self-review notes (checked against the spec)

- **Two blurred planes (aurora far, folds near), reading lane, fade-out:** Task 3 (draw + lane + fade), plane blurs via `planeBlurs` (Task 2). ✅
- **Locked recipe + derived blurs:** Task 1 config; `planeBlurs` derivation Task 2. ✅
- **Live accents + theme re-read (MutationObserver):** Task 3 (`accents()` + `themeObserver`); verified Task 7 Step 2. ✅
- **Both themes (source-over light / lighter dark):** Task 3 `paint` (`comp`). ✅
- **Perf contract — reduced-res, ~30fps, shared ticker add/remove off-screen, visibility pause, no 2nd RAF:** Task 4; verified Task 7 Step 5. ✅
- **Reduced-motion + low-power/touch static:** Task 4 (`staticOnly`); verified Task 7 Step 6. ✅
- **Cursor push/pull (fine pointer) + parallax lean:** Task 5 (`foldBulge` + lean), gated by `staticOnly`. ✅
- **Fade-in (no pop):** Task 3 CSS + `data-ready`; verified Task 7 Step 3. ✅
- **Decorative (aria-hidden), never gates the lockup:** Task 3 markup; Task 6 layering keeps content above. ✅
- **Canvas-unavailable guard:** Task 3 (`if (!farCtx || !nearCtx) return`) + smoke test. ✅
- **Confined to the hero, mounted behind content:** Task 6. ✅
- **Out of scope respected:** no particles/motes, no warm palette, no other sections. ✅
