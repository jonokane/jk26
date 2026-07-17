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
  /** Trailing gutter past the last card, as a fraction of viewport width, so it
   *  does not sit flush to the edge. Spec §9: `innerWidth * 0.06` = the 6vw inset. */
  trailingGutter: 0.06,

  /** Vertical scroll spent per pixel of horizontal travel. 1 means a pixel of
   *  scroll moves a card a pixel; higher makes the gallery feel heavier and the
   *  section taller. The prototype hardcoded 520vh and let this drift. */
  scrollPerPixel: 1,

  /** A card at full opacity sits within this fraction of viewport width of the
   *  centre. Spec §9: `0.55 × innerWidth`. */
  focalBand: 0.55,

  /** What a card outside the focal band fades to. Spec §9: 0.42. */
  cardDimOpacity: 0.42,
} as const;
