/**
 * The Work gallery's maths (spec §9) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `teleprompter-engine.ts` house style, spec
 * §14). The hook measures and writes; it holds no numbers.
 *
 * The gallery is a horizontal teleprompter: the active card holds at a focus
 * position, then the next eases into it, mirroring the About section's vertical
 * focus-and-dwell. Everything here is DERIVED from measured card centers — §9's
 * "prototype gaps" were almost all one fault, a count written down that should
 * have been measured, so nothing in this module may be given one.
 */
import { WORK } from "@/components/work/work-config";

/**
 * The classic smoothstep, clamped then eased with t²(3−2t). Local to this
 * module rather than shared with teleprompter-engine's copy: the two engines
 * stay independent, and this is four lines. The degenerate guard makes `dwell`
 * of 1 a hard step instead of `0/0` — a plateau so wide the two edges meet.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * The distance the track travels: from the first card sitting at the focus to
 * the last. Both positions share `focusX × innerWidth`, so it cancels and the
 * travel is simply the span between the outer card centers — derived from the
 * measured layout, never authored. A single card (or none) has nowhere to go.
 *
 * `cardCenters` are track-local (measured at `translateX = 0`), so they do not
 * move as the track pans and can be cached across frames.
 */
export function travelFor(cardCenters: readonly number[]): number {
  if (cardCenters.length < 2) return 0;
  return cardCenters[cardCenters.length - 1] - cardCenters[0];
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
 * 0 as the pin begins, 1 as it ends.
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

/**
 * Linear scroll progress → a fractional panel index in `[0, panelCount − 1]`
 * (spec §9). This is the whole of the dwell: a linear map gives every card the
 * same constant velocity, so the most recent study slides past no more stickily
 * than any other. Here each card HOLDS at its integer index for a stretch, then
 * eases to the next, so a card cannot be crossed without scrolling through it.
 *
 * The scroll is divided into `panelCount` equal CELLS, one per card, NOT
 * `panelCount − 1` segments between cards. That equality is the point: a
 * segment model gave the first and last cards half-width bands — the most
 * recent study got the LEAST focus and was the easiest to miss. A cell model
 * holds card 0 at the very start and card `N−1` through the very end for the
 * same span as everyone in between.
 *
 * Within a card's cell it holds (index stays put) for `WORK.dwell` of the cell,
 * then smoothsteps to the next over the remainder. The last cell only holds —
 * there is no card after it to ease toward. `dwell` 0 is a continuous eased
 * skim; toward 1, a long hold with a quick handoff.
 */
export function dwelledIndex(progress: number, panelCount: number, dwell: number): number {
  if (panelCount <= 1) return 0;
  const p = Math.min(1, Math.max(0, progress));
  const scaled = p * panelCount; // [0, panelCount], one unit per cell
  const k = Math.min(Math.floor(scaled), panelCount - 1); // the cell we are in
  if (k >= panelCount - 1) return panelCount - 1; // last cell: hold, nothing to ease to
  const s = scaled - k; // position within the cell, [0, 1]
  const hold = Math.min(1, Math.max(0, dwell));
  /* Held (0) through the first `hold` of the cell, then eases to the next card
     across the remainder. */
  return k + smoothstep(hold, 1, s);
}

/**
 * The `translateX` that centers the card at `fractionalIndex` on the focus.
 *
 * `fractionalIndex` is `dwelledIndex`'s output, so between two cards it is
 * fractional; the focus rides the interpolated point between their centers,
 * which is what makes the transition a glide rather than a jump. The offset is
 * `focus − center`: positive early (the first card's center is left of focus, so
 * the track shifts right to bring it in), negative late.
 */
export function focusOffset(
  cardCenters: readonly number[],
  fractionalIndex: number,
  viewportWidth: number,
): number {
  if (cardCenters.length === 0) return 0;
  const last = cardCenters.length - 1;
  const i0 = Math.min(Math.max(Math.floor(fractionalIndex), 0), last);
  const i1 = Math.min(i0 + 1, last);
  const frac = fractionalIndex - i0;
  const center = cardCenters[i0] + (cardCenters[i1] - cardCenters[i0]) * frac;
  return WORK.focusX * viewportWidth - center;
}

/**
 * The card the counter names: the one the focus is nearest. Rounding the
 * fractional index is exact here — each card is genuinely centered at the focus
 * during its dwell, so `round` agrees with the eye by construction, and there is
 * no separate nearest-center measurement to drift from it.
 */
export function activeIndexFor(fractionalIndex: number): number {
  return Math.round(fractionalIndex);
}

/**
 * A card's opacity from its signed distance to the focus. Full within the focal
 * band, dim outside it — so the focused card and a close neighbor read as one,
 * and the far cards recede. `distance` may be signed; only its magnitude counts.
 */
export function cardOpacityFor(distanceFromFocus: number, viewportWidth: number): number {
  return Math.abs(distanceFromFocus) < viewportWidth * WORK.focalBand ? 1 : WORK.cardDimOpacity;
}

/**
 * How far the focused card's perimeter stroke has traced, 0→1, for the card at
 * `index` (spec §9). The stroke is the visible answer to "the card is holding
 * still, am I still scrolling?" — it advances with the LINEAR scroll while the
 * card sits at the focus.
 *
 * It traces across the card's own hold: empty until the card's cell begins
 * (`index / panelCount`), then filling over `strokeSpan` of that hold, so it
 * CLOSES BEFORE the hold ends. The gap between the ring closing and the card
 * leaving is the beat — the card sits complete and still for a moment, inviting
 * the click, rather than being swept off the instant the ring shuts. A lone card
 * traces across the whole scroll.
 */
export function cardStrokeProgress(
  progress: number,
  panelCount: number,
  index: number,
): number {
  const p = Math.min(1, Math.max(0, progress));
  if (panelCount <= 1) return p;
  const cell = 1 / panelCount;
  const holdStart = index * cell;
  /* The ring closes after `strokeSpan` of the hold, which is `WORK.dwell` of the
     cell — leaving (1 − strokeSpan) of the hold as the beat before the card
     leaves. */
  const traceEnd = holdStart + WORK.strokeSpan * WORK.dwell * cell;
  if (traceEnd <= holdStart) return p >= holdStart ? 1 : 0;
  return Math.min(1, Math.max(0, (p - holdStart) / (traceEnd - holdStart)));
}

/**
 * The vertical scroll a horizontal gesture is worth (spec §9).
 *
 * Horizontal input pans by driving vertical scroll, NOT by writing the track's
 * transform: `translateX` is derived from `scrollY`, so a handler that wrote it
 * would be a second source of truth for the same pixel and the next vertical
 * frame would snap the track back out from under the gesture.
 *
 * This converts a pixel of finger to the scroll that moves the track a pixel on
 * AVERAGE (`budget / travel`). The dwell makes the instantaneous rate vary, so a
 * pan resists slightly at a card's hold and gives at the transition — which
 * reads as the same magnetism the eye sees, not as a fault.
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
