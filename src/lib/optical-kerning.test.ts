import { afterEach, describe, expect, it } from "vitest";
import {
  __resetKernCacheForTests,
  letterMargins,
  measureGlyphInk,
  opticalKerns,
  pairGap,
  scanOpticalKerns,
  stretchKeyword,
  wordmarkLetterMargins,
  type GlyphInk,
} from "@/lib/optical-kerning";
import { WORDMARK_TEXT, wordmarkConfig } from "@/lib/wordmark-config";

const glyph = (left: number, right: number, advance: number): GlyphInk => ({
  left,
  right,
  advance,
});

/** Three glyphs whose visual gaps are deliberately uneven: A·B 0.20, B·C 0.05. */
const INK: Record<string, GlyphInk> = {
  A: glyph(0.05, 0.9, 1.0), // right sidebearing 0.10
  B: glyph(0.1, 0.85, 0.95), // left 0.10, right sidebearing 0.10
  C: glyph(-0.05, 0.8, 0.9),
};

const SCAN_FACE = {
  family: wordmarkConfig.family,
  weight: wordmarkConfig.axes.wght,
  wdth: wordmarkConfig.axes.wdth,
};

describe("pairGap", () => {
  it("is A's right sidebearing plus B's left sidebearing", () => {
    // A: advance 1.0, right edge 0.9 → 0.10 trailing.  B: left edge 0.10.
    expect(pairGap(INK.A, INK.B)).toBeCloseTo(0.2, 10);
  });
  it("goes negative when the next glyph's ink overhangs its origin", () => {
    // B: 0.95 − 0.85 = 0.10 trailing.  C: left edge −0.05 → tucks under.
    expect(pairGap(INK.B, INK.C)).toBeCloseTo(0.05, 10);
  });
});

describe("opticalKerns", () => {
  it("equalizes every pair's visual gap to the mean", () => {
    const kerns = opticalKerns("ABC", INK)!;
    const gaps = [pairGap(INK.A, INK.B), pairGap(INK.B, INK.C)];
    const mean = (gaps[0] + gaps[1]) / 2;
    expect(gaps[0] + kerns[0]).toBeCloseTo(mean, 10);
    expect(gaps[1] + kerns[1]).toBeCloseTo(mean, 10);
    // the wide pair tucks in, the tight pair opens up
    expect(kerns[0]).toBeLessThan(0);
    expect(kerns[1]).toBeGreaterThan(0);
  });

  /* Load-bearing for the header morph and the type lockup: they measure the
     wordmark's total width, and a kern set that summed to anything but zero
     would silently move the rect they FLIP between. */
  it("sums to zero — it redistributes width, it never adds any", () => {
    const kerns = opticalKerns("ABC", INK)!;
    expect(kerns.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 10);
  });

  it("returns all-zero kerns when the gaps are already even", () => {
    const even = { X: glyph(0.1, 0.9, 1.0), Y: glyph(0.1, 0.9, 1.0) };
    expect(opticalKerns("XYX", even)!.every((k) => Math.abs(k) < 1e-12)).toBe(true);
  });

  it("returns null rather than half-right spacing when a glyph is missing", () => {
    expect(opticalKerns("ABZ", INK)).toBeNull();
  });

  it("has no pairs to kern in a one-letter word", () => {
    expect(opticalKerns("A", INK)).toEqual([]);
  });
});

describe("letterMargins", () => {
  const nudges = [30, 0, 165] as const;

  it("never puts a margin on the first letter", () => {
    expect(letterMargins("ABCD", [0.01, 0.02, 0.03], nudges)[0]).toBe(0);
  });

  it("sums the optical base and the hand nudge (nudges are thousandths of an em)", () => {
    const margins = letterMargins("ABCD", [0.01, 0.02, -0.05], nudges);
    expect(margins[1]).toBeCloseTo(0.01 + 0.03, 10);
    expect(margins[2]).toBeCloseTo(0.02 + 0, 10);
    expect(margins[3]).toBeCloseTo(-0.05 + 0.165, 10);
  });

  /* The shipped bug, pinned: the nudges alone are NOT the kern. This is the
     fallback path only (no font / no canvas / server) — never the happy one. */
  it("falls back to the nudges alone when there is no optical base", () => {
    const margins = letterMargins("ABCD", null, nudges);
    expect(margins).toEqual([0, 0.03, 0, 0.165]);
  });
});

describe("stretchKeyword", () => {
  it("maps the wordmark's 195-wide stance to ultra-expanded", () => {
    expect(stretchKeyword(wordmarkConfig.axes.wdth)).toBe("ultra-expanded");
  });
  it("maps the axis range onto the CSS keywords", () => {
    expect(stretchKeyword(100)).toBe("normal");
    expect(stretchKeyword(106)).toBe("semi-expanded");
    expect(stretchKeyword(112)).toBe("expanded");
    expect(stretchKeyword(137)).toBe("extra-expanded");
    expect(stretchKeyword(162)).toBe("ultra-expanded");
  });
});

/* jsdom has no FontFaceSet and no canvas 2D context — which is exactly the
   "font isn't usable" condition the scan has to survive on a real browser too. */
describe("the scan without a usable font (jsdom ≈ SSR / font failure)", () => {
  afterEach(() => __resetKernCacheForTests());

  it("measures nothing rather than trusting the fallback face", () => {
    expect(measureGlyphInk(WORDMARK_TEXT, SCAN_FACE)).toBeNull();
    expect(scanOpticalKerns(WORDMARK_TEXT, SCAN_FACE)).toBeNull();
  });

  it("still kerns the wordmark with the hand nudges — never breaks it", () => {
    const margins = wordmarkLetterMargins(true);
    expect(margins).toHaveLength(WORDMARK_TEXT.length);
    expect(margins).toEqual(wordmarkLetterMargins(false));
  });
});

describe("wordmarkLetterMargins (no font yet: the server + first-paint markup)", () => {
  it("is the hand nudges alone, one margin per letter", () => {
    const margins = wordmarkLetterMargins(false);
    expect(margins).toHaveLength(WORDMARK_TEXT.length); // JONOKANE → 8
    expect(margins[0]).toBe(0);
    expect(margins.slice(1)).toEqual(wordmarkConfig.pairKernsMem.map((n) => n / 1000));
  });
});
