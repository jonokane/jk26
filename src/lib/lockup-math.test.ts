import { describe, expect, it } from "vitest";
import { computeLockup, type LockupTunables } from "@/lib/lockup-math";
import { wordmarkConfig } from "@/lib/wordmark-config";

const base = {
  availPx: 1000,
  wordmarkPx: 900,
  wordmarkFontPx: 100,
  jonoPx: 450,
  kickerPx: 600,
  kickerFontPx: 16,
  taglinePxAt100: 2000,
  viewportPx: 1440,
};

/** Ratio-only tunables: isolates the lockup math from the legibility floors. */
const noFloors: LockupTunables = {
  taglineFill: 0.995,
  minKickerPx: 0,
  minTaglinePx: 0,
  narrowMaxPx: 0,
};

/**
 * A real 375px phone, measured in the browser: 7vw wordmark (26.25px) whose
 * natural width overflows the 322.5px content box, the tagline single line
 * running ~6150px at a 100px font. These are the inputs that produced the
 * 3.8px kicker / 5.2px tagline the floors exist to stop — the desktop-only
 * fixtures above are exactly why that shipped.
 */
const phone = {
  availPx: 322.5,
  wordmarkPx: 620,
  wordmarkFontPx: 26.25,
  jonoPx: 310,
  kickerPx: 587,
  kickerFontPx: 14,
  taglinePxAt100: 6150,
  viewportPx: 375,
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
    expect(computeLockup(base, noFloors).kickerFontPx).toBeCloseTo(12, 5);
  });

  it("scales the kicker against the SHRUNK jono width when the wordmark shrinks", () => {
    const r = computeLockup({ ...base, wordmarkPx: 2000 }, noFloors); // scale 0.5 → jono 225
    expect(r.kickerFontPx).toBeCloseTo((16 * 225) / 600, 5);
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

  it("falls back to base sizes when availPx is zero (transient layout)", () => {
    const r = computeLockup({ ...base, availPx: 0 });
    expect(r.wordmarkFontPx).toBe(100);
    expect(r.kickerFontPx).toBeGreaterThan(0);
    expect(r.taglineFontPx).toBeGreaterThan(0);
  });

  it("keeps the kicker size when jonoPx is zero", () => {
    const r = computeLockup({ ...base, jonoPx: 0 });
    expect(r.kickerFontPx).toBe(16);
  });

  it("holds the one-line lockup at desktop scale (no floor, no wrap)", () => {
    const r = computeLockup(base);
    expect(r.narrow).toBe(false);
    expect(r.kickerFontPx).toBeGreaterThanOrEqual(wordmarkConfig.lockup.minKickerPx);
    expect(r.taglineFontPx).toBeGreaterThanOrEqual(wordmarkConfig.lockup.minTaglinePx);
  });
});

describe("computeLockup — legibility floors at phone scale", () => {
  const { minKickerPx, minTaglinePx, narrowMaxPx } = wordmarkConfig.lockup;

  it("would squeeze the kicker and tagline to nothing without the floors", () => {
    const raw = computeLockup(phone, noFloors);
    expect(raw.kickerFontPx).toBeLessThan(5); // the shipped bug: ~3.8px
    expect(raw.taglineFontPx).toBeLessThan(6); // the shipped bug: ~5.2px
  });

  it("floors both at legible sizes on a 375px phone", () => {
    const r = computeLockup(phone);
    expect(r.kickerFontPx).toBe(minKickerPx);
    expect(r.taglineFontPx).toBe(minTaglinePx);
    expect(r.kickerFontPx).toBeGreaterThanOrEqual(12);
    expect(r.taglineFontPx).toBeGreaterThanOrEqual(16);
  });

  it("flips the narrow flag below the breakpoint so the lines may wrap", () => {
    expect(computeLockup(phone).narrow).toBe(true);
    expect(computeLockup({ ...phone, viewportPx: 390 }).narrow).toBe(true);
    expect(computeLockup({ ...phone, viewportPx: narrowMaxPx }).narrow).toBe(true);
  });

  it("still floors (and wraps) a mid-size viewport where one line would be tiny", () => {
    // 1000px viewport: the one-line tagline computes to ~13.9px — under the floor.
    const mid = { ...phone, availPx: 860, wordmarkPx: 1600, viewportPx: 1000, jonoPx: 800 };
    const r = computeLockup(mid);
    expect(r.taglineFontPx).toBe(minTaglinePx);
    expect(r.narrow).toBe(true); // a floor and a one-line lock cannot both hold
  });

  it("never shrinks the wordmark below the measure it was given", () => {
    const r = computeLockup(phone);
    expect(r.wordmarkFontPx).toBeCloseTo(26.25 * (322.5 / 620), 5);
  });
});
