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
