/**
 * Cursor weight-carve for the hero wordmark (spec §5): letters thin toward
 * carveToWght under the pointer with smooth distance falloff and lagged
 * easing. The influence math is REUSED from the parked TotalBlack engine
 * (spec §13) — same falloff, same exponential smoothing. Frame work rides
 * the shared gsap ticker (one-RAF-loop rule).
 */
import { gsap } from "@/lib/gsap";
import type { HoverConfig } from "@/lib/hero-config";
import { rawInfluence, smoothingFactor } from "@/lib/wordmark-engine";
import { wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";

const { radiusPx, strengthPct, lagMs, carveToWght } = wordmarkConfig.hover;
const REST_WGHT = wordmarkConfig.axes.wght;
const SETTLE_EPSILON = 0.001;

/**
 * HoverConfig-shaped view of our carve settings for the reused math.
 * strengthPct is pinned to 100 here — NOT the config's 65 — because strength
 * is applied exactly once, in `carveWeight` below. `rawInfluence` (reused
 * from the parked engine) also multiplies by its own `strengthPct / 100`
 * internally; pinning it to 100 neutralizes that scaling so it returns the
 * raw 0–1 falloff, and `carveWeight` is the single place strength applies.
 */
export const CARVE_HOVER_CFG: HoverConfig = {
  mode: "carve",
  radius: radiusPx,
  strengthPct: 100,
  lagMs,
  falloff: "smooth",
};

/** Letter weight for a smoothed influence value (pure; exported for tests). */
export function carveWeight(influence: number): number {
  const clamped = Math.min(1, Math.max(0, influence));
  return REST_WGHT - (REST_WGHT - carveToWght) * clamped * (strengthPct / 100);
}

export interface CarveEngine {
  start(): void;
  stop(): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  refreshRects(): void;
  setEnabled(enabled: boolean): void;
}

interface LetterState {
  el: HTMLElement;
  cx: number;
  cy: number;
  influence: number;
}

export function createCarveEngine(letterEls: HTMLElement[]): CarveEngine {
  const letters: LetterState[] = letterEls.map((el) => ({ el, cx: 0, cy: 0, influence: 0 }));
  let pointer: { x: number; y: number } | null = null;
  let enabled = true;
  let running = false;
  let lastTime = 0;
  let atRest = false;

  function refreshRects(): void {
    for (const s of letters) {
      const r = s.el.getBoundingClientRect();
      s.cx = r.left + r.width / 2;
      s.cy = r.top + r.height / 2;
    }
  }

  /** gsap ticker time is SECONDS — convert to ms (house rule). */
  function tick(time: number): void {
    const now = time * 1000;
    const dt = Math.min(64, Math.max(0, now - lastTime));
    lastTime = now;
    const k = smoothingFactor(dt, lagMs);
    let maxInfluence = 0;
    for (const s of letters) {
      const target =
        enabled && pointer
          ? rawInfluence(Math.hypot(pointer.x - s.cx, pointer.y - s.cy), CARVE_HOVER_CFG)
          : 0;
      s.influence += (target - s.influence) * k;
      if (s.influence > maxInfluence) maxInfluence = s.influence;
    }

    /* Idle at rest: once there's no pointer and influence has fully decayed,
     * write the rest weight exactly once and stop touching the DOM every
     * frame — re-engagement (start()/setPointer()) clears atRest to resume. */
    if (pointer === null && maxInfluence < SETTLE_EPSILON) {
      if (!atRest) {
        for (const s of letters) {
          s.el.style.fontVariationSettings = wordmarkFvs(REST_WGHT);
          s.influence = 0;
        }
        atRest = true;
      }
      return;
    }

    atRest = false;
    for (const s of letters) {
      s.el.style.fontVariationSettings = wordmarkFvs(carveWeight(s.influence));
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      atRest = false;
      lastTime = gsap.ticker.time * 1000;
      refreshRects();
      gsap.ticker.add(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    },
    setPointer(x, y) {
      pointer = { x, y };
      atRest = false;
    },
    clearPointer() {
      pointer = null;
    },
    refreshRects,
    setEnabled(value) {
      enabled = value;
      if (!value) pointer = null;
    },
  };
}
