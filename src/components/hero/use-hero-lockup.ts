"use client";

import { useEffect, type RefObject } from "react";
import { computeLockup } from "@/lib/lockup-math";
import { wordmarkConfig } from "@/lib/wordmark-config";

interface LockupRefs {
  innerRef: RefObject<HTMLDivElement | null>;
  wordmarkRef: RefObject<HTMLDivElement | null>;
  kickerRef: RefObject<HTMLElement | null>;
  taglineRef: RefObject<HTMLElement | null>;
  /** Measure only once the font is ready/settled — fallback metrics lie. */
  active: boolean;
}

/** Measures the rendered hero and applies the lockup; re-runs on resize. */
export function useHeroLockup({ innerRef, wordmarkRef, kickerRef, taglineRef, active }: LockupRefs): void {
  useEffect(() => {
    if (!active) return;
    const inner = innerRef.current;
    const wordmark = wordmarkRef.current;
    const kicker = kickerRef.current;
    const tagline = taglineRef.current;
    if (!inner || !wordmark || !kicker || !tagline) return;

    const apply = () => {
      /* reset to base sizes so measurements are idempotent */
      wordmark.style.fontSize = `${wordmarkConfig.sizeVw}vw`;
      kicker.style.fontSize = "";
      tagline.style.fontSize = "100px";
      tagline.style.width = "auto";

      const letters = wordmark.querySelectorAll<HTMLElement>("[data-letter]");
      if (letters.length < 4) return;
      const first = letters[0].getBoundingClientRect();
      const fourth = letters[3].getBoundingClientRect();
      const last = letters[letters.length - 1].getBoundingClientRect();

      const result = computeLockup({
        availPx: inner.clientWidth,
        wordmarkPx: last.right - first.left,
        wordmarkFontPx: parseFloat(getComputedStyle(wordmark).fontSize),
        jonoPx: fourth.right - first.left,
        kickerPx: kicker.getBoundingClientRect().width,
        kickerFontPx: parseFloat(getComputedStyle(kicker).fontSize),
        taglinePxAt100: tagline.scrollWidth,
      });

      wordmark.style.fontSize = `${result.wordmarkFontPx.toFixed(2)}px`;
      kicker.style.fontSize = `${result.kickerFontPx.toFixed(2)}px`;
      tagline.style.fontSize = `${result.taglineFontPx.toFixed(2)}px`;
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
  }, [active, innerRef, wordmarkRef, kickerRef, taglineRef]);
}
