/**
 * Hero atmosphere tunables (spec 2026-07-18-hero-atmosphere-design.md). The one
 * place to tune the effect by feel — nothing here is derived from anything else.
 * Recipe locked with Jono; do not change without his call.
 */
export const ATMOSPHERE = {
  /** Overall alpha multiplier. */
  intensity: 1.3,
  /** Base blur (px); the two planes derive their blurs from this + variation. */
  blur: 33,
  /** How far the far/near plane blurs spread apart (0 = uniform). */
  variation: 0.75,
  /** Contrast between sheer and dense. */
  depth: 0.3,
  /** Reading-lane centre opacity (0 = off). */
  lane: 0.8,
  /** Cursor push/pull + parallax-lean strength (0 = none). */
  cursor: 0.5,
  /** Aurora ↔ fold balance (0 = all aurora, 1 = all fold). */
  balance: 0.8,
} as const;

/** Performance + lifecycle constants — the perf contract lives here. */
export const PERF = {
  /** Backing-store scale vs CSS size; the heavy blur hides sub-native res. */
  renderScale: 0.65,
  /** DPR ceiling for the backing store; the blur hides sub-native res, so retina
      buys nothing but fill-rate. The spec's perf contract caps this at ~1.5. */
  dprCap: 1.5,
  /** Draw cap — slow ambient drift needs no more. */
  fps: 30,
  /** Opacity fade-in on mount (ms), so it doesn't pop during the wordmark build. */
  fadeInMs: 1200,
  /** Each canvas overscans the hero by this fraction per side, so blur bleeds off-frame. */
  overscan: 0.12,
  /** Below this viewport width (px), render a single static frame (phones/low-power). */
  staticMaxWidth: 820,
} as const;
