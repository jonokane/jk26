"use client";

import { useEffect, useState } from "react";

/**
 * prefers-reduced-motion, hydration-safe: returns false during SSR and the
 * first client render (matching the server), then the real value + live
 * updates. The same pattern the parked hero learned the hard way.
 */
export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media queries are client-only
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
