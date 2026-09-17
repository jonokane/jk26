"use client";

import { Children, useState, type KeyboardEvent, type ReactNode } from "react";
import { ZoomDisabled } from "@/components/mdx/zoom-context";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/slides.module.css";

/**
 * An inline click-to-advance slide gallery (spec: 2026-07-29 slides). Each child
 * — a markdown image rendered as a figure — is one slide; the gallery shows one
 * at a time and cross-dissolves between them via a CSS grid-stack (so the frame
 * sizes to the tallest slide and never jumps between same-size shots). Click the
 * image, use the ← → buttons, or press the arrow keys to step; it wraps at both
 * ends. Manual only — no auto-advance.
 *
 * Wrapped in <ZoomDisabled> so a click ADVANCES rather than opening the
 * lightbox. Reduced motion cuts instead of fading (CSS). A lone child (or none)
 * is just an image — no stepper chrome.
 */
export function Slides({ children }: { children: ReactNode }) {
  /* Images authored on consecutive lines (no blank lines between them) reach
     us as `img, "\n", img, …` — MDX keeps the line breaks as text. A bare
     newline is not a slide; without this filter each one was a blank frame
     and the counter read 13 for 7 images. */
  const slides = Children.toArray(children).filter(
    (child) => !(typeof child === "string" && child.trim() === ""),
  );
  const total = slides.length;
  const [active, setActive] = useState(0);
  const [seen, setSeen] = useState(false);
  const copy = siteContent.work.slides;

  if (total <= 1) return <>{children}</>;

  const go = (to: number) => {
    setActive(((to % total) + total) % total); // wrap both directions
    setSeen(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(active + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(active - 1);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role=group
    // with an arrow-key handler is a stepper affordance; the labelled prev/next
    // buttons below are the primary, focusable controls.
    <div
      className={styles.slides}
      data-slides
      data-seen={seen}
      role="group"
      aria-label={copy.label}
      onKeyDown={onKeyDown}
    >
      <ZoomDisabled>
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events --
            click-to-advance is a pointer enhancement; keyboard and AT users step
            via the labelled prev/next buttons and the group's arrow-key handler. */}
        <div className={styles.stack} data-slides-stack onClick={() => go(active + 1)}>
          {slides.map((slide, i) => (
            <div key={i} className={styles.slide} data-slide data-active={i === active} aria-hidden={i !== active}>
              {slide}
            </div>
          ))}
        </div>
      </ZoomDisabled>

      <div className={styles.controls}>
        <button type="button" className={styles.arrow} aria-label={copy.prev} onClick={() => go(active - 1)}>
          ‹
        </button>
        <span className={styles.counter}>
          {active + 1}
          {siteContent.work.counterSeparator}
          {total}
        </span>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          aria-label={copy.next}
          onClick={() => go(active + 1)}
        >
          ›
        </button>
      </div>

      {/* <div>, not <p>: a <p> here collides with the case study's
          `.body :where(p)` rule (equal specificity), which was overriding the
          size and forcing a left-aligned 62ch box — knocking the hint off-centre. */}
      <div className={styles.hint} data-seen={seen}>
        {copy.hint}
      </div>
      <div className={styles.srOnly} aria-live="polite">
        {copy.status(active + 1, total)}
      </div>
    </div>
  );
}
