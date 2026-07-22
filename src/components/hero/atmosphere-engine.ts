/**
 * Pure maths for the hero atmosphere (spec §Testing) — no canvas, no DOM, so the
 * decisions that must stay correct are unit-tested; the canvas drawing that
 * consumes these lives in the component and is verified by eye.
 */

/** "#6d4bd8" or "6d4bd8" → [109, 75, 216]. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** The two depth planes' blurs, spread apart by `variation` (spec Global Constraints). */
export function planeBlurs(blur: number, variation: number): { far: number; near: number } {
  return { far: blur * (1 + 0.9 * variation), near: Math.max(0, blur * (1 - 0.75 * variation)) };
}

/** Base blob peak alpha for the aurora plane. Aurora weakens as balance → fold. */
export function auroraPeak(intensity: number, balance: number, depth: number, dark: boolean): number {
  return (dark ? 0.5 : 0.17) * (intensity * (1 - 0.55 * balance)) * (1 + 0.85 * depth);
}

/** Base fill alpha for a fold band. Folds strengthen as balance → fold. */
export function foldAlpha(intensity: number, balance: number, depth: number, dark: boolean): number {
  return (dark ? 0.15 : 0.095) * (intensity * (0.45 + 0.55 * balance)) * (1 + 0.7 * depth);
}

/**
 * The cursor push/pull for a fold at horizontal position `x` (the amount to
 * SUBTRACT from the fold's y). A Gaussian falloff around the cursor's x; signed
 * by whether the cursor sits above (pull up) or below (push down) center.
 * `cursorNormY` is 0..1 down the hero; `strength` is the cursor recipe.
 */
export function foldBulge(
  x: number, w: number, cursorX: number, cursorNormY: number, amp: number, strength: number,
): number {
  const pull = (0.5 - cursorNormY) * 2;
  const d = (x - cursorX * w) / (w * 0.17);
  return strength * amp * 2.6 * Math.exp(-d * d) * pull;
}

/** Frame-rate-independent-enough linear ease toward a target. */
export function ease(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}
