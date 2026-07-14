/**
 * The collector's tunables (spec §7): the geometry and the timing of the
 * intro-beat choreography. Single source of truth — `collector-math.ts` is a
 * pure function of these, and `use-collector.ts` only wires them to the
 * scroll, so retuning the piece never means editing a component.
 *
 * Geometry lives here rather than in CSS because it is *interpolated*: a
 * transform can only be scrubbed in JS. Everything that CSS can own (the
 * section's travel height, the beat's width and type scale, the tray hint's
 * styling) stays in `about.module.css`.
 *
 * Positions are viewport units — vw for x, vh for y — exactly as the approved
 * prototype expressed them; the math resolves them to px, which is what a
 * transform interpolates in. `transform-origin` is top-left, so x/y place the
 * beat's top-left corner and `scale` shrinks it toward that corner.
 */

/** Where a single beat sits in each of its four poses. */
export interface CollectorLayout {
  /** Left gutter of the stage; matches the section's 7vw gutter. */
  insetVw: number;
  /** Parked below the fold — where a beat rises from and is clipped. */
  upVh: number;
  /** Center stage: the reading position, full size, clear canvas. */
  activeVh: number;
  /** The tray along the bottom edge, where read beats are pocketed as tokens. */
  trayVh: number;
  trayStepVw: number;
  trayScale: number;
  trayOpacity: number;
  /** The assembled About wall the tray unpacks into. */
  wallTopVh: number;
  wallRowVh: number;
  wallColVw: number;
  wallCols: number;
  wallScale: number;
}

/** Phone layout below this width — matches the `.wall` breakpoint in about.module.css. */
export const MOBILE_MAX_PX = 760;

/** The prototype's numbers, unchanged (Jono approved this geometry). */
export const desktopLayout: CollectorLayout = {
  insetVw: 7,
  upVh: 108,
  activeVh: 30,
  trayVh: 86,
  trayStepVw: 13.5,
  trayScale: 0.22,
  trayOpacity: 0.9,
  wallTopVh: 28,
  wallRowVh: 24,
  wallColVw: 36,
  wallCols: 2,
  wallScale: 0.55,
};

/**
 * Phone geometry (spec §12: single column, shortened travel). The beat is
 * wider (86vw) and its type smaller, so center stage still reads at arm's
 * length. The wall keeps the 2×2 composition — a single column of four cards
 * cannot fit a 100vh stage under the heading, the lede and the CTA footer at
 * any scale, and a column of receipt-thin cards reads worse than the grid the
 * desktop wall establishes. At 0.42 the assembled wall is a *record* of the
 * four statements the reader has just read full-size, not a second chance to
 * read them; the statements themselves are delivered center stage.
 */
export const mobileLayout: CollectorLayout = {
  insetVw: 7,
  upVh: 108,
  activeVh: 24,
  trayVh: 87,
  trayStepVw: 21,
  trayScale: 0.22,
  trayOpacity: 0.9,
  wallTopVh: 40,
  wallRowVh: 17,
  wallColVw: 45,
  wallCols: 2,
  wallScale: 0.42,
};

export function layoutFor(viewportWidth: number): CollectorLayout {
  return viewportWidth <= MOBILE_MAX_PX ? mobileLayout : desktopLayout;
}

/**
 * When things happen, in units of scroll progress `p` through the section.
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
  /** Progress one beat's tray → wall flight takes. */
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
