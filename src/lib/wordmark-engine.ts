import {
  AXIS_MAX,
  AXIS_MIN,
  type AmbientConfig,
  type EaseName,
  type FalloffName,
  type HeroConfig,
  type HoverConfig,
  type HoverMode,
} from "@/lib/hero-config";
import { gsap } from "@/lib/gsap";

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

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface LetterState {
  el: HTMLElement;
  from: number;
  to: number;
  t0: number; // ms timestamp the current move starts
  dur: number; // ms length of the current move
  ambientW: number;
  influence: number; // smoothed cursor influence [0, 1]
}

export interface WordmarkEngine {
  /** Register on gsap.ticker (idempotent). */
  start(): void;
  /** Unregister from gsap.ticker (idempotent). Safe to start() again. */
  stop(): void;
  /** Advance to an absolute time in ms. start() drives this from the ticker;
   *  exposed so tests can drive time deterministically. */
  tick(nowMs: number): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  /** Live-patch config (tune panel). Hover changes and `ambient.ease` apply
   *  immediately; other ambient fields are consumed at each letter's next
   *  retarget. (`staggerMs` is consumed only at engine init; a live patch
   *  never applies.) */
  updateConfig(patch: Partial<HeroConfig>): void;
}

export function createWordmarkEngine(
  letterEls: HTMLElement[],
  config: HeroConfig,
  random: () => number = Math.random,
): WordmarkEngine {
  let cfg: HeroConfig = structuredClone(config);
  let states: LetterState[] | null = null;
  let pointer: { x: number; y: number } | null = null;
  let lastNow: number | null = null;
  let tickerFn: ((time: number) => void) | null = null;

  function retargetState(s: LetterState, nowMs: number) {
    s.from = s.to;
    s.to = nextTarget(s.from, cfg.ambient, random);
    s.dur = moveDuration(cfg.ambient, random);
    s.t0 = nowMs + restDelay(cfg.ambient, random);
  }

  function init(nowMs: number) {
    states = letterEls.map((el, i) => ({
      el,
      from: 400,
      to: 400,
      t0: nowMs + i * cfg.ambient.staggerMs,
      dur: 1,
      ambientW: 400,
      influence: 0,
    }));
    for (const s of states) retargetState(s, s.t0);
  }

  function tick(nowMs: number) {
    if (states === null) init(nowMs);
    const dt = lastNow === null ? 16.7 : Math.min(64, Math.max(0, nowMs - lastNow));
    lastNow = nowMs;
    const ease = EASES[cfg.ambient.ease];

    for (const s of states!) {
      // 1. Advance the ambient move.
      const p = (nowMs - s.t0) / s.dur;
      if (p >= 1) {
        s.ambientW = s.to;
        retargetState(s, nowMs);
      } else if (p >= 0) {
        s.ambientW = s.from + (s.to - s.from) * ease(p);
      }

      // 2. Raw cursor influence from pointer→letter-center distance.
      let raw = 0;
      if (pointer) {
        const r = s.el.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        raw = rawInfluence(Math.hypot(dx, dy), cfg.hover);
      }

      // 3. Smooth influence toward raw (the "liquid" lag).
      s.influence += (raw - s.influence) * smoothingFactor(dt, cfg.hover.lagMs);

      // 4. Blend and write. One inline-style write per letter per frame.
      const w = blendWeight(s.ambientW, s.influence, cfg.hover.mode);
      s.el.style.fontVariationSettings = `'wght' ${w}`;
    }
  }

  return {
    start() {
      if (tickerFn) return;
      lastNow = null;
      tickerFn = (time: number) => tick(time * 1000); // gsap.ticker time is seconds
      gsap.ticker.add(tickerFn);
    },
    stop() {
      if (!tickerFn) return;
      gsap.ticker.remove(tickerFn);
      tickerFn = null;
    },
    tick,
    setPointer(x: number, y: number) {
      pointer = { x, y };
    },
    clearPointer() {
      pointer = null;
    },
    updateConfig(patch: Partial<HeroConfig>) {
      cfg = {
        ambient: { ...cfg.ambient, ...patch.ambient },
        hover: { ...cfg.hover, ...patch.hover },
        reducedMotion: patch.reducedMotion ?? cfg.reducedMotion,
      };
    },
  };
}
