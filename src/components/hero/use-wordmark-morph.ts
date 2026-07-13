"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NAV_WORDMARK_SLOT_ID } from "@/components/site-header";

const HEADER_ON_AT = 0.85;

interface MorphOpts {
  /** The fixed live wordmark layer (what actually flies). */
  liveRef: RefObject<HTMLDivElement | null>;
  /** The in-flow wordmark (layout + measurement source). */
  flowRef: RefObject<HTMLDivElement | null>;
  /** settled && font ready && !reducedMotion */
  active: boolean;
  onProgress?: (p: number) => void;
}

/**
 * Scroll-scrubbed FLIP morph (spec §6): the wordmark flies from its hero
 * position into the header slot over the first ~0.85 viewport of scroll,
 * reversibly. Runs on ScrollTrigger (shared gsap ticker).
 */
export function useWordmarkMorph({ liveRef, flowRef, active, onProgress }: MorphOpts): void {
  useEffect(() => {
    if (!active) return;
    const live = liveRef.current;
    const flow = flowRef.current;
    const slot = document.getElementById(NAV_WORDMARK_SLOT_ID);
    if (!live || !flow || !slot) return;

    /* document-space start rect (flow wordmark) + viewport-space target
       (the header is position:fixed, so the slot rect is scroll-stable) */
    let start = { left: 0, top: 0, height: 1 };
    let target = { left: 0, top: 0, height: 1 };
    const measure = () => {
      const f = flow.getBoundingClientRect();
      start = { left: f.left, top: f.top + window.scrollY, height: f.height };
      const s = slot.getBoundingClientRect();
      target = { left: s.left, top: s.top, height: s.height };
    };

    const smooth = (t: number) => t * t * (3 - 2 * t);
    const apply = (p: number) => {
      const e = smooth(p);
      const startTopInViewport = start.top - window.scrollY;
      const x = gsap.utils.interpolate(start.left, target.left, e);
      const y = gsap.utils.interpolate(startTopInViewport, target.top, e);
      const scale = gsap.utils.interpolate(1, target.height / start.height, e);
      gsap.set(live, { x, y, scale });
      document.documentElement.classList.toggle("header-on", p > HEADER_ON_AT);
      onProgress?.(p);
    };

    measure();
    apply(0);
    const st = ScrollTrigger.create({
      start: 0,
      end: () => window.innerHeight * 0.85,
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefreshInit: measure,
      onRefresh: (self) => apply(self.progress),
    });

    return () => {
      st.kill();
      document.documentElement.classList.remove("header-on");
      gsap.set(live, { clearProps: "transform" });
    };
  }, [active, liveRef, flowRef, onProgress]);
}
