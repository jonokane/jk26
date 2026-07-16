"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NAV_WORDMARK_SLOT_ID } from "@/components/site-header";

/** The pill arrives only as the wordmark lands — the last 2% of the
 *  morph (spec §7). Not 0.85: at that point the mark is still in flight. */
const HEADER_ON_AT = 0.98;

/**
 * The translation the nav slot currently inherits from the header's entrance
 * transform, in px. Zero once the pill has landed (`transform: none`).
 */
function headerTranslation(slot: HTMLElement): { x: number; y: number } {
  const header = slot.closest("header");
  if (!header || typeof DOMMatrixReadOnly === "undefined") return { x: 0, y: 0 };
  const t = getComputedStyle(header).transform;
  if (!t || t === "none") return { x: 0, y: 0 };
  const m = new DOMMatrixReadOnly(t);
  return { x: m.e, y: m.f };
}

interface MorphOpts {
  /** The fixed live wordmark layer (what actually flies). */
  liveRef: RefObject<HTMLElement | null>;
  /** The in-flow wordmark (layout + measurement source). */
  flowRef: RefObject<HTMLElement | null>;
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
      /* The fly is fixed and out of flow, so it does not inherit the hero's
         fluid clamp() font-size. Copy it from the anchor before measuring. */
      live.style.fontSize = getComputedStyle(flow).fontSize;

      const f = flow.getBoundingClientRect();
      start = { left: f.left, top: f.top + window.scrollY, height: f.height };

      /* The target must be the slot's RESTING rect. The pill hides itself with
         `transform: translateY(-16px)` until `header-on` lands (.site-header in
         globals.css) and getBoundingClientRect() reports the *transformed* box
         — including ancestor transforms. Measuring naively (which is what this
         did) sends the wordmark to slotTop − 16, straddling the pill's top
         edge, because at measure time the header is still up in its hidden
         state. So: read the header's current transform and undo its
         translation. Correct at any point in the pill's 0.45s transition, and
         it stays correct if the offset is ever retuned. */
      const s = slot.getBoundingClientRect();
      const shift = headerTranslation(slot);
      target = { left: s.left - shift.x, top: s.top - shift.y, height: s.height };
    };

    const smooth = (t: number) => t * t * (3 - 2 * t);
    const apply = (p: number) => {
      /* Measured live, every frame — not cached at mount — so the morph
         stays correct as the wordmark's real face (and layout) settles in,
         not just at whatever geometry existed when the effect first ran
         (spec §7). */
      measure();
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

    /* Reveal only once the fly is actually placed. It renders at its CSS
       default (fixed, top-left, full size) until apply() first runs, and this
       hook does not arm until the build-in finishes — so without this the fly
       would sit in the corner as a second wordmark for the whole run. The CSS
       hides the anchor off the same attribute, so the handover is atomic. */
    live.dataset.morph = "live";

    /* Re-measure once the wordmark's real face lands: Config Variable is
       materially wider than the fallback, so a pre-font measurement sends the
       fly to the wrong place and only self-corrects on a refresh. */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

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
      delete live.dataset.morph;
    };
  }, [active, liveRef, flowRef, onProgress]);
}
