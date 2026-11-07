"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Where the reveal fires: once the element's top edge has risen 20% of the
 * viewport above the bottom. An EDGE test, deliberately not spec §11's
 * `threshold: 0.2` — a ratio is a fraction of the ELEMENT, so a card taller
 * than the screen (How I lead at 320px is ~2 screens) would need ~400px of
 * itself on screen before it appeared, and the reader would scroll through
 * blank canvas waiting for it. A margin is a fraction of the VIEWPORT, so it
 * fires at the same visual moment whatever the element's height.
 */
export const REVEAL_ROOT_MARGIN = "0px 0px -20% 0px";

/**
 * The spec §11 reveal: a one-shot IntersectionObserver that disconnects on
 * fire. Returns the value for a `data-reveal` attribute; the from-state, the
 * curve and the duration all live in the consumer's CSS.
 *
 * - `undefined` (server, first render, no JS): no attribute, so the element is
 *   simply VISIBLE. The from-state is never shipped in the HTML, so a visitor
 *   without JavaScript, or a crawler, still sees the content.
 * - `"pending"`: armed after mount, only if the element is NOT already on
 *   screen. Hiding something off-screen cannot flash; hiding something the
 *   reader is looking at (a reload mid-page) would, so that case is skipped.
 * - `"shown"`: it entered the viewport and resolved. One-shot; never re-hides.
 *
 * Reduced motion is the consumer's CSS, under a media query, so it is right at
 * first paint without asking JavaScript (spec §11).
 */
export function useReveal(ref: RefObject<HTMLElement | null>): "pending" | "shown" | undefined {
  const [state, setState] = useState<"pending" | "shown" | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (onScreen) return; // already in view: leave it visible, no flash

    setState("pending");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: REVEAL_ROOT_MARGIN, threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  return state;
}
