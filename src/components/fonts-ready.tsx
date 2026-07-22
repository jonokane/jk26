"use client";

import { useEffect } from "react";

const SPEC = '140 1rem "mae-variable"';
const DEADLINE_MS = 3000;

/**
 * Adds `fonts-mae` to <html> once Mae actually renders (spec §14 punch
 * list): the Mae axis weights (140/180) look near-Thin on the Geist
 * fallback, so font-variation-settings stay off until Mae is confirmed.
 * Retry-until-deadline: the Typekit stylesheet may not have parsed on the
 * first call (the parked hero's proven pattern).
 */
export function FontsReady() {
  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = performance.now() + DEADLINE_MS;
    const attempt = () => {
      document.fonts
        .load(SPEC)
        .then((faces) => {
          if (canceled) return;
          if (faces.length > 0) document.documentElement.classList.add("fonts-mae");
          else if (performance.now() < deadline) timer = setTimeout(attempt, 150);
        })
        .catch(() => {});
    };
    attempt();
    return () => {
      canceled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return null;
}
