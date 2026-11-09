/**
 * Every number How I lead's motion uses. Tunables, not literals: Jono adjusts
 * these by feel, and that must stay a one-line edit in one file. Geometry the
 * CSS owns (padding, the column split, card spacing) lives in
 * how-i-lead.module.css, because CSS is the only thing that reads it.
 */
export const HOW_I_LEAD = {
  /** The band's inset on each side, as a percent of its width, before it opens
      to full bleed. 3% sits just outside the 6vw text line. */
  inset: 3,
  /** The band is full width once its top reaches this line. */
  openBy: "top 30%",
  /** It starts drawing back in once its bottom passes this line. */
  closeFrom: "bottom 70%",
  bandEase: "power2.inOut",

  /** Each principle card enters at this scale and opacity... */
  cardFromScale: 0.86,
  cardFromOpacity: 0.3,
  /** ...and is full size once its center reaches this line, then stays put. */
  cardFullBy: "center 62%",
  cardEase: "power2.out",

  /** Seconds the motion trails the scroll: it catches up, never snaps. */
  scrub: 0.8,
} as const;
