/**
 * The collector's tunables (spec §7): the geometry and the timing of the
 * intro-beat choreography. Single source of truth — `collector-math.ts` is a
 * pure function of these, and `use-collector.ts` only wires them to the
 * scroll, so retuning the piece never means editing a component.
 *
 * Geometry lives here rather than in CSS because it is *interpolated*: a
 * transform can only be scrubbed in JS. Everything that CSS can own (the
 * section's travel, the beat's width and type scale, the tray hint's styling)
 * stays in `about.module.css`.
 *
 * Positions are viewport units — vw for x, vh for y — exactly as the approved
 * prototype expressed them; the math resolves them to px, which is what a
 * transform interpolates in. `transform-origin` is top-left, so x/y place the
 * beat's top-left corner and `scale` shrinks it toward that corner.
 */

/**
 * Where a beat comes to rest once every beat has been read.
 *
 * Two finishes, because the same ending does not work on both screens.
 */
export type CollectorFinish =
  /**
   * Desktop: the tray unpacks into the 2×2 About wall, inside the sticky
   * stage, at 0.55 — where the display-sized statement lands back at reading
   * size. The prototype's geometry, which Jono approved.
   */
  | { kind: "wall"; topVh: number; rowVh: number; colVw: number; cols: number; scale: number }
  /**
   * Phone: the section un-pins and the beats fly home into the document, which
   * is then read by scrolling — heading, lede, four full-size slabs, CTAs.
   *
   * A wall cannot work here. Four legible statements plus the heading, the lede
   * and the CTA footer do not fit a 100vh phone stage at any scale; the closest
   * fit put the statements at ~0.42, which is glanced at, not read. Jono's call:
   * the wall is read. So on a phone the collector is a *presentation* of the
   * beats, and the document underneath is where they live.
   */
  | { kind: "flow" };

/** Where a single beat sits in each of its poses. */
export interface CollectorLayout {
  /** Left gutter; matches the section's 7vw gutter. */
  insetVw: number;
  /** Parked below the fold — where a beat rises from. */
  upVh: number;
  /** Center stage: the reading position, full size, clear canvas. */
  activeVh: number;
  /** The tray along the bottom edge, where read beats are pocketed as tokens. */
  trayVh: number;
  trayStepVw: number;
  trayScale: number;
  trayOpacity: number;
  finish: CollectorFinish;
}

/**
 * The phone breakpoint — as a media query, not a number.
 *
 * JS and CSS have to agree on which side of it we are, and they measure
 * differently: `innerWidth` counts a classic scrollbar, a media query does not.
 * Comparing a number against `innerWidth` puts the two out of step in a ~15px
 * band, where the CSS lays out one collector and the math poses the other.
 * Asking the same media query CSS is asking cannot disagree with it.
 */
export const PHONE_QUERY = "(max-width: 760px)";

/** The prototype's numbers, unchanged. */
export const desktopLayout: CollectorLayout = {
  insetVw: 7,
  upVh: 108,
  activeVh: 30,
  trayVh: 86,
  trayStepVw: 13.5,
  trayScale: 0.22,
  trayOpacity: 0.9,
  finish: { kind: "wall", topVh: 28, rowVh: 24, colVw: 36, cols: 2, scale: 0.55 },
};

/**
 * Phone (spec §12: shortened travel, single column). The beat is the document's
 * own slab — full width, document type — so center stage is exactly what the
 * reader will read again below, and the flight home is seamless.
 */
export const phoneLayout: CollectorLayout = {
  insetVw: 7,
  upVh: 108,
  activeVh: 24,
  trayVh: 87,
  trayStepVw: 21,
  trayScale: 0.22,
  trayOpacity: 0.9,
  finish: { kind: "flow" },
};

export function layoutFor(isPhone: boolean): CollectorLayout {
  return isPhone ? phoneLayout : desktopLayout;
}

/**
 * When things happen, in units of scroll progress `p` through the collector.
 *
 * The prototype snapped between four discrete states with CSS transitions;
 * spec §14 requires the motion be scrubbed instead, so each state boundary
 * becomes a window the beat travels through. A beat owns one segment of `p`
 * (`1 / (beats + 1)`), and inside its own segment it rises, holds, and pockets.
 */
export interface CollectorTiming {
  /** Fraction of a beat's segment spent rising from below into center stage. */
  rise: number;
  /** Fraction of its segment spent flying from center stage into the tray. */
  pocket: number;
  /** Progress one beat's flight home (to the wall, or to the document) takes. */
  assembleSpan: number;
  /** Progress between consecutive flights — the prototype's ~70ms stagger. */
  assembleStagger: number;
  /** Progress the "collected" hint takes to fade in (and back out at assembly). */
  hintFadeSpan: number;
  /** Heading + lede + footer fade, as progress offsets past the assembly point. */
  revealFrom: number;
  revealTo: number;
}

export const collectorTiming: CollectorTiming = {
  rise: 0.35,
  pocket: 0.25,
  assembleSpan: 0.09,
  assembleStagger: 0.018,
  hintFadeSpan: 0.03,
  revealFrom: 0.06,
  revealTo: 0.14,
};

/**
 * Snap feel (spec §7: each beat clicks into place rather than drifting past).
 * Driven through Lenis — see the note in use-collector.ts.
 */
export const collectorSnap = {
  /** Seconds for the flight to the resting place. */
  durationSec: 0.55,
  /** How long the scroll must be quiet before we call it stopped. */
  settleMs: 130,
  /**
   * Deadzone around the beat the reader is resting on, as a fraction of a
   * segment: below this they have not moved on, they have twitched. (Landing a
   * single pixel past a beat's center is enough to read as "scrolling down",
   * and without a deadzone that flings them a whole beat forward.)
   */
  tolerance: 0.05,
} as const;
