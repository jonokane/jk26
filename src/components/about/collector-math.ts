/**
 * The collector's pose math (spec §7) — pure, so it can be reasoned about and
 * unit-tested away from the scroll that drives it. Nothing here touches the
 * DOM, GSAP or React: given a scroll progress it returns where every beat is.
 *
 * The scroll progress `p` is the sticky stage's travel through the section:
 * 0 when the section's top meets the top of the viewport, 1 when its bottom
 * meets the bottom of the viewport. ScrollTrigger hands it to us (`top top` →
 * `bottom bottom`), which is the same quantity the prototype computed by hand.
 *
 * Each of the N beats owns one segment of `p` (`seg = 1 / (N + 1)`), spent
 * rising → holding center stage → pocketing into the tray. The spare segment
 * at the end is the assembly: the tray unpacks into the About wall.
 */

import type { CollectorLayout, CollectorTiming } from "./collector-config";

export interface Viewport {
  width: number;
  height: number;
}

export interface Pose {
  /** px, from the stage's top-left (transform-origin: top left). */
  x: number;
  y: number;
  scale: number;
  opacity: number;
  z: number;
}

/**
 * Stacking bands. Center stage is a clear canvas: the beat being read is
 * always on top of the tray it is about to join.
 */
export const Z_TRAY = 1;
export const Z_FLIGHT = 2;
export const Z_ACTIVE = 3;

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smoothstep — the same ease the wordmark morph uses, so the site moves alike. */
export const smoothstep = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/** Where `v` sits between `a` and `b`, clamped. A zero-length window is a step. */
export const between = (v: number, a: number, b: number): number =>
  a === b ? (v < a ? 0 : 1) : clamp01((v - a) / (b - a));

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * A beat's own clock: 0 when its turn begins, 1 when it is pocketed.
 *
 * Snapped onto the segment grid, because binary floating point does not land
 * on it: `(0.8 - 3 × 0.2) / 0.2` is 0.9999999999999998, and the boundaries of
 * this piece (p = 0.8 is "every beat is now in the tray") are exactly the
 * moments the design is specified at.
 */
const localTime = (progress: number, index: number, seg: number): number => {
  const u = (progress - index * seg) / seg;
  const near = Math.round(u);
  return Math.abs(u - near) < 1e-9 ? near : u;
};

/** Progress each beat owns. The +1 is the assembly segment. */
export const segment = (count: number): number => 1 / (count + 1);

/** Progress at which the last beat is pocketed and the wall starts assembling. */
export const assembleStart = (count: number): number => count * segment(count);

/** Progress at which the last beat has landed in the wall. */
export const assembleEnd = (count: number, timing: CollectorTiming): number =>
  assembleStart(count) + Math.max(0, count - 1) * timing.assembleStagger + timing.assembleSpan;

/** A pose in the viewport units the layout is authored in. */
interface RawPose {
  xVw: number;
  yVh: number;
  scale: number;
  opacity: number;
}

const lerpRaw = (a: RawPose, b: RawPose, t: number): RawPose => ({
  xVw: lerp(a.xVw, b.xVw, t),
  yVh: lerp(a.yVh, b.yVh, t),
  scale: lerp(a.scale, b.scale, t),
  opacity: lerp(a.opacity, b.opacity, t),
});

const resolve = (raw: RawPose, vp: Viewport, z: number): Pose => ({
  x: (raw.xVw / 100) * vp.width,
  y: (raw.yVh / 100) * vp.height,
  scale: raw.scale,
  opacity: raw.opacity,
  z,
});

export const upPose = (l: CollectorLayout): RawPose => ({
  xVw: l.insetVw,
  yVh: l.upVh,
  scale: 1,
  opacity: 0,
});

export const activePose = (l: CollectorLayout): RawPose => ({
  xVw: l.insetVw,
  yVh: l.activeVh,
  scale: 1,
  opacity: 1,
});

export const trayPose = (index: number, l: CollectorLayout): RawPose => ({
  xVw: l.insetVw + index * l.trayStepVw,
  yVh: l.trayVh,
  scale: l.trayScale,
  opacity: l.trayOpacity,
});

export const wallPose = (index: number, l: CollectorLayout): RawPose => ({
  xVw: l.insetVw + (index % l.wallCols) * l.wallColVw,
  yVh: l.wallTopVh + Math.floor(index / l.wallCols) * l.wallRowVh,
  scale: l.wallScale,
  opacity: 1,
});

