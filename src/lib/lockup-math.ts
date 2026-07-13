/**
 * Pure math for the hero type lockup (spec §5):
 * - the wordmark shrinks to the available measure, never grows;
 * - the kicker's width locks to the JONO segment;
 * - the tagline sets on one line spanning the full JONOKANE width.
 * All inputs are pixel measurements taken by use-hero-lockup.ts.
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
}

export interface LockupResult {
  wordmarkFontPx: number;
  kickerFontPx: number;
  taglineFontPx: number;
}

const TAGLINE_FILL = 0.995; // slight underfill so the line never wraps

export function computeLockup(input: LockupInput): LockupResult {
  const scale =
    input.wordmarkPx > 0 ? Math.min(1, input.availPx / input.wordmarkPx) : 1;
  const wordmarkFontPx = input.wordmarkFontPx * scale;
  const jonoScaled = input.jonoPx * scale;
  const fullScaled = input.wordmarkPx * scale;

  const kickerFontPx =
    input.kickerPx > 0
      ? (input.kickerFontPx * jonoScaled) / input.kickerPx
      : input.kickerFontPx;

  const taglineFontPx =
    input.taglinePxAt100 > 0
      ? (100 * fullScaled * TAGLINE_FILL) / input.taglinePxAt100
      : 16;

  return { wordmarkFontPx, kickerFontPx, taglineFontPx };
}
