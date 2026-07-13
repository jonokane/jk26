import { describe, expect, it } from "vitest";
import { carveWeight } from "@/lib/carve-engine";
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
