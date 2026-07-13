import { describe, expect, it } from "vitest";
import {
  applySceneToRoot,
  deriveTokens,
  hourFromDate,
  luminance,
  mixHex,
  moonPosition,
  sampleScene,
  smoothstep,
  sunPosition,
} from "@/lib/scene-engine";
import { SCENE_KEYFRAMES } from "@/lib/scene-config";

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
    // Noon (m=16.5) is on the morning side of the outside-window
    // midpoint (17.75), so it clamps to the moon's set point (f=1).
    expect(moonPosition(12).xVw).toBeCloseTo(92, 5);
  });

  it("clamps the moon to its rise point just before the geometric window opens", () => {
    // hour=18 → m=22.5, on the evening side of the midpoint (17.75),
    // so it clamps to the moon's rise point (f=0) rather than a stale position.
    const p = moonPosition(18);
    expect(p.visible).toBe(false);
    expect(p.xVw).toBe(8);
  });

  it("normalizes out-of-range hours the same way sampleScene does", () => {
    expect(sunPosition(29)).toEqual(sunPosition(5));
    expect(moonPosition(-4)).toEqual(moonPosition(20));
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
  it("always writes moon position, clamped to the rise point before the window opens", () => {
    const root = document.createElement("div");
    applySceneToRoot(root, 18);
    expect(root.style.getPropertyValue("--moon-x")).toBe("8.00vw");
  });
});
