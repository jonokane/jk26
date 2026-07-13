/**
 * Pure math for the time-of-day scene system (spec §3). No DOM access in
 * the sampling functions; `applySceneToRoot` (Task 2) is the only writer.
 * House style follows wordmark-engine.ts: framework-agnostic, unit-tested.
 */
import { SCENE_KEYFRAMES, type SceneKeyframe } from "@/lib/scene-config";

export interface SceneSample {
  top: string;
  mid: string;
  hor: string;
  ink: string;
  sub: string;
  stars: number;
  rays: number;
  clouds: number;
  birds: number;
  sun: number;
  moon: number;
  from: SceneKeyframe;
  to: SceneKeyframe;
  t: number;
}

const COLOR_KEYS = ["top", "mid", "hor", "ink", "sub"] as const;
const WEIGHT_KEYS = ["stars", "rays", "clouds", "birds", "sun", "moon"] as const;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t)]);
}

/** Relative luminance approximation on 0–1 (sufficient for the light/dark ink test). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Clamped smoothstep — the easing between scene keyframes. */
export function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Local wall-clock time as fractional hours (14:30 → 14.5). */
export function hourFromDate(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

/** Sample the scene at `hour`, blending between the two surrounding keyframes (wraps midnight). */
export function sampleScene(
  hour: number,
  keyframes: readonly SceneKeyframe[] = SCENE_KEYFRAMES,
): SceneSample {
  const h = ((hour % 24) + 24) % 24;
  const kfs = [...keyframes].sort((a, b) => a.h - b.h);
  let from = kfs[kfs.length - 1];
  let to = kfs[0];
  for (let i = 0; i < kfs.length; i++) {
    if (kfs[i].h <= h) {
      from = kfs[i];
      to = kfs[(i + 1) % kfs.length];
    }
  }
  const span = (to.h - from.h + 24) % 24 || 24;
  const t = smoothstep(((h - from.h + 24) % 24) / span);

  const sample = { from, to, t } as SceneSample;
  for (const k of COLOR_KEYS) sample[k] = mixHex(from[k], to[k], t);
  for (const k of WEIGHT_KEYS) sample[k] = lerp(from[k], to[k], t);
  return sample;
}
