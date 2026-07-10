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
