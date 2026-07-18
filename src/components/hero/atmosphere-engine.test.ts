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
