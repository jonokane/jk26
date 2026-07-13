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
