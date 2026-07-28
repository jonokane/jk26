"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Whether case-study body figures in this subtree offer click-to-zoom
 * (spec: 2026-07-28 image zoom). Default on: inline and Pin images are small in
 * layout, so the lightbox always enlarges them. Turned OFF inside <Breakout>
 * (via <ZoomDisabled>) — a breakout is already displayed at or beyond
 * full-screen size, so a fit-in-viewport lightbox could only shrink it, which
 * reads as a broken "zoom". So breakouts are the big view already, and aren't
 * themselves zoomable.
 */
const ZoomEnabledContext = createContext(true);

export function useZoomEnabled(): boolean {
  return useContext(ZoomEnabledContext);
}

/** Disables click-to-zoom for the figures it wraps. */
export function ZoomDisabled({ children }: { children: ReactNode }) {
  return <ZoomEnabledContext.Provider value={false}>{children}</ZoomEnabledContext.Provider>;
}
