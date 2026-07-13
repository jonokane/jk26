import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preHydrationSceneScript } from "@/lib/pre-hydration-scene";
import { sampleScene } from "@/lib/scene-engine";

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

  it("matches the engine across the midnight wrap", () => {
    runAt(23, 0);
    expect(document.documentElement.style.getPropertyValue("--sky-top")).toBe(sampleScene(23).top);
  });

  it("never throws even if document is odd (script is try/catch-wrapped)", () => {
    expect(preHydrationSceneScript).toContain("try{");
    expect(preHydrationSceneScript).toContain("catch");
  });
});