/**
 * Where beat `index` is at progress `p`.
 *
 * The first beat has no rise window: there is no scroll before p=0 to scrub a
 * rise against, and it does not need one — the section's own entrance carries
 * it up the screen. It is on stage the moment the stage exists, which is also
 * what a visitor arriving on `#about` should land on.
 */
export function beatPose(
  index: number,
  count: number,
  progress: number,
  layout: CollectorLayout,
  timing: CollectorTiming,
  vp: Viewport,
): Pose {
  const p = clamp01(progress);
  const up = upPose(layout);
  const active = activePose(layout);
  const tray = trayPose(index, layout);

  // Assembly: the tray unpacks into the wall, one beat after another.
  const flightStart = assembleStart(count) + index * timing.assembleStagger;
  if (p >= flightStart) {
    const t = smoothstep(between(p, flightStart, flightStart + timing.assembleSpan));
    return resolve(lerpRaw(tray, wallPose(index, layout), t), vp, Z_TRAY);
  }

  const u = localTime(p, index, segment(count));
  const rise = index === 0 ? 0 : timing.rise;
  const pocketStart = 1 - timing.pocket;

  if (u < 0) return resolve(up, vp, Z_TRAY);
  if (u < rise) return resolve(lerpRaw(up, active, smoothstep(u / rise)), vp, Z_ACTIVE);
  if (u < pocketStart) return resolve(active, vp, Z_ACTIVE);
  if (u < 1) {
    const t = smoothstep(between(u, pocketStart, 1));
    return resolve(lerpRaw(active, tray, t), vp, Z_FLIGHT);
  }
  return resolve(tray, vp, Z_TRAY);
}

/** The tray is worth a caption once something is in it, and only until it unpacks. */
export function trayHintOpacity(progress: number, count: number, timing: CollectorTiming): number {
  const p = clamp01(progress);
  const seg = segment(count);
  const start = assembleStart(count);
  const shown = between(p, seg - timing.hintFadeSpan, seg);
  const gone = between(p, start - timing.hintFadeSpan, start);
  return clamp01(shown * (1 - gone));
}

/** The About heading, lede and CTA footer: nothing until the wall is landing. */
export function revealOpacity(progress: number, count: number, timing: CollectorTiming): number {
  const start = assembleStart(count);
  return smoothstep(
    between(clamp01(progress), start + timing.revealFrom, start + timing.revealTo),
  );
}

export const isAssembled = (progress: number, count: number): boolean =>
  clamp01(progress) >= assembleStart(count);

/**
 * Every place the collector is willing to come to rest.
 *
 * A beat's is the middle of its hold window, not its segment boundary — the
 * boundary is the moment a beat is mid-flight and half-faded, and snapping
 * there would park the reader between two beats. Then the assembled wall.
 *
 * Zero is a resting place too: it is where the stage pins with the first beat
 * already center stage, so a visitor who arrives on `#about` is not scrolled
 * onward the instant they land.
 */
export function snapTargets(count: number, timing: CollectorTiming): number[] {
  const seg = segment(count);
  const holdCenter = (timing.rise + (1 - timing.pocket)) / 2;
  const beats = Array.from({ length: count }, (_, i) => (i + holdCenter) * seg);
  return [0, ...beats, assembleEnd(count, timing)];
}

/**
 * Directional snap: settle on the next resting place in the direction of
 * travel, never yank the reader backwards out of a beat they are scrolling
 * away from. Past the last target the wall is assembled and the section is
 * just a page again — snapping there would trap the reader inside it.
 *
 * `tolerance` is a deadzone around the target the reader is already resting
 * on. Without it, being a single pixel past a beat's center counts as "moving
 * on", and the smallest nudge downhill throws the reader a whole beat forward.
 */
export function snapProgress(
  value: number,
  direction: number,
  targets: number[],
  release: number,
  tolerance = 0,
): number {
  if (!targets.length || value >= release) return value;

  const settled = targets.find((t) => Math.abs(t - value) <= tolerance);
  if (settled !== undefined) return settled;

  const forward = direction >= 0;
  const reachable = targets.filter((t) => (forward ? t >= value : t <= value));
  if (!reachable.length) return value;
  return forward ? Math.min(...reachable) : Math.max(...reachable);
}
