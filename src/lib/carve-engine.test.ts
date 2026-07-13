import { describe, expect, it } from "vitest";
import { CARVE_HOVER_CFG, carveWeight } from "@/lib/carve-engine";
import { rawInfluence } from "@/lib/wordmark-engine";
import { wordmarkConfig } from "@/lib/wordmark-config";

describe("carveWeight", () => {
  it("rests at the config weight with zero influence", () => {
    expect(carveWeight(0)).toBe(wordmarkConfig.axes.wght); // 274
  });
  it("carves toward carveToWght at full influence, scaled by strength", () => {
    // 274 - (274-100) * 1 * 0.65 = 274 - 113.1 = 160.9
    expect(carveWeight(1)).toBeCloseTo(160.9, 5);
  });
  it("is linear in influence", () => {
    expect(carveWeight(0.5)).toBeCloseTo((carveWeight(0) + carveWeight(1)) / 2, 5);
  });
  it("clamps influence into [0, 1]", () => {
    expect(carveWeight(2)).toBeCloseTo(carveWeight(1), 5);
    expect(carveWeight(-1)).toBe(carveWeight(0));
  });
});

describe("carve composition (rawInfluence → carveWeight)", () => {
  it("uses raw (unscaled) falloff so strength applies exactly once", () => {
    expect(rawInfluence(0, CARVE_HOVER_CFG)).toBe(1);
  });
  it("reaches the spec carve depth at the pointer center", () => {
    // steady-state influence at distance 0 is 1 → 274 − 174×0.65 = 160.9
    expect(carveWeight(rawInfluence(0, CARVE_HOVER_CFG))).toBeCloseTo(160.9, 5);
  });
});
