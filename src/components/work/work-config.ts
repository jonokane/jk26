/**
 * Every tunable in the Work gallery (spec §9), one file, one line each.
 *
 * Jono adjusts these by feel. That must stay a one-line edit in one file, so
 * nothing here may be duplicated as a literal in a component or a stylesheet.
 * Numbers the CSS owns are NOT listed here — a config entry that tunes nothing
 * is worse than no entry (Phase 3 shipped three of those). Card geometry lives
 * in work.module.css because CSS is the only thing that reads it.
 */
export const WORK = {
  /**
   * How much of each card's scroll CELL is spent holding it dead-center, versus
   * easing on to the next. Every card — first and last included — gets an equal
   * cell, so the most recent study dwells exactly as long as the rest (it used
   * to get a half-width band and so the least focus of all, which is why it was
   * the easiest to miss). At 0 the pan is a continuous skim; toward 1 each card
   * holds, then snaps. Jono's dial — 0.9 is a long hold with a quick handoff.
   */
  dwell: 0.9,

  /**
   * What fraction of a card's HOLD the perimeter stroke takes to close. Below 1
   * the ring finishes with hold to spare, so the card sits complete-and-still
   * for a beat before it leaves — the "let me look at it" moment the stroke
   * completing is meant to reward. 1 would close the ring exactly as the card
   * departs, which reads as being rushed off. Lower = longer beat.
   */
  strokeSpan: 0.6,

  /**
   * Where the active card centers, as a fraction of viewport width. 0.5 is dead
   * center; lower nudges it left so the next card peeks in further on the right.
   * The horizontal analog of the teleprompter's `focalPosition`.
   */
  focusX: 0.5,

  /** Vertical scroll spent per pixel of horizontal travel. 1 means a pixel of
   *  scroll moves a card a pixel; higher makes the gallery feel heavier and the
   *  section taller. The prototype hardcoded 520vh and let this drift. */
  scrollPerPixel: 1,

  /**
   * Horizontal-pan velocity: how many track-pixels a pixel of horizontal
   * (two-finger / shift+wheel) swipe is worth. The base pan is 1:1 with the
   * finger, but `dwell` holds each card for most of its cell — so at 1 a swipe
   * spends most of itself in those holds, where nothing visibly moves, and the
   * gesture feels like it takes far too much swiping. This gears the swipe up so
   * it punches through the holds. Affects ONLY horizontal input; the
   * vertical-scroll feel is untouched. Jono's dial — higher is snappier, too
   * high and cards zip past before they register.
   */
  panGain: 5,

  /** A card at full opacity sits within this fraction of viewport width of the
   *  focus. Spec §9: `0.55 × innerWidth`. */
  focalBand: 0.55,

  /** What a card outside the focal band fades to. Spec §9: 0.42. */
  cardDimOpacity: 0.42,

  /**
   * The catch at Work's door (use-work-catch). A fast downward fling, wheel or
   * trackpad, that would carry past the start of Work is stopped and eased to
   * rest there, on the first card's hold, so the most recent study is never
   * flown past. Once per trip down. Touch, the keyboard, nav links and the
   * Scroll button are never caught, and reduced motion turns it off.
   * Jono's pick by feel (2026-11-08).
   */
  catch: {
    /** How far ahead of the page its scroll target must be, in vh, to count
     *  as a fling. Lower catches gentler scrolls; higher, only hard flings. */
    fling: 0.45,
    /** Seconds the glide to rest takes. Scroll input is held for this long,
     *  which is what absorbs the rest of the fling. */
    duration: 1.25,
    /** Scroll back above Work by this much (vh) to re-arm it for the next
     *  trip down. */
    rearm: 0.6,
    /** The glide: quick off the mark, then a long soft landing (quartic out). */
    easing: (t: number) => 1 - (1 - t) ** 4,
  },
} as const;
