"use client";

import { useEffect, useState } from "react";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";

/**
 * How the Work section presents itself, right now (spec §8, §12).
 *
 * - `document` — a plain vertical read. Reduced motion, and the server/no-JS
 *   render. No pin, no scrub, no horizontal movement.
 * - `swipe` — touch and narrow screens: the same panels, as a native
 *   horizontal swipe with CSS scroll-snap. No pin, no scrub.
 * - `pin` — the shelf: pinned, vertical scroll scrubbed into horizontal travel.
 *
 * This is a *derived* value, recomputed on every render from state that live
 * media-query listeners keep current — never a one-shot reveal. That matters:
 * the last time this codebase revealed content from an effect that ran once,
 * flipping the OS reduced-motion switch erased it for good. Toggle reduce here
 * and the document comes back, because the document is simply what this
 * function returns when `reduced` is true.
 */
export type ShelfMode = "document" | "swipe" | "pin";

/** Touch or narrow (spec §12: single column under ~760px, native swipe). */
const TOUCH = "(max-width: 47.99rem), (pointer: coarse)";

export function useShelfMode(): ShelfMode {
  const reduced = useReducedMotionPref();
  const touch = useMediaQuery(TOUCH);

  /* Before mount, `reduced` and `touch` are both false — they cannot be read
     during SSR. Rendering `pin` on that basis would ship the shelf as the
     server markup and leave a no-JS visitor with a pinned track he cannot move.
     So until the real queries are readable, the answer is the document, which
     is also what we want in the HTML. */
  const mounted = useMounted();
  if (!mounted) return "document";

  if (reduced) return "document";
  return touch ? "swipe" : "pin";
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- "the client is running" is only knowable here
    setMounted(true);
  }, []);
  return mounted;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media queries are client-only
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
