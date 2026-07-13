import { describe, expect, it } from "vitest";
import { computeLockup } from "@/lib/lockup-math";

const base = {
  availPx: 1000,
  wordmarkPx: 900,
  wordmarkFontPx: 100,
  jonoPx: 450,
  kickerPx: 600,
  kickerFontPx: 16,
  taglinePxAt100: 2000,
};

describe("computeLockup", () => {
  it("keeps the wordmark size when it fits", () => {
    expect(computeLockup(base).wordmarkFontPx).toBe(100);
  });

  it("shrinks (never grows) the wordmark to the available width", () => {
    const r = computeLockup({ ...base, wordmarkPx: 2000 });
    expect(r.wordmarkFontPx).toBeCloseTo(50, 5); // 100 * 1000/2000
    const r2 = computeLockup({ ...base, wordmarkPx: 500 });
    expect(r2.wordmarkFontPx).toBe(100); // no expansion
  });

  it("locks the kicker to the JONO segment width", () => {
    // kicker at 16px is 600px wide; JONO is 450px → 16 * 450/600 = 12
    expect(computeLockup(base).kickerFontPx).toBeCloseTo(12, 5);
  });

  it("scales the kicker against the SHRUNK jono width when the wordmark shrinks", () => {
    const r = computeLockup({ ...base, wordmarkPx: 2000 }); // scale 0.5 → jono 225
    expect(r.kickerFontPx).toBeCloseTo(16 * 225 / 600, 5);
  });

  it("fits the tagline to one line spanning the full wordmark width", () => {
    // full width 900 (fits) → 100px-font line is 2000px → 100 * (900*0.995)/2000
    expect(computeLockup(base).taglineFontPx).toBeCloseTo((900 * 0.995) / 20, 5);
  });

  it("guards degenerate measurements by returning current sizes", () => {
    const r = computeLockup({ ...base, kickerPx: 0, taglinePxAt100: 0 });
    expect(r.kickerFontPx).toBe(16);
    expect(r.taglineFontPx).toBeGreaterThan(0);
  });
});
