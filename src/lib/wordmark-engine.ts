import {
  AXIS_MAX,
  AXIS_MIN,
  type AmbientConfig,
  type EaseName,
  type FalloffName,
  type HoverConfig,
  type HoverMode,
} from "@/lib/hero-config";

// ---------------------------------------------------------------------------
// Pure math — ported verbatim from the browser prototype validated in the
// 2026-07-10 design session. Change the spec before changing these.
// ---------------------------------------------------------------------------

export const EASES: Record<EaseName, (t: number) => number> = {
  sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  quintInOut: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  expoInOut: (t) =>
    t === 0 || t === 1
      ? t
      : t < 0.5
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2,
  backInOut: (t) => {
    const c = 1.70158 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
  },
};

/** Influence shape across the hover radius; d is normalized distance [0, 1). */
export const FALLOFFS: Record<FalloffName, (d: number) => number> = {
  smooth: (d) => (Math.cos(Math.PI * d) + 1) / 2,
  linear: (d) => 1 - d,
  sharp: (d) => Math.pow(1 - d, 3),
};

const clampToAxis = (w: number) => Math.min(AXIS_MAX, Math.max(AXIS_MIN, w));

/**
 * Pick a letter's next ambient weight target. With probability biasPct the
 * move swings to whichever extreme is farther from the current weight
 * (±4%-of-range jitter) — this is the "contrast bias" drama dial.
 */
export function nextTarget(
  current: number,
  cfg: AmbientConfig,
  random: () => number,
): number {
  const range = cfg.wmax - cfg.wmin;
  let target: number;
  if (random() < cfg.biasPct / 100) {
    const mid = cfg.wmin + range / 2;
    const extreme = current > mid ? cfg.wmin : cfg.wmax;
    target = extreme + (random() - 0.5) * range * 0.08;
  } else {
    target = cfg.wmin + random() * range;
  }
  return clampToAxis(target);
}

export function moveDuration(cfg: AmbientConfig, random: () => number): number {
  const v = cfg.variancePct / 100;
  return cfg.duration * (1 - v / 2 + random() * v);
}

export function restDelay(cfg: AmbientConfig, random: () => number): number {
  return cfg.hold * (0.5 + random());
}

/** Exponential smoothing coefficient for a frame of dtMs; lagMs ≤ 0 = instant. */
export function smoothingFactor(dtMs: number, lagMs: number): number {
  return lagMs <= 0 ? 1 : 1 - Math.exp(-dtMs / lagMs);
}

/** Cursor influence [0, 1] for a letter distPx away from the pointer. */
export function rawInfluence(distPx: number, cfg: HoverConfig): number {
  const d = distPx / cfg.radius;
  if (d >= 1) return 0;
  return FALLOFFS[cfg.falloff](d) * (cfg.strengthPct / 100);
}

/** Blend the ambient weight toward the hover extreme by influence. */
export function blendWeight(
  ambientW: number,
  influence: number,
  mode: HoverMode,
): number {
  const target = mode === "carve" ? AXIS_MIN : AXIS_MAX;
  return clampToAxis(ambientW + (target - ambientW) * influence);
}
