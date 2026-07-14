/**
 * The locked JONOKANE wordmark recipe (spec §5) — tuned in wordmark lab
 * v12 during the 2026-07 design run. Single source of truth; components
 * never hardcode these values.
 */
export const WORDMARK_TEXT = "JONOKANE";

export const wordmarkConfig = {
  /** area-full is the unclamped re-registration; area-variable the kit fallback. */
  family: '"area-full", "area-variable", sans-serif',
  axes: { wght: 274, wdth: 195, INKT: 8, slnt: 0 },
  trackEm: 0.05,
  sizeVw: 7,
  /**
   * Hand-tuned pair NUDGES, thousandths of an em: J·O O·N N·O O·K K·A A·N N·E.
   * These ride ON TOP of the measured optical base (see `opticalKern` below and
   * `src/lib/optical-kerning.ts`) — they are not the whole kern. Applied alone
   * they open K·A into a word-sized hole and the wordmark reads "JONOK ANE";
   * that was the shipped bug. Nudge and base are always summed.
   */
  pairKernsMem: [30, 0, 0, 0, 165, 45, -70],
  /**
   * The optical kern scan (spec §5). One <span> per letter is what lets us
   * animate and carve them individually, and it is also what destroys the
   * font's native kern pairs — the browser only kerns within a single text run.
   * So we rasterize each glyph at `samplePx`, read its true visual edges off
   * the alpha channel across the cap-height band, and equalize every pair's
   * visual gap. This geometry is the lab's; `pairKernsMem` was tuned against
   * it, so changing these values re-bases those nudges.
   */
  opticalKern: {
    /** Raster size for one glyph, px. Large enough that a pixel is ~1/1000 em. */
    samplePx: 160,
    /** Left inset in the raster, px — room for a negative left sidebearing. */
    padPx: 60,
    /** Canvas box, in multiples of samplePx (a 195-wide cap needs the room). */
    canvasWidthRatio: 3.2,
    canvasHeightRatio: 1.6,
    /** Baseline down from the raster's top, in multiples of samplePx. */
    baselineRatio: 1.15,
    /** The scanned band, as heights above the baseline (multiples of samplePx):
        the cap height, less the bottom sliver where serif-less stems flare. */
    bandTopRatio: 0.62,
    bandBottomRatio: 0.08,
    /** Alpha (0–255) above which a pixel counts as ink — ignores the AA fringe. */
    inkAlpha: 40,
  },
  build: {
    durMs: 1250,
    staggerMs: 130,
    fromScale: 2,
    fromBlurPx: 14,
    fromDropVh: -18,
    /** gsap ease equivalent of cubic-bezier(0.16, 1, 0.3, 1) */
    ease: "expo.out",
    /** Reduced motion / font fallback: the wordmark "appears by simple fade" (spec §12). */
    fadeMs: 600,
    fadeEase: "power2.out",
  },
  /**
   * Type-lockup tunables (spec §5). The lockup ratios (kicker ≡ JONO width,
   * tagline ≡ full wordmark width) scale with the viewport, so on small screens
   * they drive both to unreadable sizes — these floors and the narrow breakpoint
   * are what stop that.
   */
  lockup: {
    /** Slight underfill so the one-line tagline never wraps by accident. */
    taglineFill: 0.995,
    /** Legibility floor for the uppercase kicker. */
    minKickerPx: 12,
    /** Legibility floor for the tagline (standard minimum body size). */
    minTaglinePx: 16,
    /** At or below this viewport width the one-line lockup is dropped outright. */
    narrowMaxPx: 760,
  },
  hover: {
    radiusPx: 240,
    strengthPct: 65,
    lagMs: 220,
    carveToWght: 100,
  },
} as const;

/** font-variation-settings string at a given weight, other axes at rest. */
export function wordmarkFvs(wght: number): string {
  const { wdth, INKT, slnt } = wordmarkConfig.axes;
  return `'slnt' ${slnt}, 'wght' ${Math.round(wght)}, 'wdth' ${wdth}, 'INKT' ${INKT}`;
}
