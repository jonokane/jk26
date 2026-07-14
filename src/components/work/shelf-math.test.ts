import { describe, expect, it } from "vitest";
import {
  SCROLL_PER_PANEL,
  panelIndexFromProgress,
  panelProgress,
  scrollForPanel,
  shelfScrollDistance,
  snapIncrement,
  trackDistance,
  trackX,
} from "@/components/work/shelf-math";

const PANELS = 12; // three published studies x four panels

describe("shelfScrollDistance", () => {
  it("pins for one span of scroll per gap between panels", () => {
    expect(shelfScrollDistance(PANELS, 1000)).toBe(11 * 1000 * SCROLL_PER_PANEL);
  });

  it("is zero for a shelf with nothing to travel", () => {
    expect(shelfScrollDistance(1, 1000)).toBe(0);
    expect(shelfScrollDistance(0, 1000)).toBe(0);
  });
});

describe("trackDistance / trackX", () => {
  it("travels every panel but the last across the viewport", () => {
    expect(trackDistance(PANELS, 1440)).toBe(11 * 1440);
  });

  it("moves the track left, from 0 to the full distance", () => {
    expect(trackX(0, PANELS, 1440)).toBe(0);
    expect(trackX(1, PANELS, 1440)).toBe(-11 * 1440);
    expect(trackX(0.5, PANELS, 1440)).toBe(-5.5 * 1440);
  });

  it("clamps progress that overshoots either end (ScrollTrigger scrub can)", () => {
    expect(trackX(-0.3, PANELS, 1440)).toBe(0);
    expect(trackX(1.4, PANELS, 1440)).toBe(-11 * 1440);
  });
});

describe("panelProgress", () => {
  it("spaces the panels evenly across the pinned run", () => {
    expect(panelProgress(0, PANELS)).toBe(0);
    expect(panelProgress(11, PANELS)).toBe(1);
    expect(panelProgress(4, PANELS)).toBeCloseTo(4 / 11);
  });

  it("clamps an out-of-range index and never divides by zero", () => {
    expect(panelProgress(99, PANELS)).toBe(1);
    expect(panelProgress(-1, PANELS)).toBe(0);
    expect(panelProgress(0, 1)).toBe(0);
  });
});

describe("panelIndexFromProgress", () => {
  it("reports the nearest panel — the one the shelf snapped to", () => {
    expect(panelIndexFromProgress(0, PANELS)).toBe(0);
    expect(panelIndexFromProgress(1, PANELS)).toBe(11);
    expect(panelIndexFromProgress(4 / 11, PANELS)).toBe(4);
  });

  it("rounds mid-transition rather than flickering between panels", () => {
    expect(panelIndexFromProgress(3.4 / 11, PANELS)).toBe(3);
    expect(panelIndexFromProgress(3.6 / 11, PANELS)).toBe(4);
  });

  it("round-trips with panelProgress for every panel", () => {
    for (let i = 0; i < PANELS; i++) {
      expect(panelIndexFromProgress(panelProgress(i, PANELS), PANELS)).toBe(i);
    }
  });

  it("clamps overshoot and degenerate shelves", () => {
    expect(panelIndexFromProgress(1.6, PANELS)).toBe(11);
    expect(panelIndexFromProgress(-2, PANELS)).toBe(0);
    expect(panelIndexFromProgress(0.7, 1)).toBe(0);
  });
});

describe("snapIncrement", () => {
  it("is one panel apart in progress space", () => {
    expect(snapIncrement(PANELS)).toBeCloseTo(1 / 11);
  });

  it("is 0 — snapping off — when there is nowhere to snap", () => {
    expect(snapIncrement(1)).toBe(0);
    expect(snapIncrement(0)).toBe(0);
  });
});

describe("scrollForPanel", () => {
  it("maps a panel onto the document scroll inside the pinned range", () => {
    expect(scrollForPanel(0, PANELS, 2000, 13000)).toBe(2000);
    expect(scrollForPanel(11, PANELS, 2000, 13000)).toBe(13000);
    expect(scrollForPanel(4, PANELS, 2000, 13000)).toBeCloseTo(2000 + (4 / 11) * 11000);
  });
});
