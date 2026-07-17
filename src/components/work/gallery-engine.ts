/**
 * The Work gallery's maths (spec §9) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `teleprompter-engine.ts` house style, spec
 * §14). The hook measures and writes; it holds no numbers.
 *
 * Everything here is DERIVED. §9's "prototype gaps to close" are almost all one
 * fault: the prototype wrote down numbers it should have measured — a 520vh
 * wrapper decoupled from travel, card numbers 01-08 in markup beside a live
 * counter. Nothing in this module may be given a count.
 */
import { WORK } from "@/components/work/work-config";

/**
 * How far the track must move for its last card to arrive, plus the trailing
 * gutter. Clamped at 0: a track narrower than the viewport has nowhere to go,
 * and a negative travel would push the cards off to the RIGHT.
 */
export function travelFor(trackScrollWidth: number, viewportWidth: number): number {
  return Math.max(0, trackScrollWidth - viewportWidth + viewportWidth * WORK.trailingGutter);
}

/**
 * The wrapper's height IS the scroll budget: one viewport to pin against, plus
 * whatever the travel costs. Derived, never authored — this is prototype gap 1,
 * where 520vh was hardcoded and the scroll-to-pixel rate therefore drifted every
 * time a study was added or drafted.
 */
export function wrapperHeightFor(travel: number, viewportHeight: number): number {
  return viewportHeight + travel * WORK.scrollPerPixel;
}

/**
 * 0 as the pin begins, 1 as it ends. Linear on purpose (spec §9: "linear, no
 * easing") — the scroll itself is already smoothed by Lenis, and easing this too
 * would compound into a lag the hand can feel.
 *
 * The zero-budget guard is not academic: `wrapHeight === viewportHeight` gives
 * 0/0, and NaN flows into `translateX(NaNpx)`, which the browser silently drops
 * rather than complaining. A wrapper with no budget means "nothing to travel".
 */
export function linearProgress(
  wrapTop: number,
  wrapHeight: number,
  viewportHeight: number,
): number {
  const budget = wrapHeight - viewportHeight;
  if (budget <= 0) return 0;
  return Math.min(1, Math.max(0, -wrapTop / budget));
}

/** Negative: progress carries the track left. */
export function trackOffsetFor(progress: number, travel: number): number {
  return -progress * travel;
}

/**
 * The card nearest the viewport's horizontal centre.
 *
 * Deliberately NOT derived from progress (spec §9). Progress is a property of
 * the scroll; the active card is a property of what is actually on screen, and
 * the two drift apart at the ends of the track where the first and last cards
 * sit against their gutters. The counter has to agree with the eye.
 *
 * `centres` are viewport-relative card centres, in order.
 */
export function activeIndexFor(centres: readonly number[], viewportWidth: number): number {
  const middle = viewportWidth * 0.5;
  let best = 0;
  let bestDistance = Infinity;
  centres.forEach((centre, i) => {
    const distance = Math.abs(centre - middle);
    /* Strictly less-than, so a tie keeps the earlier card and the counter cannot
       flicker between two equidistant neighbours. */
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

/** Full inside the focal band, dim outside it. `distance` may be signed. */
export function cardOpacityFor(distanceFromCentre: number, viewportWidth: number): number {
  return Math.abs(distanceFromCentre) < viewportWidth * WORK.focalBand ? 1 : WORK.cardDimOpacity;
}

/**
 * The vertical scroll a horizontal gesture is worth (spec §9).
 *
 * Horizontal input pans by driving vertical scroll, NOT by writing the track's
 * transform: `translateX` is derived from `scrollY`, so a handler that wrote it
 * would be a second source of truth for the same pixel and the next vertical
 * frame would snap the track back out from under the gesture.
 *
 * This is the exact inverse of `trackOffsetFor ∘ linearProgress`, so one pixel
 * of finger stays one pixel of card at any travel or viewport.
 */
export function scrollDeltaForPan(
  deltaX: number,
  wrapHeight: number,
  viewportHeight: number,
  travel: number,
): number {
  if (travel <= 0) return 0;
  return (deltaX * (wrapHeight - viewportHeight)) / travel;
}
