import { describe, expect, it } from "vitest";
import {
  activeIndexFor,
  cardOpacityFor,
  cardStrokeProgress,
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

  /* THE EQUAL-CELL FIX. Every card gets a whole cell of width 1/N — including
     the first. With 5 panels the cell is 0.2, and card 0 holds (index 0) from
     progress 0 through 0.5 dwell × 0.2 cell = 0.1, then eases away. It no longer
     gets a half-width band, which is what made the most recent study too quick. */
  it("gives the first card a full hold from the very start", () => {
    expect(dwelledIndex(0, 5, 0.5)).toBe(0);
    expect(dwelledIndex(0.05, 5, 0.5)).toBe(0); // still held, mid-hold
    expect(dwelledIndex(0.1, 5, 0.5)).toBeCloseTo(0, 5); // hold ends here
    expect(dwelledIndex(0.15, 5, 0.5)).toBeGreaterThan(0); // now easing to card 1
  });

  /* The last card holds through the entire final cell — there is no card after
     it to ease toward, so it stays put from the start of its cell to progress 1. */
  it("holds the last card across its whole final cell", () => {
    // 5 panels: card 4's cell is [0.8, 1]. It is centred throughout.
    expect(dwelledIndex(0.8, 5, 0.5)).toBe(4);
    expect(dwelledIndex(0.9, 5, 0.5)).toBe(4);
    expect(dwelledIndex(1, 5, 0.5)).toBe(4);
  });

  /* Within an interior cell the card holds for `dwell` of the cell, then eases.
     Card 1's cell is [0.2, 0.4]; at 0.5 dwell it holds until 0.2 + 0.1 = 0.3. */
  it("holds an interior card for the dwell fraction, then eases", () => {
    expect(dwelledIndex(0.25, 5, 0.5)).toBe(1); // within the hold
    expect(dwelledIndex(0.3, 5, 0.5)).toBeCloseTo(1, 5); // hold ends
    expect(dwelledIndex(0.35, 5, 0.5)).toBeGreaterThan(1); // easing to card 2
  });

  /* dwell 1 is a hard snap: the card holds its whole cell, then steps at the
     boundary. The degenerate smoothstep guard makes the transition a step. */
  it("snaps at dwell 1", () => {
    // 2 panels, cells [0,0.5] and [0.5,1]. Card 0 holds its whole first cell.
    expect(dwelledIndex(0.4, 2, 1)).toBe(0);
    expect(dwelledIndex(0.6, 2, 1)).toBe(1);
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

describe("cardStrokeProgress", () => {
  /* The stroke is empty until the card's cell begins, then traces across part of
     its hold and closes with hold to spare. With 5 panels (cell 0.2), dwell 0.9,
     strokeSpan 0.6: card 1's cell starts at 0.2, and the ring closes at
     0.2 + 0.6 × 0.9 × 0.2 = 0.308 — well before the hold ends at 0.38. */
  it("traces across part of the hold and closes early", () => {
    expect(cardStrokeProgress(0.2, 5, 1)).toBeCloseTo(0, 5); // cell start, empty
    expect(cardStrokeProgress(0.254, 5, 1)).toBeCloseTo(0.5, 2); // halfway
    expect(cardStrokeProgress(0.308, 5, 1)).toBeCloseTo(1, 2); // closed
  });

  /* THE BEAT. Once closed, the ring stays full through the rest of the hold —
     the card sits complete-and-still before it leaves, rather than being swept
     off the instant the ring shuts. */
  it("stays full after closing, through the beat", () => {
    expect(cardStrokeProgress(0.34, 5, 1)).toBe(1); // past close, still held
    expect(cardStrokeProgress(0.37, 5, 1)).toBe(1);
  });

  /* The first card's ring starts at progress 0 (its cell begins there), so the
     stroke is empty at rest and begins tracing the moment you scroll. */
  it("starts the first card's ring empty at rest", () => {
    expect(cardStrokeProgress(0, 5, 0)).toBe(0);
    expect(cardStrokeProgress(0.108, 5, 0)).toBeCloseTo(1, 2); // closed within its hold
  });

  /* Before a card's cell is reached its ring is empty, not partway. */
  it("is empty for a card the scroll has not reached", () => {
    expect(cardStrokeProgress(0, 5, 3)).toBe(0);
  });

  it("tracks the whole scroll for a single card", () => {
    expect(cardStrokeProgress(0.4, 1, 0)).toBeCloseTo(0.4, 5);
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
