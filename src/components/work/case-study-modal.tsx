"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, TransitionEvent } from "react";
import { useRouter } from "next/navigation";
import { getLenis } from "@/components/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-modal.module.css";

/**
 * The slide-up case-study sheet (spec §10): an opaque canvas sheet that covers
 * the one-pager, slides `translateY(100%→0)`, and closes on the pill, Escape, or
 * the back button. The URL is the source of truth — closing is `router.back()`,
 * which pops the intercepted entry and restores the page and its scroll beneath.
 *
 * Lenis is stopped while open so the frozen page cannot scroll behind the sheet;
 * `data-lenis-prevent` lets the inner scroller scroll natively past the stopped
 * instance (CLAUDE.md: one ticker, no second RAF loop). The sheet itself only
 * carries the slide transform — the scroller is a separate element so the close
 * pill (a child of the non-scrolling sheet) can hold in place while content
 * scrolls. Under reduced motion the sheet does not slide (CSS drops the
 * transition) and closing navigates at once.
 */
export function CaseStudyModal({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotionPref();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  /* Slide up on mount, and lock the page behind it. The rAF lets the initial
     translateY(100%) paint before flipping to 0 so the transition actually runs
     (setting both in one paint would show no animation).

     Accessible-modal contract (a11y review): the frozen one-pager stays mounted
     as a sibling behind the sheet, so on open we make every other <body> child
     `inert` (removed from tab order and the a11y tree — this is also the Tab
     trap's backstop), move focus into the dialog, and on close restore focus to
     whatever opened it (the card). Lenis is stopped so the page can't scroll
     behind; the inner scroller scrolls natively via data-lenis-prevent. */
  useEffect(() => {
    const sheet = sheetRef.current;
    const lenis = getLenis();
    lenis?.stop();

    const backgrounded = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== sheet && !el.contains(sheet),
    );
    backgrounded.forEach((el) => (el.inert = true));

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setOpen(true);
      sheet?.focus({ preventScroll: true });
    });

    return () => {
      cancelAnimationFrame(raf);
      lenis?.start();
      backgrounded.forEach((el) => (el.inert = false));
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  /* Close: slide down, then pop history when the transform settles. Reduced
     motion has no slide to wait on, so it navigates straight away. */
  const close = () => {
    if (reduced) {
      router.back();
      return;
    }
    setOpen(false);
  };

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === sheetRef.current && event.propertyName === "transform" && !open) {
      router.back();
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      /* Trap Tab inside the sheet. The inert background already keeps focus out
         of the page, but this keeps the cycle closed (last→first, first→last)
         rather than escaping to the browser chrome at the ends. */
      if (event.key !== "Tab") return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        sheet.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === sheet)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `close` reads `reduced`; re-bind when it changes so the branch is current.
  }, [reduced]);

  return (
    <div
      ref={sheetRef}
      className={styles.sheet}
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onTransitionEnd={onTransitionEnd}
    >
      <button
        type="button"
        className={styles.close}
        aria-label={siteContent.work.detailCloseLabel}
        onClick={close}
      >
        {siteContent.work.detailCloseLabel}
      </button>
      <div className={styles.scroller} data-lenis-prevent>
        {children}
      </div>
    </div>
  );
}
