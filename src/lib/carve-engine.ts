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

/** HoverConfig-shaped view of our carve settings for the reused math. */
const HOVER_CFG: HoverConfig = {
  mode: "carve",
  radius: radiusPx,
  strengthPct,
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
    let anyActive = false;
    for (const s of letters) {
      const target =
        enabled && pointer ? rawInfluence(Math.hypot(pointer.x - s.cx, pointer.y - s.cy), HOVER_CFG) : 0;
      s.influence += (target - s.influence) * k;
      if (s.influence > 0.001 || target > 0) anyActive = true;
      s.el.style.fontVariationSettings = wordmarkFvs(carveWeight(s.influence));
    }
    /* settle detection: when nothing is influenced, stop writing styles */
    if (!anyActive && !pointer) {
      for (const s of letters) s.el.style.fontVariationSettings = wordmarkFvs(REST_WGHT);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
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
