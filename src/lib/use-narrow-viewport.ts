"use client";

import { useEffect, useState } from "react";

/**
 * True when the viewport is at or below the Work section's collapse width
 * (spec §9, gap 2). Hydration-safe: false on the server and the first client
 * render, then the real value with live updates — the `use-reduced-motion.ts`
 * pattern.
 *
 * This exists because the collapse cannot be CSS alone. The gallery turns
 * vertical scroll into horizontal pan; on a phone that is a scroll trap, so the
 * narrow layout is not a restyle of the gallery but a different VIEW (the index).
 * Choosing the view is React state, so React has to know the width.
 *
 * The 900px here mirrors the `@media (max-width: 900px)` in the Work styles.
 * They are the same threshold expressed for the two languages that each own a
 * piece of the collapse; keep them in step.
 */
const NARROW_QUERY = "(max-width: 900px)";

export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media queries are client-only
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}
