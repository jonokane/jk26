"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getLenis } from "@/components/smooth-scroll";

/**
 * Shared accessible-overlay lock (spec: 2026-07-28 image zoom). Both the
 * case-study modal and the image lightbox need the same behavior while open:
 * stop Lenis, inert the rest of the page, trap focus, close on Escape, restore
 * on unmount. Extracted here so there is one copy, not two.
 *
 * Save/restore (not unconditional reset) is deliberate: the lightbox opens OVER
 * the already-open modal, which has itself stopped Lenis and inerted the page.
 * Restoring each element's PRIOR inert value and Lenis's PRIOR stopped state
 * means closing the inner overlay never re-enables the frozen page beneath the
 * outer one. Used alone, the prior state is "not inert / not stopped", so the
 * behavior is unchanged.
 */
export function useOverlayLock({
  containerRef,
  onDismiss,
}: {
  containerRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  // Keep the latest onDismiss without re-binding the key handler. Synced in
  // an effect, not during render: refs may only be written outside render
  // (react-hooks/refs) — assigning here still lands before the lock effect's
  // keydown listener can fire, since effects run in declaration order.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lenis = getLenis();
    const lenisWasStopped = lenis?.isStopped ?? false;
    if (!lenisWasStopped) lenis?.stop();

    // Capture the return target BEFORE inerting: the trigger may live in the
    // background we're about to inert, and an engine that blurs inert elements
    // synchronously would otherwise capture <body>.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== container && !el.contains(container),
    );
    const priorInert = siblings.map((el) => el.inert);
    siblings.forEach((el) => (el.inert = true));

    container.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Only the overlay that owns focus responds. Otherwise, with the image
        // lightbox open over the modal, a single Escape fires BOTH window
        // listeners and tears down the modal behind the still-open lightbox.
        // (`Node.contains` includes the node itself; the explicit `=== container`
        // is just for clarity.) Symmetric with the focus-position Tab guard below.
        if (container.contains(document.activeElement) || document.activeElement === container) {
          onDismissRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      siblings.forEach((el, i) => (el.inert = priorInert[i]));
      if (!lenisWasStopped) lenis?.start();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [containerRef]);
}
