"use client";

import { useEffect, type RefObject } from "react";

/**
 * Publishes the header's live height as `--header-h` on <html>, so anything
 * that must clear the floating pill can pad by what the pill ACTUALLY is.
 *
 * This exists because the header is not one height: it grows a second row in
 * Work (the study pills), so it is ~51px collapsed and ~107px expanded. Padding
 * content by a viewport unit instead — 13vh, say — silently breaks on a short
 * window, where 13vh lands *under* the expanded pill and the case study's
 * number and title tuck behind it. A pixel height can only be cleared by a
 * pixel measurement.
 *
 * ResizeObserver, not a one-shot measure: the row's open/close is a transition,
 * so the height is a range, not an event.
 */
export function useHeaderHeight(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    const publish = () => {
      /* offsetHeight, not the rect: the pill is transformed (it slides in on
         the morph) and a rect would report the *scaled* height mid-flight. */
      root.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };

    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);

    return () => {
      ro.disconnect();
      root.style.removeProperty("--header-h");
    };
  }, [ref]);
}
