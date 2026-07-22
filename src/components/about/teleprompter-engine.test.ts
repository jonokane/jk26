import { describe, expect, it } from "vitest";
import {
  activeCenter, blockStyle, focusFor, smoothstep, wordWeight,
} from "@/components/about/teleprompter-engine";
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";

describe("smoothstep", () => {
  it("clamps outside the edges and eases between them", () => {
    expect(smoothstep(0, 10, -5)).toBe(0);
    expect(smoothstep(0, 10, 15)).toBe(1);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
    expect(smoothstep(0, 10, 2.5)).toBeCloseTo(0.15625, 5);
  });
});

describe("focusFor", () => {
  it("is 1 at the focal center and 0 at the edge of the range", () => {
    expect(focusFor(0, 240)).toBe(1);
    expect(focusFor(240, 240)).toBe(0);
    expect(focusFor(-240, 240)).toBe(0);
  });

  it("is symmetric — distance decides focus, not direction", () => {
    expect(focusFor(-100, 240)).toBe(focusFor(100, 240));
  });
});

describe("blockStyle", () => {
  /* The asymmetry is the design: words ABOVE the focus (already read,
     delta < 0) blur hard but stay present; words BELOW (not yet read) stay
     sharp but recede. Read words go soft; unread words fade. */
  it("blurs already-read blocks harder than unread ones", () => {
    expect(blockStyle(-100, 0).blur).toBe(T.blurAbove);
    expect(blockStyle(100, 0).blur).toBe(T.blurBelow);
    expect(T.blurAbove).toBeGreaterThan(T.blurBelow);
  });

  it("keeps already-read blocks more visible than unread ones", () => {
    expect(blockStyle(-100, 0).opacity).toBe(T.opacityAbove);
    expect(blockStyle(100, 0).opacity).toBe(T.opacityBelow);
    expect(T.opacityAbove).toBeGreaterThan(T.opacityBelow);
  });

  it("resolves to sharp and opaque at full focus, from either side", () => {
    expect(blockStyle(-100, 1)).toEqual({ blur: 0, opacity: 1 });
    expect(blockStyle(100, 1)).toEqual({ blur: 0, opacity: 1 });
  });
});

describe("wordWeight", () => {
  /* Base is 400, NOT 440 — the README says 440, the prototype lerps from 400
     and 440 is the ambient TARGET (spec conflict register #6). */
  it("starts every role at the 400 floor when unfocused", () => {
    expect(wordWeight("ambient", 0)).toBe(T.weightFloor);
    expect(wordWeight("emphasis", 0)).toBe(T.weightFloor);
    expect(wordWeight("italic", 0)).toBe(T.weightFloor);
  });

  it("drives emphasis far heavier than ambient at full focus", () => {
    expect(wordWeight("ambient", 1)).toBe(T.weightAmbient);
    expect(wordWeight("emphasis", 1)).toBe(T.weightEmphasis);
    expect(wordWeight("italic", 1)).toBe(T.weightAmbient);
  });

  it("interpolates linearly with focus", () => {
    expect(wordWeight("emphasis", 0.5)).toBe((T.weightFloor + T.weightEmphasis) / 2);
  });
});

describe("activeCenter", () => {
  it("sweeps from the first block to the last across the scroll", () => {
    expect(activeCenter(100, 900, 0)).toBe(100);
    expect(activeCenter(100, 900, 1)).toBe(900);
    expect(activeCenter(100, 900, 0.5)).toBe(500);
  });
});

describe("TELEPROMPTER config", () => {
  /* These are tunables, not literals — Jono adjusts them by feel and that must
     stay a one-line edit in one file (spec §8). */
  it("carries the prototype's values", () => {
    expect(T.focalPosition).toBe(0.6);
    expect(T.focalRange).toBe(0.24);
    expect(T.blurAbove).toBe(7);
    expect(T.blurBelow).toBe(2);
    expect(T.opacityAbove).toBe(0.5);
    expect(T.opacityBelow).toBe(0.14);
    expect(T.weightFloor).toBe(400);
    expect(T.weightAmbient).toBe(440);
    expect(T.weightEmphasis).toBe(780);
  });
});

describe("degenerate focal range", () => {
  /* 0/0 at exactly x === edge0 — which is the block ON the focal center, i.e.
     the statement being read. NaN then flows into its weight and blur, and the
     browser silently drops blur(NaNpx) rather than complaining, so it would
     degrade invisibly. */
  it("never produces NaN when the focal range collapses to zero", () => {
    for (const delta of [-100, -1, 0, 1, 100]) {
      const focus = focusFor(delta, 0);
      expect(Number.isNaN(focus), `focusFor(${delta}, 0)`).toBe(false);
      const { blur, opacity } = blockStyle(delta, focus);
      expect(Number.isNaN(blur), `blur at ${delta}`).toBe(false);
      expect(Number.isNaN(opacity), `opacity at ${delta}`).toBe(false);
      for (const role of ["ambient", "emphasis", "italic"] as const) {
        expect(Number.isNaN(wordWeight(role, focus)), `${role} weight at ${delta}`).toBe(false);
      }
    }
  });

  it("collapses to a step function, the limit of a zero-width ramp", () => {
    expect(smoothstep(0, 0, -1)).toBe(0);
    expect(smoothstep(0, 0, 0)).toBe(1);
    expect(smoothstep(0, 0, 1)).toBe(1);
  });
});

describe("blockStyle interpolates linearly", () => {
  /* Endpoints alone cannot catch a broken SLOPE — a reversed or non-linear
     falloff preserving both ends would pass every other test here. */
  it("sits exactly halfway at half focus, both sides", () => {
    const above = blockStyle(-100, 0.5);
    expect(above.blur).toBeCloseTo(T.blurAbove / 2, 10);
    expect(above.opacity).toBeCloseTo((T.opacityAbove + 1) / 2, 10);

    const below = blockStyle(100, 0.5);
    expect(below.blur).toBeCloseTo(T.blurBelow / 2, 10);
    expect(below.opacity).toBeCloseTo((T.opacityBelow + 1) / 2, 10);
  });

  it("is monotonic — more focus is never blurrier or fainter", () => {
    let prevBlur = Infinity, prevOpacity = -Infinity;
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const { blur, opacity } = blockStyle(-100, f);
      expect(blur).toBeLessThanOrEqual(prevBlur);
      expect(opacity).toBeGreaterThanOrEqual(prevOpacity);
      prevBlur = blur; prevOpacity = opacity;
    }
  });
});
