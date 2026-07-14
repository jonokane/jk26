import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preHydrationSceneScript } from "@/lib/pre-hydration-scene";
import { deriveTokens, sampleScene } from "@/lib/scene-engine";

describe("preHydrationSceneScript", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute("style");
  });

  function runAt(hour: number, minute: number) {
    vi.setSystemTime(new Date(2026, 6, 13, hour, minute));
    eval(preHydrationSceneScript); // required to execute the inline script exactly as a browser would
  }

  it("writes the five first-paint vars matching the engine's sample", () => {
    runAt(12, 30);
    const expected = sampleScene(12.5);
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--sky-top")).toBe(expected.top);
    expect(style.getPropertyValue("--sky-mid")).toBe(expected.mid);
    expect(style.getPropertyValue("--sky-hor")).toBe(expected.hor);
    expect(style.getPropertyValue("--ink")).toBe(expected.ink);
    expect(style.getPropertyValue("--sub")).toBe(expected.sub);
  });

  /**
   * The case the other two miss: 12:30 sits exactly ON the Midday keyframe
   * (t = 0), so it can't tell a real blend from "copy the nearest keyframe",
   * and the wrap case only checks one var. 10:15 lands mid-span — every one of
   * the five first-paint vars has to be an interpolated colour, and every one
   * has to match the engine the hydrated app then takes over with, or the
   * handoff flashes.
   */
  it("matches the engine on all five vars at a genuine fractional blend", () => {
    runAt(10, 15);
    const expected = sampleScene(10.25);
    expect(expected.t).toBeGreaterThan(0); // a real mid-span blend, not a keyframe
    expect(expected.t).toBeLessThan(1);

    const style = document.documentElement.style;
    expect(style.getPropertyValue("--sky-top")).toBe(expected.top);
    expect(style.getPropertyValue("--sky-mid")).toBe(expected.mid);
    expect(style.getPropertyValue("--sky-hor")).toBe(expected.hor);
    expect(style.getPropertyValue("--ink")).toBe(expected.ink);
    expect(style.getPropertyValue("--sub")).toBe(expected.sub);

    // and the ink/sub the script paints are the ones deriveTokens will keep
    const tokens = deriveTokens(expected);
    expect(style.getPropertyValue("--ink")).toBe(tokens.ink);
    expect(style.getPropertyValue("--sub")).toBe(tokens.sub);
  });

  it("matches the engine across the midnight wrap", () => {
    runAt(23, 0);
    expect(document.documentElement.style.getPropertyValue("--sky-top")).toBe(sampleScene(23).top);
  });

  it("never throws even if document is odd (script is try/catch-wrapped)", () => {
    expect(preHydrationSceneScript).toContain("try{");
    expect(preHydrationSceneScript).toContain("catch");
  });
});
