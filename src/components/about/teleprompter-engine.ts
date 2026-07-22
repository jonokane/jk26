/**
 * The teleprompter's maths (spec §8) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `theme-engine.ts` house style, spec §14).
 * The hook measures and writes; it holds no numbers.
 */
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";
import type { WordRole } from "@/components/about/statement-tokens";

/**
 * The classic smoothstep: clamped, then eased with t²(3−2t).
 *
 * The degenerate guard is not academic. With zero-width edges the ratio is
 * `0/0` at exactly `x === edge0` — and that is the block sitting ON the focal
 * center, i.e. the statement the visitor is reading. NaN then flows into its
 * weight and blur, and the browser silently drops `blur(NaNpx)` rather than
 * complaining, so it would degrade invisibly. A zero range means "no zone", so
 * collapse to the step function that is its limit.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 1 at the focal center, easing to 0 at `focalRange` away, either side. */
export function focusFor(delta: number, focalRange: number): number {
  return 1 - smoothstep(0, focalRange, Math.abs(delta));
}

/**
 * A block's blur and opacity, from its signed distance to the focus.
 * `delta < 0` means the block sits ABOVE the focus — already read.
 */
export function blockStyle(delta: number, focus: number): { blur: number; opacity: number } {
  const above = delta < 0;
  const slack = 1 - focus;
  const floor = above ? T.opacityAbove : T.opacityBelow;
  return {
    blur: slack * (above ? T.blurAbove : T.blurBelow),
    /* lerp(floor, 1, focus), written out: floor + focus × (1 − floor). */
    opacity: floor + focus * (1 - floor),
  };
}

/** A word's variable weight, from its role and its block's focus. */
export function wordWeight(role: WordRole, focus: number): number {
  const target = role === "emphasis" ? T.weightEmphasis : T.weightAmbient;
  return T.weightFloor + (target - T.weightFloor) * focus;
}

/** The focal center sweeps the column from the first block to the last. */
export function activeCenter(first: number, last: number, progress: number): number {
  return first + (last - first) * progress;
}
