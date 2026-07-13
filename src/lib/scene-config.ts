/** One keyframe of the day: sky colors + element weights at local hour `h`. */
export interface SceneKeyframe {
  /** Local hour this keyframe sits at (fractional, 0–24). */
  h: number;
  name: string;
  /** Sky gradient stops (top → mid 55% → horizon). */
  top: string;
  mid: string;
  hor: string;
  /** Foreground text colors. */
  ink: string;
  sub: string;
  /** Element layer weights, 0–1. */
  stars: number;
  rays: number;
  clouds: number;
  birds: number;
  sun: number;
  moon: number;
}

/**
 * The 8 scenes of the day, tuned interactively during the 2026-07 design
 * prototyping. Values are locked by the spec (§3.1) — change them via the
 * dev tune panel (`?tune`), not by hand-editing mid-implementation.
 */
export const SCENE_KEYFRAMES: readonly SceneKeyframe[] = [
  { h: 0.0,  name: "Midnight",    top: "#050818", mid: "#16173f", hor: "#2c4a78", ink: "#edf2ff", sub: "#a9b6e6", stars: 1,    rays: 0,    clouds: 0,    birds: 0,    sun: 0,    moon: 1 },
  { h: 4.7,  name: "Night's end", top: "#090b22", mid: "#251b4e", hor: "#513668", ink: "#f1ecff", sub: "#bfaede", stars: 0.75, rays: 0.2,  clouds: 0,    birds: 0,    sun: 0,    moon: 0.5 },
  { h: 6.0,  name: "Dawn",        top: "#32204e", mid: "#8a4a6a", hor: "#f7a75d", ink: "#fff3e3", sub: "#f5cda6", stars: 0.2,  rays: 1,    clouds: 0.15, birds: 0.1,  sun: 0.25, moon: 0 },
  { h: 8.0,  name: "Morning",     top: "#4e93d9", mid: "#8ec6ee", hor: "#ffe7bd", ink: "#123252", sub: "#33608a", stars: 0,    rays: 0.3,  clouds: 0.55, birds: 0.6,  sun: 0.75, moon: 0 },
  { h: 12.5, name: "Midday",      top: "#3e9bf4", mid: "#7fc6fb", hor: "#d3efff", ink: "#0e3a63", sub: "#2f6292", stars: 0,    rays: 0,    clouds: 1,    birds: 0.9,  sun: 1,    moon: 0 },
  { h: 17.8, name: "Golden hour", top: "#5f7cc0", mid: "#ec9c66", hor: "#ffd47e", ink: "#45230f", sub: "#7b4a26", stars: 0,    rays: 0.4,  clouds: 0.6,  birds: 0.4,  sun: 0.55, moon: 0 },
  { h: 19.8, name: "Dusk",        top: "#2d2a67", mid: "#7d4b90", hor: "#e87f8b", ink: "#ffeaf0", sub: "#dcb6d8", stars: 0.45, rays: 0.12, clouds: 0.3,  birds: 0.05, sun: 0.08, moon: 0.25 },
  { h: 21.5, name: "Evening",     top: "#0d1132", mid: "#2d2363", hor: "#4b5099", ink: "#eef1ff", sub: "#adb3e6", stars: 0.9,  rays: 0,    clouds: 0.08, birds: 0,    sun: 0,    moon: 0.7 },
];
