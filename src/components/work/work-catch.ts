/**
 * The catch at Work's door: pure decisions, no DOM, no Lenis. use-work-catch
 * feeds these the live scroll state and acts on the answer.
 *
 * All positions are document scroll offsets in px (window.scrollY space).
 */

export interface ScrollState {
  /** Where the page is right now: Lenis's animated position. */
  scroll: number;
  /** Where the page is headed: Lenis's target, which runs ahead during a fling. */
  target: number;
  /** Lenis's direction: 1 down, -1 up, 0 at rest. */
  direction: number;
  /** The top of the Work section. */
  workTop: number;
  viewportHeight: number;
}

/**
 * A fling that should be caught: moving down, still short of Work, headed
 * past its top, and far enough from where it's headed to be a fling rather
 * than an ordinary scroll that happens to cross the line.
 *
 * The distance test is what spares a gentle scroller: a few wheel notches
 * keep `target` only a little ahead of `scroll`, so crossing into Work at an
 * easy pace never trips it. A trackpad flick or a hard wheel spin throws the
 * target far ahead at once.
 */
export function isFlingPastWork(s: ScrollState, flingVh: number): boolean {
  if (s.direction !== 1) return false;
  if (s.scroll >= s.workTop || s.target <= s.workTop) return false;
  return s.target - s.scroll > flingVh * s.viewportHeight;
}

/**
 * Once caught, the catch stays spent until the reader has scrolled back up
 * clear of Work's door, so it fires once per trip down, never on every fling
 * through the gallery.
 */
export function shouldRearm(scroll: number, workTop: number, viewportHeight: number, rearmVh: number): boolean {
  return scroll < workTop - rearmVh * viewportHeight;
}
