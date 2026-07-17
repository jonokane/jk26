/**
 * The Work gallery's maths (spec §9) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `teleprompter-engine.ts` house style, spec
 * §14). The hook measures and writes; it holds no numbers.
 *
 * The gallery is a horizontal teleprompter: the active card holds at a focus
 * position, then the next eases into it, mirroring the About section's vertical
 * focus-and-dwell. Everything here is DERIVED from measured card centres — §9's
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
 * travel is simply the span between the outer card centres — derived from the
 * measured layout, never authored. A single card (or none) has nowhere to go.
 *
 * `cardCentres` are track-local (measured at `translateX = 0`), so they do not
 * move as the track pans and can be cached across frames.
 */
export function travelFor(cardCentres: readonly number[]): number {
  if (cardCentres.length < 2) return 0;
  return cardCentres[cardCentres.length - 1] - cardCentres[0];
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
 * Linear scroll progress → a fractional panel index in `[0, panelCount − 1]`,
 * with a smoothstep plateau at each whole card (spec §9). This is the whole of
 * the dwell: a linear map gives every card the same constant velocity, so the
 * most recent study slides past no more stickily than any other. Here each card
 * HOLDS at its integer index for a stretch, then eases to the next, so a card
 * cannot be crossed without scrolling through its dwell.
 *
 * `WORK.dwell` sets how much of a card's band is hold versus ease: 0 is a smooth
 * continuous skim (a gentle per-card ease, never linear — motion here is always
 * eased), 1 is a one-at-a-time snap. The hold is split evenly across the two
 * ends of a segment, so the outgoing hold of card k and the incoming hold of
 * card k+1 meet as a single plateau centred on the integer between them.
 */
export function dwelledIndex(progress: number, panelCount: number, dwell: number): number {
  if (panelCount <= 1) return 0;
  const p = Math.min(1, Math.max(0, progress));
  const scaled = p * (panelCount - 1);
  /* The segment this progress falls in, k → k+1. Clamped to the last real
     segment so `p === 1` reads as "end of the last segment", not a phantom one. */
  const k = Math.min(Math.floor(scaled), panelCount - 2);
  const s = scaled - k; // position within the segment, [0, 1]
  const half = Math.min(1, Math.max(0, dwell)) / 2;
  return k + smoothstep(half, 1 - half, s);
}

/**
 * The `translateX` that centres the card at `fractionalIndex` on the focus.
 *
 * `fractionalIndex` is `dwelledIndex`'s output, so between two cards it is
 * fractional; the focus rides the interpolated point between their centres,
 * which is what makes the transition a glide rather than a jump. The offset is
 * `focus − centre`: positive early (the first card's centre is left of focus, so
 * the track shifts right to bring it in), negative late.
 */
export function focusOffset(
  cardCentres: readonly number[],
  fractionalIndex: number,
  viewportWidth: number,
): number {
  if (cardCentres.length === 0) return 0;
  const last = cardCentres.length - 1;
  const i0 = Math.min(Math.max(Math.floor(fractionalIndex), 0), last);
  const i1 = Math.min(i0 + 1, last);
  const frac = fractionalIndex - i0;
  const centre = cardCentres[i0] + (cardCentres[i1] - cardCentres[i0]) * frac;
  return WORK.focusX * viewportWidth - centre;
}

/**
 * The card the counter names: the one the focus is nearest. Rounding the
 * fractional index is exact here — each card is genuinely centred at the focus
 * during its dwell, so `round` agrees with the eye by construction, and there is
 * no separate nearest-centre measurement to drift from it.
 */
export function activeIndexFor(fractionalIndex: number): number {
  return Math.round(fractionalIndex);
}

/**
 * A card's opacity from its signed distance to the focus. Full within the focal
 * band, dim outside it — so the focused card and a close neighbour read as one,
 * and the far cards recede. `distance` may be signed; only its magnitude counts.
 */
export function cardOpacityFor(distanceFromFocus: number, viewportWidth: number): number {
  return Math.abs(distanceFromFocus) < viewportWidth * WORK.focalBand ? 1 : WORK.cardDimOpacity;
}

/**
 * How far the focused card's perimeter stroke has traced, 0→1, for the card at
 * `index` (spec §9). The stroke is the visible answer to "the card is holding
 * still, am I still scrolling?" — it advances with the LINEAR scroll across the
 * card's active band, so it keeps moving through the dwell hold while the card
 * itself sits at the focus, and completes exactly as the card hands off to the
 * next.
 *
 * `index`'s band is the stretch of progress over which it is the nearest card:
 * the segment midpoints on either side, `(index ± 0.5) / (panelCount − 1)`,
 * clamped so the first and last cards' bands stop at the ends rather than run
 * past them. A lone card owns the whole scroll.
 */
export function cardStrokeProgress(
  progress: number,
  panelCount: number,
  index: number,
): number {
  const p = Math.min(1, Math.max(0, progress));
  if (panelCount <= 1) return p;
  const segment = 1 / (panelCount - 1);
  const bandStart = Math.max(0, (index - 0.5) * segment);
  const bandEnd = Math.min(1, (index + 0.5) * segment);
  if (bandEnd <= bandStart) return 0;
  return Math.min(1, Math.max(0, (p - bandStart) / (bandEnd - bandStart)));
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
