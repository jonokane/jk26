"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  DARK_QUERY,
  parseThemeChoice,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChoice,
} from "@/lib/theme-engine";

/**
 * The visitor's theme (spec §4). The pre-hydration script has already painted
 * <html data-theme>; this hook adopts that value, then owns it.
 *
 * Hydration-safe: `theme` is "light" on the server and the first client
 * render, then corrected in an effect — the same pattern useReducedMotionPref
 * uses. The paint is never wrong regardless, because the inline script set the
 * attribute before React ran.
 */
export function useTheme(): { theme: Theme; setChoice: (c: ThemeChoice) => void } {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const stored = parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
    const resolved = resolveTheme(stored, mq.matches);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage and media queries are client-only
    setTheme(resolved);
    applyTheme(resolved);

    /* Follow the OS live, but only while the visitor has not chosen. */
    const onChange = (e: MediaQueryListEvent) => {
      if (parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY)) !== "system") return;
      const next = resolveTheme("system", e.matches);
      setTheme(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setChoice = useCallback((choice: ThemeChoice) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      /* Private mode: the choice still applies for this session. */
    }
    const next = resolveTheme(choice, window.matchMedia(DARK_QUERY).matches);
    setTheme(next);
    applyTheme(next);
  }, []);

  return { theme, setChoice };
}
