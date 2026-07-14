import { wordmarkConfig } from "@/lib/wordmark-config";

/**
 * Pure math for the hero type lockup (spec §5):
 * - the wordmark shrinks to the available measure, never grows;
 * - the kicker's width locks to the JONO segment;
 * - the tagline sets on one line spanning the full JONOKANE width.
 * All inputs are pixel measurements taken by use-hero-lockup.ts.
 *
 * Legibility floors: both lockup ratios are widths, and the wordmark is sized
 * in vw — so as the viewport narrows, the fixed-length kicker and tagline get
 * squeezed linearly (measured at 375px before the floors landed: kicker 3.8px,
 * tagline 5.2px). `minKickerPx`/`minTaglinePx` (wordmark-config) put a hard
 * bottom under that. A floor and a one-line lock cannot both hold, so whenever
 * a floor binds — or the viewport is at/below `narrowMaxPx` — this returns
 * `narrow: true` and the caller lets the two lines wrap in CSS instead.
 *
 * Degenerate-input behavior: transient zero-width layouts (e.g. `availPx`
 * or `wordmarkPx` briefly 0 during measurement) must never collapse the
 * hero to invisible text. In those cases this function falls back to the
 * current/base sizes it was given rather than scaling to 0.
 */
export interface LockupInput {
  /** Available content width (the hero inner box). */
  availPx: number;
  /** Rendered wordmark width at `wordmarkFontPx`. */
  wordmarkPx: number;
  wordmarkFontPx: number;
  /** Width of the JONO segment (letters 0–3) at the same font size. */
  jonoPx: number;
  /** Kicker width at `kickerFontPx`. */
  kickerPx: number;
  kickerFontPx: number;
  /** Tagline single-line width measured at a 100px font. */
  taglinePxAt100: number;
  /** Viewport width — decides the narrow (wrapping) regime. */
  viewportPx: number;
}

export interface LockupResult {
  wordmarkFontPx: number;
  kickerFontPx: number;
  taglineFontPx: number;
  /** The one-line lock is off: the kicker and tagline must be allowed to wrap. */
  narrow: boolean;
}

export type LockupTunables = typeof wordmarkConfig.lockup;

export function computeLockup(
  input: LockupInput,
  tune: LockupTunables = wordmarkConfig.lockup,
): LockupResult {
  const scale =
    input.availPx > 0 && input.wordmarkPx > 0
      ? Math.min(1, input.availPx / input.wordmarkPx)
      : 1;
  const wordmarkFontPx = input.wordmarkFontPx * scale;
  const jonoScaled = input.jonoPx * scale;
  const fullScaled = input.wordmarkPx * scale;

  /* the raw lockup ratios — what the design asks for, before legibility */
  const rawKickerPx =
    input.kickerPx > 0 && jonoScaled > 0
      ? (input.kickerFontPx * jonoScaled) / input.kickerPx
      : input.kickerFontPx;

  const rawTaglinePx =
    input.taglinePxAt100 > 0
      ? (100 * fullScaled * tune.taglineFill) / input.taglinePxAt100
      : tune.minTaglinePx;

  const narrow =
    (input.viewportPx > 0 && input.viewportPx <= tune.narrowMaxPx) ||
    rawTaglinePx < tune.minTaglinePx ||
    rawKickerPx < tune.minKickerPx;

  return {
    wordmarkFontPx,
    kickerFontPx: Math.max(rawKickerPx, tune.minKickerPx),
    taglineFontPx: Math.max(rawTaglinePx, tune.minTaglinePx),
    narrow,
  };
}
