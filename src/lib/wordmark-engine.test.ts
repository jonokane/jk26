import { afterEach, describe, expect, it, vi } from "vitest";
import type { AmbientConfig, HeroConfig, HoverConfig } from "@/lib/hero-config";
import { AXIS_MAX, AXIS_MIN, heroConfig } from "@/lib/hero-config";
import { gsap } from "@/lib/gsap";
import { createWordmarkEngine } from "@/lib/wordmark-engine";
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

// ---------------------------------------------------------------------------
// Engine tests
// ---------------------------------------------------------------------------

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
    const tickerFn = add.mock.calls[0][0];
    // gsap.ticker.add internally calls remove(callback) to dedupe, so clear
    // the spy's count before asserting stop's removal.
    remove.mockClear();
    engine.stop();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(tickerFn);
    engine.stop(); // idempotent — no second removal
    expect(remove).toHaveBeenCalledTimes(1);
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
