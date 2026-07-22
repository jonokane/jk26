/**
 * Every tunable in the Work gallery (spec §9), one file, one line each.
 *
 * Jono adjusts these by feel. That must stay a one-line edit in one file, so
 * nothing here may be duplicated as a literal in a component or a stylesheet.
 * Numbers the CSS owns are NOT listed here — a config entry that tunes nothing
 * is worse than no entry (Phase 3 shipped three of those). Card geometry lives
 * in work.module.css because CSS is the only thing that reads it.
 */
export const WORK = {
  /**
   * How much of each card's scroll CELL is spent holding it dead-center, versus
   * easing on to the next. Every card — first and last included — gets an equal
   * cell, so the most recent study dwells exactly as long as the rest (it used
   * to get a half-width band and so the least focus of all, which is why it was
   * the easiest to miss). At 0 the pan is a continuous skim; toward 1 each card
   * holds, then snaps. Jono's dial — 0.9 is a long hold with a quick handoff.
   */
  dwell: 0.9,

  /**
   * What fraction of a card's HOLD the perimeter stroke takes to close. Below 1
   * the ring finishes with hold to spare, so the card sits complete-and-still
   * for a beat before it leaves — the "let me look at it" moment the stroke
   * completing is meant to reward. 1 would close the ring exactly as the card
   * departs, which reads as being rushed off. Lower = longer beat.
   */
  strokeSpan: 0.6,

  /**
   * Where the active card centers, as a fraction of viewport width. 0.5 is dead
   * center; lower nudges it left so the next card peeks in further on the right.
   * The horizontal analog of the teleprompter's `focalPosition`.
   */
  focusX: 0.5,

  /** Vertical scroll spent per pixel of horizontal travel. 1 means a pixel of
   *  scroll moves a card a pixel; higher makes the gallery feel heavier and the
   *  section taller. The prototype hardcoded 520vh and let this drift. */
  scrollPerPixel: 1,

  /** A card at full opacity sits within this fraction of viewport width of the
   *  focus. Spec §9: `0.55 × innerWidth`. */
  focalBand: 0.55,

  /** What a card outside the focal band fades to. Spec §9: 0.42. */
  cardDimOpacity: 0.42,
} as const;
