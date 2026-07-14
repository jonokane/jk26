/**
 * The collector's pose math (spec §7) — pure, so it can be reasoned about and
 * unit-tested away from the scroll that drives it. Nothing here touches the
 * DOM, GSAP or React: given a scroll progress it returns where every beat is.
 *
 * Poses are in **viewport pixels**: where the beat should appear on screen.
 * Turning one into a transform is the writer's job, and it differs by finish —
 * a desktop beat is absolutely positioned at the stage's origin, so its pose IS
 * its transform; a phone beat never leaves the document, so its transform is
 * the offset from the place it already occupies.
 *
 * The scroll progress `p` is the collector's travel: 0 when the section's top
 * meets the top of the viewport, 1 when the choreography is done (the section's
 * bottom on desktop, the end of the runway on a phone). ScrollTrigger hands it
 * to us.
 *
 * Each of the N beats owns one segment of `p` (`seg = 1 / (N + 1)`), spent
 * rising → holding center stage → pocketing into the tray. The spare segment at
 * the end is the assembly: the tray flies home.
 */

import type { CollectorLayout, CollectorTiming } from "./collector-config";

export interface Viewport {
  width: number;
  height: number;
}

/** A point in viewport pixels. */
export interface Point {
  x: number;
  y: number;
}

export interface Pose {
  /** Viewport px, top-left corner (transform-origin: top left). */
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

/** Progress each beat owns. The +1 is the assembly segment. */
export const segment = (count: number): number => 1 / (count + 1);

/** Progress at which the last beat is pocketed and the tray starts flying home. */
export const assembleStart = (count: number): number => count * segment(count);

/** Progress at which the last beat has landed. */
export const assembleEnd = (count: number, timing: CollectorTiming): number =>
  assembleStart(count) + Math.max(0, count - 1) * timing.assembleStagger + timing.assembleSpan;

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

/** A pose in the viewport units the layout is authored in. */
interface RawPose {
  xVw: number;
  yVh: number;
  scale: number;
  opacity: number;
}

/** The same pose in viewport px — what actually gets interpolated. */
interface PosePx {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

const px = (raw: RawPose, vp: Viewport): PosePx => ({
  x: (raw.xVw / 100) * vp.width,
  y: (raw.yVh / 100) * vp.height,
  scale: raw.scale,
  opacity: raw.opacity,
});

const lerpPose = (a: PosePx, b: PosePx, t: number): PosePx => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  scale: lerp(a.scale, b.scale, t),
  opacity: lerp(a.opacity, b.opacity, t),
});

const withZ = (pose: PosePx, z: number): Pose => ({ ...pose, z });

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

/** The 2×2 wall — only the desktop finish has one. */
export const wallPose = (index: number, l: CollectorLayout): RawPose => {
  if (l.finish.kind !== "wall") throw new Error("wallPose: this layout finishes in the flow");
  const { cols, colVw, topVh, rowVh, scale } = l.finish;
  return {
    xVw: l.insetVw + (index % cols) * colVw,
    yVh: topVh + Math.floor(index / cols) * rowVh,
    scale,
    opacity: 1,
  };
};

/**
 * Where a beat comes to rest: the wall (desktop), or the place it already
 * occupies in the document (phone).
 *
 * The phone's resting pose is a pose of *no transform at all* — which is why
 * the release is seamless. The beat lands exactly in the document, and from
 * there the document simply scrolls.
 */
function restPose(index: number, layout: CollectorLayout, vp: Viewport, home?: Point): PosePx {
  if (layout.finish.kind === "wall") return px(wallPose(index, layout), vp);
  return { x: home?.x ?? 0, y: home?.y ?? 0, scale: 1, opacity: 1 };
}

/**
 * Where beat `index` is at progress `p`, in viewport px.
 *
 * `home` is the beat's own place in the document, in viewport px. It is
 * required when the layout finishes in the flow (the phone) and ignored when it
 * finishes in a wall. The writer re-reads it every frame, because the document
 * is scrolling underneath the choreography.
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
  home?: Point,
): Pose {
  const p = clamp01(progress);
  const up = px(upPose(layout), vp);
  const active = px(activePose(layout), vp);
  const tray = px(trayPose(index, layout), vp);

  // Assembly: the tray flies home, one beat after another.
  const flightStart = assembleStart(count) + index * timing.assembleStagger;
  if (p >= flightStart) {
    const t = smoothstep(between(p, flightStart, flightStart + timing.assembleSpan));
    return withZ(lerpPose(tray, restPose(index, layout, vp, home), t), Z_TRAY);
  }

  const u = localTime(p, index, segment(count));
  const rise = index === 0 ? 0 : timing.rise;
  const pocketStart = 1 - timing.pocket;

  if (u < 0) return withZ(up, Z_TRAY);
  if (u < rise) return withZ(lerpPose(up, active, smoothstep(u / rise)), Z_ACTIVE);
  if (u < pocketStart) return withZ(active, Z_ACTIVE);
  if (u < 1) return withZ(lerpPose(active, tray, smoothstep(between(u, pocketStart, 1))), Z_FLIGHT);
  return withZ(tray, Z_TRAY);
}

/** The tray is worth a caption once something is in it, and only until it empties. */
export function trayHintOpacity(progress: number, count: number, timing: CollectorTiming): number {
  const p = clamp01(progress);
  const seg = segment(count);
  const start = assembleStart(count);
  const shown = between(p, seg - timing.hintFadeSpan, seg);
  const gone = between(p, start - timing.hintFadeSpan, start);
  return clamp01(shown * (1 - gone));
}

/**
 * The About heading, lede and CTA footer: nothing until the wall is landing.
 *
 * Only the wall finish needs this. On a phone they are ordinary document
 * content below the runway — they arrive by being scrolled to, which is the
 * whole point of releasing, so the writer holds them at 1 there.
 */
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
 * there would park the reader between two beats. Then the assembled state.
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
 * away from. Past the last target the collector is done and the section is just
 * a page again — snapping there would trap the reader inside it.
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
