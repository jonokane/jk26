// Tunable parameters for the hero wordmark animation. Values were dialed in
// live during the 2026-07-10 design session — see
// docs/superpowers/specs/2026-07-10-variable-font-hero-design.md.

export const WORDMARK_TEXT = "Jono Kane";

// TotalBlack Variable's weight-axis bounds (Adobe Fonts kit aqv1jgr).
export const AXIS_MIN = 170;
export const AXIS_MAX = 1000;

export type EaseName =
  | "sineInOut"
  | "cubicInOut"
  | "quintInOut"
  | "expoInOut"
  | "backInOut";
export type FalloffName = "smooth" | "linear" | "sharp";
export type HoverMode = "carve" | "swell";

export interface AmbientConfig {
  duration: number; // ms per weight move
  variancePct: number; // ± tempo randomness per move (0–100)
  hold: number; // avg ms rest at a weight; actual = hold × (0.5 + rand)
  biasPct: number; // % chance a move swings to the opposite extreme
  wmin: number; // weight floor (≥ AXIS_MIN)
  wmax: number; // weight ceiling (≤ AXIS_MAX)
  ease: EaseName;
  staggerMs: number; // per-letter start offset when the loop wakes
}

export interface HoverConfig {
  mode: HoverMode; // carve = cursor thins letters; swell = cursor fattens them
  radius: number; // px influence radius from letter center
  strengthPct: number; // influence at distance 0 (0–100)
  lagMs: number; // exponential smoothing time-constant; 0 = instant
  falloff: FalloffName;
}

export interface HeroConfig {
  ambient: AmbientConfig;
  hover: HoverConfig;
  reducedMotion: {
    // Frozen per-letter weights (spaces excluded) shown under
    // prefers-reduced-motion. One entry per letter of WORDMARK_TEXT.
    weights: number[];
  };
}

export const heroConfig: HeroConfig = {
  ambient: {
    duration: 1800,
    variancePct: 70,
    hold: 950,
    biasPct: 70,
    wmin: 170,
    wmax: 1000,
    ease: "cubicInOut",
    staggerMs: 140,
  },
  hover: {
    mode: "carve",
    radius: 240,
    strengthPct: 100,
    lagMs: 220,
    falloff: "smooth",
  },
  reducedMotion: {
    // J     o    n    o    K    a    n     e
    weights: [1000, 300, 700, 170, 900, 400, 1000, 250],
  },
};
