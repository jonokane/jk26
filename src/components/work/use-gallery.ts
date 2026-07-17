"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { getLenis } from "@/components/smooth-scroll";
import { WORK } from "@/components/work/work-config";
import {
  activeIndexFor,
  cardOpacityFor,
  dwelledIndex,
  focusOffset,
  linearProgress,
  scrollDeltaForPan,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";

/** The cards and the earlier-work panel — everything the track pans. */
const PANEL_SELECTOR = "[data-work-card], [data-work-panel]";

/**
 * A wheel event's horizontal delta, in PIXELS whatever unit it arrived in.
 *
 * `deltaX` is only pixels when `deltaMode` says so. It is also emitted in LINES
 * (mode 1 — Firefox's mouse wheel, and its shift+wheel) and pages (mode 2), so a
 * raw `deltaX` of 3 can mean "three lines", not three pixels. Unnormalised, a
 * line-mode notch was measured travelling 1px where its pixel-mode equivalent
 * travelled 98 — and because the handler calls `preventDefault` first, the
 * browser's own scrolling is suppressed too. The gesture is not merely wrong, it
 * is dead, which spec §9 names as worse than never claiming it.
 *
 * The constants are Lenis's own (`LINE_HEIGHT = 100 / 6`), not a guess: it
 * normalises every wheel event it handles this way, so matching it keeps a pan
 * and a scroll feeling like the same hand.
 */
const LINE_HEIGHT = 100 / 6;

function pixelsFrom(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaX * LINE_HEIGHT;
  /* Mode 2 is pages. The page, for a horizontal delta, is a viewport WIDTH —
     Lenis uses the size of the axis being scrolled, and this axis is X. */
  if (event.deltaMode === 2) return event.deltaX * window.innerWidth;
  return event.deltaX;
}

/**
 * Drives the Work gallery (spec §9): measures the track, sizes the wrapper from
 * what it measured, and translates the track in X from vertical scroll.
 *
 * It writes; it holds no numbers. Every value comes from `gallery-engine`.
 *
 * No RAF loop of its own — CLAUDE.md's standing rule, and it has silently locked
 * scrolling site-wide before. Lenis already emits on every frame of the shared
 * GSAP ticker, so subscribing to it IS the frame loop.
 */
export function useGallery({
  wrapRef,
  trackRef,
  progressRef,
  active,
  onActiveIndex,
}: {
  wrapRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLElement | null>;
  progressRef: RefObject<HTMLElement | null>;
  active: boolean;
  onActiveIndex: (index: number) => void;
}) {
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!active || !wrap || !track) return;

    let travel = 0;
    let lastIndex = -1;
    /* The cards, and their track-local centres, cached from `measure`. Reading
       them here rather than per frame is the difference between one layout pass
       when the size changes and one forced reflow every single frame (a card's
       `getBoundingClientRect` in `update` synchronously flushed layout, which
       Task 6's review flagged). Track-local centres do not move as the track
       pans, so they only change on resize or font load — exactly when `measure`
       already runs. */
    let cards: HTMLElement[] = [];
    let centres: number[] = [];
    /* The progress bar we actually wrote to, so the cleanup can clear exactly
       that element. Reading `progressRef.current` back in the cleanup would find
       null on unmount — React detaches refs before a passive effect's teardown. */
    let writtenBar: HTMLElement | null = null;
    /* `document.fonts.ready` is a promise and cannot be unsubscribed, so it can
       resolve AFTER this effect has torn down — re-writing the wrapper height,
       the transform and the opacities that the cleanup just cleared, and leaving
       exactly the stale inline styles the cleanup exists to prevent. */
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      cards = [...track.querySelectorAll<HTMLElement>(PANEL_SELECTOR)];
      /* Track-local: `offsetLeft` is relative to the track (its offset parent),
         and unaffected by the track's own transform, so a centre measured here
         stays valid every frame however far the track has panned. */
      centres = cards.map((card) => card.offsetLeft + card.offsetWidth / 2);
      travel = travelFor(centres);
      /* The wrapper's height IS the scroll budget, derived from what we just
         measured. The prototype hardcoded 520vh and let the two drift apart
         every time a study was added or drafted (spec §9, gap 1). */
      wrap.style.height = `${Math.round(wrapperHeightFor(travel, window.innerHeight))}px`;
      update();
    };

    const update = () => {
      const progress = linearProgress(
        wrap.getBoundingClientRect().top,
        wrap.offsetHeight,
        window.innerHeight,
      );
      /* The horizontal teleprompter: hold each card at the focus, ease to the
         next (spec §9). The dwell is what keeps the first, most-recent study from
         being scrolled past. */
      const index = dwelledIndex(progress, centres.length, WORK.dwell);
      const offset = focusOffset(centres, index, window.innerWidth);
      track.style.transform = `translateX(${offset.toFixed(1)}px)`;

      const bar = progressRef.current;
      if (bar) {
        bar.style.width = `${(progress * 100).toFixed(2)}%`;
        writtenBar = bar;
      }

      const focus = WORK.focusX * window.innerWidth;
      cards.forEach((card, i) => {
        /* Its live viewport centre is its cached track-local centre plus however
           far the track has panned — no per-card layout read. */
        card.style.opacity = String(cardOpacityFor(centres[i] + offset - focus, window.innerWidth));
      });

      /* Only on change: this runs every frame and a setState per frame would
         re-render the section 60 times a second. */
      const active = activeIndexFor(index);
      if (active !== lastIndex) {
        lastIndex = active;
        onActiveIndex(active);
      }
    };

    /**
     * Horizontal input pans the gallery (spec §9).
     *
     * It drives VERTICAL scroll rather than the track, because `translateX` is
     * derived from `scrollY`: writing the transform here would make this a
     * second source of truth for the same pixel, and the next `update()` would
     * snap the track back out from under the gesture.
     *
     * preventDefault is load-bearing, not tidiness: macOS reads a two-finger
     * horizontal swipe as the browser's Back gesture, so without this, panning
     * the gallery navigates the visitor off the site.
     */
    const onWheel = (event: WheelEvent) => {
      if (travel <= 0) return;
      /* Only a gesture that is meaningfully horizontal. A diagonal trackpad
         swipe carries both deltas, and claiming those would fight the vertical
         scroll the visitor actually asked for. Both deltas share the event's
         deltaMode, so comparing them raw is sound. */
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const rect = wrap.getBoundingClientRect();
      /* Only while pinned. Outside the stage, a horizontal gesture is not ours. */
      if (rect.top > 0 || rect.bottom < window.innerHeight) return;

      event.preventDefault();
      const delta = scrollDeltaForPan(
        pixelsFrom(event),
        wrap.offsetHeight,
        window.innerHeight,
        travel,
      );
      const lenis = getLenis();
      /* targetScroll, NOT scroll. `scroll` is the ANIMATED position, which lags
         the target while Lenis eases — so during a fast pan each event would add
         its delta to a value that has not caught up yet, and the gesture would
         silently lose distance. `targetScroll` is where the scroll is already
         headed, so deltas accumulate exactly like Lenis's own wheel handling.
         Left smooth (no `immediate`) so a pan feels like every other scroll on
         the site, and so this stays Lenis's scroll rather than a second
         mechanism beside it. */
      if (lenis) lenis.scrollTo(lenis.targetScroll + delta);
      else window.scrollBy(0, delta);
    };

    const lenis = getLenis();
    lenis?.on("scroll", update);
    /* A fallback for the window before Lenis mounts, and for a scroll it did not
       originate. Cheap: update() is the same work either way. */
    window.addEventListener("scroll", update, { passive: true });
    /* passive: false — a passive listener cannot preventDefault, and without
       preventDefault this feature navigates people off the site. */
    window.addEventListener("wheel", onWheel, { passive: false });

    /* The track's width changes with the viewport (the card is `min(66vw,
       820px)`), and with the fonts, which land after first paint. Observing the
       track catches both without guessing at either. */
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    measure();

    return () => {
      disposed = true;
      lenis?.off("scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      /* Leave nothing behind: the index view and the reduced-motion path both
         render into this same DOM, and a stale inline height or transform would
         silently govern them. */
      wrap.style.height = "";
      track.style.transform = "";
      if (writtenBar) writtenBar.style.width = "";
      for (const card of track.querySelectorAll<HTMLElement>(PANEL_SELECTOR)) {
        card.style.opacity = "";
      }
    };
  }, [wrapRef, trackRef, progressRef, active, onActiveIndex]);
}
