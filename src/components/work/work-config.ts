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
   * How much of each card's scroll band is spent HOLDING it at the focus, versus
   * easing to the next. The fix for "the most recent study is easy to scroll
   * past": at 0 the pan is a smooth continuous skim and every card slides by at
   * the same speed; toward 1 each card holds at the focus and then snaps, so you
   * cannot cross a card without scrolling through its dwell. This is the dial
   * Jono tunes by feel — 0.5 is a deliberate hold that still flows.
   */
  dwell: 0.5,

  /**
   * Where the active card centres, as a fraction of viewport width. 0.5 is dead
   * centre; lower nudges it left so the next card peeks in further on the right.
   * The horizontal analogue of the teleprompter's `focalPosition`.
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
