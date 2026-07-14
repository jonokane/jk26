"use client";

import { useEffect, type RefObject } from "react";
import { computeLockup } from "@/lib/lockup-math";
import { wordmarkConfig } from "@/lib/wordmark-config";

interface LockupRefs {
  innerRef: RefObject<HTMLDivElement | null>;
  wordmarkRef: RefObject<HTMLDivElement | null>;
  kickerRef: RefObject<HTMLElement | null>;
  taglineRef: RefObject<HTMLElement | null>;
  /** Fixed live wordmark layer (Task 6) — mirrors the flow copy's font-size. */
  mirrorRef?: RefObject<HTMLDivElement | null>;
  /**
   * Whether the mirror layer is currently mounted. Refs don't re-run effects,
   * so without this a live reduced-motion toggle (which mounts a *fresh* live
   * layer) would leave that layer at its 7vw base size while the flow copy
   * stays locked — two wordmarks of different sizes.
   */
  mirrorMounted?: boolean;
  /** Measure only once the font is ready/settled — fallback metrics lie. */
  active: boolean;
}

/** Measures the rendered hero and applies the lockup; re-runs on resize. */
export function useHeroLockup({
  innerRef,
  wordmarkRef,
  kickerRef,
  taglineRef,
  mirrorRef,
  mirrorMounted,
  active,
}: LockupRefs): void {
  useEffect(() => {
    if (!active) return;
    const inner = innerRef.current;
    const wordmark = wordmarkRef.current;
    const kicker = kickerRef.current;
    const tagline = taglineRef.current;
    if (!inner || !wordmark || !kicker || !tagline) return;

    const apply = () => {
      /* Reset to base sizes so measurements are idempotent, and put the hero in
         its measuring state (hero.module.css) — the ratios below need the kicker
         and tagline's true UNWRAPPED widths, and by default both wrap. It's all
         one synchronous turn: the browser never paints the measuring state. */
      inner.dataset.lockup = "measuring";
      wordmark.style.fontSize = `${wordmarkConfig.sizeVw}vw`;
      kicker.style.fontSize = "";
      tagline.style.fontSize = "100px";

      const letters = wordmark.querySelectorAll<HTMLElement>("[data-letter]");
      if (letters.length < 4) {
        /* never leave the measuring state painted — fall back to wrapping text */
        inner.removeAttribute("data-lockup");
        return;
      }
      const first = letters[0].getBoundingClientRect();
      const fourth = letters[3].getBoundingClientRect();
      const last = letters[letters.length - 1].getBoundingClientRect();

      const innerStyle = getComputedStyle(inner);
      const availPx =
        inner.clientWidth -
        parseFloat(innerStyle.paddingLeft) -
        parseFloat(innerStyle.paddingRight);

      const result = computeLockup({
        availPx,
        wordmarkPx: last.right - first.left,
        wordmarkFontPx: parseFloat(getComputedStyle(wordmark).fontSize),
        jonoPx: fourth.right - first.left,
        kickerPx: kicker.getBoundingClientRect().width,
        kickerFontPx: parseFloat(getComputedStyle(kicker).fontSize),
        taglinePxAt100: tagline.getBoundingClientRect().width,
        viewportPx: window.innerWidth,
      });

      wordmark.style.fontSize = `${result.wordmarkFontPx.toFixed(2)}px`;
      if (mirrorRef?.current) mirrorRef.current.style.fontSize = wordmark.style.fontSize;
      kicker.style.fontSize = `${result.kickerFontPx.toFixed(2)}px`;
      tagline.style.fontSize = `${result.taglineFontPx.toFixed(2)}px`;
      /* whether the lines may be locked to one line is a design decision — it
         is expressed in CSS off this attribute, never as inline style (spec §15) */
      inner.dataset.lockup = result.narrow ? "narrow" : "one-line";
    };

    apply();
    let raf = 0;
    const onResize = () => {
      /* coalesce resize storms into the shared gsap ticker's next frame is
         unnecessary here — a rAF-once debounce keeps this passive listener
         cheap without adding a persistent loop */
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active, mirrorMounted, innerRef, wordmarkRef, kickerRef, taglineRef, mirrorRef]);
}
