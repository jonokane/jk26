import { describe, expect, it } from "vitest";
import {
  activeIndexFor,
  cardOpacityFor,
  dwelledIndex,
  focusOffset,
  linearProgress,
  scrollDeltaForPan,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";
import { WORK } from "@/components/work/work-config";

describe("travelFor", () => {
  /* Travel is the span between the outer card centres: from the first sitting at
     the focus to the last. focusX × innerWidth cancels, so it is pure geometry
     off the measured centres. */
  it("is the distance between the first and last card centres", () => {
    expect(travelFor([400, 1200, 2600])).toBe(2600 - 400);
  });

  /* One card (or none) has nowhere to travel — and centring it would be its own
     resting place regardless. */
  it("is 0 for a single card", () => {
    expect(travelFor([400])).toBe(0);
  });

  it("is 0 for no cards", () => {
    expect(travelFor([])).toBe(0);
  });
});

describe("wrapperHeightFor", () => {
  /* Prototype gap 1: 520vh was hardcoded and decoupled from travel, so the
     scroll-to-pixel rate drifted silently as studies were added or removed.
     Deriving it is the fix: the wrapper is one viewport of pin plus however
     much scroll the travel actually needs. */
  it("is one viewport plus the travel, scaled", () => {
    expect(wrapperHeightFor(2000, 800)).toBe(800 + 2000 * WORK.scrollPerPixel);
  });

  it("collapses to a single viewport when there is nothing to travel", () => {
    expect(wrapperHeightFor(0, 800)).toBe(800);
  });
});

describe("linearProgress", () => {
  it("is 0 at the top of the pin and 1 at the bottom", () => {
    expect(linearProgress(0, 2000, 800)).toBe(0);
    expect(linearProgress(-1200, 2000, 800)).toBe(1);
  });

  it("clamps outside the pin", () => {
    expect(linearProgress(500, 2000, 800)).toBe(0);
    expect(linearProgress(-9999, 2000, 800)).toBe(1);
  });

  /* wrapHeight === viewportHeight divides by zero. A wrapper with no scroll
     budget means "nothing to travel", so progress is 0 — NOT NaN, which would
     flow into the transform and be silently dropped by the browser. */
  it("returns 0 rather than NaN when the wrapper has no scroll budget", () => {
    expect(linearProgress(0, 800, 800)).toBe(0);
  });
});

describe("dwelledIndex", () => {
  /* The endpoints are exact whatever the dwell: progress 0 is card 0 centred,
     progress 1 is the last card centred. */
  it("pins the endpoints to the first and last card", () => {
    expect(dwelledIndex(0, 5, 0.5)).toBe(0);
    expect(dwelledIndex(1, 5, 0.5)).toBe(4);
  });

  /* At the midpoint of an odd panel count the middle card is exactly centred —
     smoothstep is symmetric about the segment midpoint. */
  it("passes through the middle card at half progress", () => {
    expect(dwelledIndex(0.5, 5, 0.5)).toBeCloseTo(2, 5);
  });

  /* THE DWELL. With a hold, a card holds at its integer index across a band of
     progress rather than only touching it at a point. Just before and after the
     boundary into card 1 (progress 0.25 of 5 panels), the index stays pinned at
     1 — you cannot be "between" cards there, which is what stops a card being
     scrolled past. */
  it("holds a card across a band of scroll, not just a point", () => {
    // segment 0->1 spans progress [0, 0.25]; a 0.5 dwell holds the outer quarter
    // of each segment, so from progress ~0.219 (s = 0.875) onward it reads 1.
    expect(dwelledIndex(0.23, 5, 0.5)).toBeCloseTo(1, 5);
    expect(dwelledIndex(0.25, 5, 0.5)).toBeCloseTo(1, 5);
    expect(dwelledIndex(0.27, 5, 0.5)).toBeCloseTo(1, 5);
  });

  /* dwell 0 is a smooth per-card ease, never a plateau: at s = 0.5 within a
     segment it sits exactly between the two cards. It is NOT linear (smoothstep),
     because motion on this site is eased — but it has no hold. */
  it("has no plateau at dwell 0, but still eases", () => {
    // 2 panels, one segment [0,1]. At progress 0.25, s = 0.25.
    const eased = dwelledIndex(0.25, 2, 0);
    expect(eased).toBeCloseTo(0.25 * 0.25 * (3 - 2 * 0.25), 5); // smoothstep(0,1,0.25)
    expect(eased).not.toBeCloseTo(0.25, 3); // and not the linear value
  });

  /* dwell 1 is a hard snap: the index steps from one card to the next at the
     segment midpoint, holding entirely otherwise. The degenerate smoothstep
     guard makes this a step rather than a 0/0. */
  it("snaps at dwell 1", () => {
    expect(dwelledIndex(0.2, 2, 1)).toBe(0); // s = 0.2 < 0.5 -> hold card 0
    expect(dwelledIndex(0.8, 2, 1)).toBe(1); // s = 0.8 > 0.5 -> hold card 1
  });

  it("is 0 for a single panel", () => {
    expect(dwelledIndex(0.7, 1, 0.5)).toBe(0);
  });
});

describe("focusOffset", () => {
  /* Centring card 0 puts its centre at focusX × innerWidth; the offset is the
     shift that gets it there. With focusX 0.5, innerWidth 1000, first centre 400:
     0.5×1000 − 400 = 100 (positive, the track shifts right to bring it in). */
  it("centres the first card at the focus", () => {
    expect(focusOffset([400, 1200], 0, 1000)).toBeCloseTo(500 - 400, 5);
  });

  it("centres the last card at the focus", () => {
    expect(focusOffset([400, 1200], 1, 1000)).toBeCloseTo(500 - 1200, 5);
  });

  /* A fractional index rides the interpolated point between two centres — this
     is what makes the transition a glide. Halfway between 400 and 1200 is 800. */
  it("rides the interpolated centre between two cards", () => {
    expect(focusOffset([400, 1200], 0.5, 1000)).toBeCloseTo(500 - 800, 5);
  });

  it("is 0 for no cards", () => {
    expect(focusOffset([], 0, 1000)).toBe(0);
  });
});

describe("activeIndexFor", () => {
  /* The counter names the card the focus is nearest. Each card is genuinely
     centred at focus during its dwell, so rounding the fractional index agrees
     with the eye by construction. */
  it("rounds the fractional index to the nearest card", () => {
    expect(activeIndexFor(1.4)).toBe(1);
    expect(activeIndexFor(1.6)).toBe(2);
  });

  it("is 0 at the start", () => {
    expect(activeIndexFor(0)).toBe(0);
  });
});

describe("cardOpacityFor", () => {
  it("is full inside the focal band and dim outside it", () => {
    expect(cardOpacityFor(0, 1000)).toBe(1);
    expect(cardOpacityFor(549, 1000)).toBe(1);
    expect(cardOpacityFor(551, 1000)).toBe(WORK.cardDimOpacity);
  });

  /* Distance is unsigned: a card the same way off to the left reads the same. */
  it("does not care which side of the focus the card is on", () => {
    expect(cardOpacityFor(-800, 1000)).toBe(cardOpacityFor(800, 1000));
  });
});

describe("scrollDeltaForPan", () => {
  /* The pan converts a pixel of finger into the scroll that moves the track a
     pixel on average (budget / travel), so panning and scrolling stay one hand. */
  it("moves the track a pixel per pixel of gesture on average", () => {
    const wrapHeight = 2000, vh = 800, travel = 1200;
    const delta = scrollDeltaForPan(120, wrapHeight, vh, travel);
    // budget = wrapHeight - vh = 1200 = travel, so the average rate is 1:1.
    expect(delta).toBeCloseTo(120, 5);
  });

  it("is 0 when there is no travel, so a pan cannot scroll the page sideways-by-proxy", () => {
    expect(scrollDeltaForPan(120, 2000, 800, 0)).toBe(0);
  });

  it("keeps the sign, so panning left goes back", () => {
    expect(scrollDeltaForPan(-120, 2000, 800, 1200)).toBeCloseTo(
      -scrollDeltaForPan(120, 2000, 800, 1200),
      5,
    );
  });
});
