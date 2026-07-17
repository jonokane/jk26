"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { getLenis } from "@/components/smooth-scroll";
import {
  activeIndexFor,
  cardOpacityFor,
  linearProgress,
  scrollDeltaForPan,
  trackOffsetFor,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";

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
      /* scrollWidth, not getBoundingClientRect: the track is translated, and a
         rect would report where it currently IS rather than how wide it is. */
      travel = travelFor(track.scrollWidth, window.innerWidth);
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
      track.style.transform = `translateX(${trackOffsetFor(progress, travel).toFixed(1)}px)`;

      const bar = progressRef.current;
      if (bar) {
        bar.style.width = `${(progress * 100).toFixed(2)}%`;
        writtenBar = bar;
      }

      const cards = [...track.querySelectorAll<HTMLElement>("[data-work-card], [data-work-panel]")];
      const centres = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });

      cards.forEach((card, i) => {
        card.style.opacity = String(
          cardOpacityFor(centres[i] - window.innerWidth * 0.5, window.innerWidth),
        );
      });

      /* Only on change: this runs every frame and a setState per frame would
         re-render the section 60 times a second. */
      const index = activeIndexFor(centres, window.innerWidth);
      if (index !== lastIndex) {
        lastIndex = index;
        onActiveIndex(index);
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
         scroll the visitor actually asked for. */
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const rect = wrap.getBoundingClientRect();
      /* Only while pinned. Outside the stage, a horizontal gesture is not ours. */
      if (rect.top > 0 || rect.bottom < window.innerHeight) return;

      event.preventDefault();
      const delta = scrollDeltaForPan(
        event.deltaX,
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
      for (const card of track.querySelectorAll<HTMLElement>("[data-work-card], [data-work-panel]")) {
        card.style.opacity = "";
      }
    };
  }, [wrapRef, trackRef, progressRef, active, onActiveIndex]);
}
