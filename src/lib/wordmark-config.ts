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
  /** Hand-tuned optical pair kerns, thousandths of an em: J·O O·N N·O O·K K·A A·N N·E */
  pairKernsMem: [30, 0, 0, 0, 165, 45, -70],
  build: {
    durMs: 1250,
    staggerMs: 130,
    fromScale: 2,
    fromBlurPx: 14,
    fromDropVh: -18,
    /** gsap ease equivalent of cubic-bezier(0.16, 1, 0.3, 1) */
    ease: "expo.out",
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
