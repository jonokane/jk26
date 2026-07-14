/**
 * The shelf's scroll math (spec §8) — pure, unit-tested, no DOM (spec §15).
 *
 * The shelf is pinned for a fixed run of vertical scroll and ScrollTrigger
 * hands the hook a 0→1 progress. Everything the hook does with that number —
 * how far the track has travelled, which panel is showing, where a panel's
 * progress is so a study pill can jump to it — is here, so the effect that
 * wires it up stays small enough to hold in your head. That is where the bugs
 * in this codebase live; they have never been in the arithmetic.
 */

/** Vertical scroll spent per panel transition, in viewport heights. */
export const SCROLL_PER_PANEL = 0.9;

/** How far the shelf pins for: one span of scroll per gap between panels. */
export function shelfScrollDistance(panelCount: number, viewportHeight: number): number {
  return Math.max(0, panelCount - 1) * viewportHeight * SCROLL_PER_PANEL;
}

/** The horizontal travel of the track: every panel but the last has to pass by. */
export function trackDistance(panelCount: number, viewportWidth: number): number {
  return Math.max(0, panelCount - 1) * viewportWidth;
}

/** Track x at a given scroll progress — negative, because the track moves left. */
export function trackX(progress: number, panelCount: number, viewportWidth: number): number {
  // `+ 0` normalizes the -0 that falls out of negating zero: harmless to GSAP,
  // but it makes the resting state of the track read as 0 everywhere it is asserted.
  return -(clamp01(progress) * trackDistance(panelCount, viewportWidth)) + 0;
}

/** The 0→1 scroll progress at which panel `index` is centered — the snap points. */
export function panelProgress(index: number, panelCount: number): number {
  if (panelCount < 2) return 0;
  return clampIndex(index, panelCount) / (panelCount - 1);
}

/** Which panel a scroll progress is showing — the nearest snap point. */
export function panelIndexFromProgress(progress: number, panelCount: number): number {
  if (panelCount < 2) return 0;
  return clampIndex(Math.round(clamp01(progress) * (panelCount - 1)), panelCount);
}

/**
 * The snap increment handed to ScrollTrigger's `snap` (spec §8, "snapping per
 * panel"). One panel apart in progress space; 0 disables snapping, which is
 * what a one-panel shelf wants.
 */
export function snapIncrement(panelCount: number): number {
  return panelCount < 2 ? 0 : 1 / (panelCount - 1);
}

/** Document scroll position for a panel, given the pinned range ScrollTrigger reports. */
export function scrollForPanel(
  index: number,
  panelCount: number,
  start: number,
  end: number,
): number {
  return start + panelProgress(index, panelCount) * (end - start);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampIndex(index: number, panelCount: number): number {
  return Math.min(panelCount - 1, Math.max(0, index));
}
