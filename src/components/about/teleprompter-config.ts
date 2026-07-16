/**
 * Every number the teleprompter uses (spec §8). Tunables, not literals — Jono
 * adjusts these by feel after watching it move, and that must stay a one-line
 * edit in one file. The values are the Portfolio v2 prototype's verbatim.
 */
export const TELEPROMPTER = {
  /** × vh — where the focused line sits. */
  focalPosition: 0.6,
  /** × vh — falloff radius either side of the focus. */
  focalRange: 0.24,

  /* The asymmetry IS the design. Words above the focus are already read: they
     blur hard but hold presence. Words below are not yet read: they stay sharp
     but recede. */
  /** px at zero focus, already-read. */
  blurAbove: 7,
  /** px at zero focus, not-yet-read. */
  blurBelow: 2,
  /** floor at zero focus, already-read. */
  opacityAbove: 0.5,
  /** floor at zero focus, not-yet-read. */
  opacityBelow: 0.14,

  /* 400 is the FLOOR every role starts from; 440 is ambient's target. The
     handoff README calls the range "440 → 780", which is wrong (spec's
     conflict register #6). */
  weightFloor: 400,
  weightAmbient: 440,
  weightEmphasis: 780,

  /** vh — the tall wrapper that drives the sticky stage. */
  stageHeightVh: 640,

  /** px — the right rail's dots. */
  dotRest: 6,
  dotActive: 9,
} as const;
