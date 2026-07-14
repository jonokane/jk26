"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

interface ShelfSwipeOptions {
  /** The scroll container: on touch the track scrolls natively, it is not transformed. */
  trackRef: RefObject<HTMLDivElement | null>;
  active: boolean;
  onPanelChange: (index: number) => void;
}

/**
 * The touch shelf (spec §12): the same panels, moved by the reader's thumb.
 * Native horizontal scrolling with CSS scroll-snap — no pin, no scrub, no
 * ScrollTrigger, nothing on the ticker, and no JS in the loop at all.
 *
 * Panel tracking is an IntersectionObserver against the track, not a scroll
 * listener: it fires on the discrete event we actually care about (a panel
 * arriving) rather than on every frame of a flick, and it costs no RAF.
 */
export function useShelfSwipe({
  trackRef,
  active,
  onPanelChange,
}: ShelfSwipeOptions): (index: number) => void {
  const handlers = useRef({ onPanelChange });
  useEffect(() => {
    handlers.current = { onPanelChange };
  });

  useEffect(() => {
    if (!active) return;
    const track = trackRef.current;
    if (!track) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-shelf-panel"));
          if (Number.isInteger(index)) handlers.current.onPanelChange(index);
        }
      },
      { root: track, threshold: 0.6 },
    );
    for (const panel of track.querySelectorAll("[data-shelf-panel]")) observer.observe(panel);

    return () => observer.disconnect();
  }, [active, trackRef]);

  return useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    },
    [trackRef],
  );
}
