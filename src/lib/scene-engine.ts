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

export interface SceneTokens {
  ink: string;
  sub: string;
  surface: string;
  scrim: string;
  cardBg: string;
  cardBorder: string;
  textGlow: string;
  elev: string;
  coverA: string;
  coverB: string;
  inkLight: boolean;
}

/** Derived UI tokens (spec §3.2) — every formula is locked by the spec. */
export function deriveTokens(s: SceneSample): SceneTokens {
  const inkLight = luminance(s.ink) > 0.5;
  const surface = mixHex(s.top, inkLight ? "#07091a" : "#f8fafe", 0.6);
  return {
    ink: s.ink,
    sub: s.sub,
    surface,
    scrim: surface + "94",
    cardBg: inkLight ? "rgba(10,13,28,.55)" : "rgba(255,255,255,.62)",
    cardBorder: inkLight ? "rgba(255,255,255,.15)" : "rgba(12,24,48,.13)",
    textGlow: inkLight ? "rgba(4,7,18,.55)" : "rgba(255,255,255,.5)",
    elev: inkLight ? "rgba(3,6,16,.5)" : "rgba(25,50,95,.28)",
    coverA: s.mid,
    coverB: s.hor,
    inkLight,
  };
}

/** Sun arc: rises 5.5h, sets 20.5h; horizon at 78vh, apex at 20vh. */
export function sunPosition(hour: number): { xVw: number; yVh: number } {
  const h = ((hour % 24) + 24) % 24;
  const f = Math.max(0, Math.min(1, (h - 5.5) / 15));
  return { xVw: lerp(6, 94, f), yVh: 78 - Math.sin(f * Math.PI) * 58 };
}

/**
 * Moon arc across the 19.5h → 7h window.
 *
 * Always returns usable, clamped coordinates — even outside the geometric
 * window. The scene keyframes (scene-config.ts) start ramping the moon's
 * opacity weight (`--w-moon`) up at the 17.8h "Golden hour" keyframe, well
 * before this window opens at 19.5h. If positions were only computed inside
 * the window, the moon would fade in at a stale/default position (or at
 * yesterday's set point) instead of at its rise point. So outside the
 * window we clamp `f` to whichever endpoint (rise or set) is nearer.
 */
export function moonPosition(hour: number): { xVw: number; yVh: number; visible: boolean } {
  const h = ((hour % 24) + 24) % 24;
  const m = (h + 24 - 19.5) % 24;
  if (m < 11.5) {
    const f = m / 11.5;
    return { xVw: lerp(8, 92, f), yVh: 72 - Math.sin(f * Math.PI) * 52, visible: true };
  }
  // Outside the window: clamp to the nearer endpoint. m ranges (11.5, 24);
  // its midpoint (17.75) splits "just past set" (f=1) from "about to rise" (f=0).
  const f = m >= 17.75 ? 0 : 1;
  return { xVw: lerp(8, 92, f), yVh: 72 - Math.sin(f * Math.PI) * 52, visible: false };
}

/**
 * The single DOM writer: samples the scene at `hour` and writes every scene
 * CSS custom property onto `root`. Called by SceneProvider ~once a minute
 * and on scrub — never per frame.
 */
export function applySceneToRoot(
  root: HTMLElement,
  hour: number,
  keyframes: readonly SceneKeyframe[] = SCENE_KEYFRAMES,
): void {
  const h = ((hour % 24) + 24) % 24;
  const s = sampleScene(h, keyframes);
  const tk = deriveTokens(s);
  const set = (name: string, value: string) => root.style.setProperty(name, value);
  // Weights are lerped floats and can accumulate float noise (e.g.
  // 0.6499999999999999); round to at most 4 decimals before writing.
  const setWeight = (name: string, value: number) =>
    set(name, String(Number(value.toFixed(4))));

  set("--sky-top", s.top);
  set("--sky-mid", s.mid);
  set("--sky-hor", s.hor);
  set("--ink", tk.ink);
  set("--sub", tk.sub);
  set("--surface", tk.surface);
  set("--scrim", tk.scrim);
  set("--card-bg", tk.cardBg);
  set("--card-border", tk.cardBorder);
  set("--text-glow", tk.textGlow);
  set("--elev", tk.elev);
  set("--cover-a", tk.coverA);
  set("--cover-b", tk.coverB);
  setWeight("--w-stars", s.stars);
  setWeight("--w-rays", s.rays);
  setWeight("--w-clouds", s.clouds);
  setWeight("--w-birds", s.birds);
  setWeight("--w-sun", s.sun);
  setWeight("--w-moon", s.moon);

  const sun = sunPosition(h);
  set("--sun-x", `${sun.xVw.toFixed(2)}vw`);
  set("--sun-y", `${sun.yVh.toFixed(2)}vh`);
  const moon = moonPosition(h);
  set("--moon-x", `${moon.xVw.toFixed(2)}vw`);
  set("--moon-y", `${moon.yVh.toFixed(2)}vh`);
}
