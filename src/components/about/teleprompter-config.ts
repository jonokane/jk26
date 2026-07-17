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
     conflict register #6).
     weightAmbient and weightEmphasis are ALSO written as literals in
     about.module.css, which needs them for the reduced-motion path where no JS
     runs. That duplication is unavoidable — CSS cannot read TypeScript — so it
     is pinned instead: teleprompter-config.test.ts reads the stylesheet as
     source text and fails if the two ever drift apart. Change one, change both. */
  weightFloor: 400,
  weightAmbient: 440,
  weightEmphasis: 780,
} as const;

/* NOT here, deliberately: the stage height (640vh), and the rail dot sizes
   (6px / 9px). Spec §8 lists them as tunables, but nothing in JS reads them —
   they are laid out entirely by about.module.css (`.wrap`, `.dot`,
   `.dot[data-active]`), and CSS cannot read this file. Carrying them here made
   them look adjustable while every edit did nothing: the value shipped came
   from the stylesheet regardless, and the unit test asserting them passed
   either way. Tune them in about.module.css. A config entry that tunes nothing
   is worse than no entry at all.
   Handing them to CSS from JS is not the fix. `stageHeightVh` would have to be
   written as an inline style, and an inline style would BEAT the
   reduced-motion media query that sets `.wrap { height: auto }` — it would
   break the accessible path to spare a hardcoded number. */
