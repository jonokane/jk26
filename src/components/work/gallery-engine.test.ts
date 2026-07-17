import { describe, expect, it } from "vitest";
import {
  activeIndexFor,
  cardOpacityFor,
  linearProgress,
  scrollDeltaForPan,
  trackOffsetFor,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";
import { WORK } from "@/components/work/work-config";

describe("travelFor", () => {
  /* Spec §9: travel = max(0, scrollWidth - innerWidth + innerWidth * 0.06).
     The trailing 6vw is the gutter the last card needs so it is not flush. */
  it("is the overhang plus a trailing gutter", () => {
    expect(travelFor(3000, 1000)).toBe(3000 - 1000 + 60);
  });

  /* A track narrower than the viewport must not travel BACKWARDS. Without the
     max(0) the transform would push the cards off to the right. */
  it("never goes negative when the track fits on screen", () => {
    expect(travelFor(500, 1000)).toBe(0);
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

  it("is linear in between, with no easing", () => {
    expect(linearProgress(-600, 2000, 800)).toBeCloseTo(0.5, 5);
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

describe("trackOffsetFor", () => {
  it("is negative, so progress moves the track left", () => {
    expect(trackOffsetFor(0.5, 2000)).toBe(-1000);
  });
});

describe("activeIndexFor", () => {
  /* Spec §9: the active card is the one nearest the viewport's horizontal
     centre — deliberately NOT derived from progress, which would drift from
     what the eye reports as cards enter and leave. */
  it("is the card whose centre is nearest the viewport centre", () => {
    expect(activeIndexFor([100, 480, 900], 1000)).toBe(1);
  });

  it("is 0 when there are no cards", () => {
    expect(activeIndexFor([], 1000)).toBe(0);
  });

  it("takes the first of two equidistant cards, never a tie", () => {
    expect(activeIndexFor([400, 600], 1000)).toBe(0);
  });
});

describe("cardOpacityFor", () => {
  it("is full inside the focal band and dim outside it", () => {
    expect(cardOpacityFor(0, 1000)).toBe(1);
    expect(cardOpacityFor(549, 1000)).toBe(1);
    expect(cardOpacityFor(551, 1000)).toBe(WORK.cardDimOpacity);
  });

  /* Distance is unsigned: a card the same way off to the left reads the same. */
  it("does not care which side of centre the card is on", () => {
    expect(cardOpacityFor(-800, 1000)).toBe(cardOpacityFor(800, 1000));
  });
});

describe("scrollDeltaForPan", () => {
  /* Spec §9: horizontal input pans by driving VERTICAL scroll, because
     translateX is derived from scrollY. This is the exact inverse of
     trackOffsetFor, so one pixel of finger is one pixel of card. */
  it("is the inverse of the translate, so a pixel of gesture is a pixel of card", () => {
    const wrapHeight = 2000, vh = 800, travel = 1200;
    const delta = scrollDeltaForPan(120, wrapHeight, vh, travel);
    const before = linearProgress(0, wrapHeight, vh);
    const after = linearProgress(-delta, wrapHeight, vh);
    const moved = trackOffsetFor(before, travel) - trackOffsetFor(after, travel);
    expect(moved).toBeCloseTo(120, 5);
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
