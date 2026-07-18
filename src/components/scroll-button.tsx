"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/components/smooth-scroll";
import { navigateTo } from "@/lib/scroll-nav";
import { siteContent } from "@/lib/site-content";
import { CircleArrowDownIcon, CircleArrowUpIcon } from "@/components/icons";
import styles from "@/components/scroll-button.module.css";

/** Within this many px of the very bottom counts as "at the bottom". */
const BOTTOM_EPSILON = 8;
/** How far one "Scroll" nudge advances — just under a viewport, so context carries. */
const NUDGE = 0.9;

/**
 * The floating scroll aid (replaces the hero's static "scroll" cue). A breathing
 * pill fixed bottom-left: a down arrow + "Scroll" that nudges the page down, and
 * flips to an up arrow + "Top" once the reader reaches the very bottom.
 *
 * Position is read from `window.scrollY`, which Lenis drives (it writes the real
 * window scroll each frame), so a plain scroll listener already sees every
 * Lenis-driven move; the Lenis subscription is belt-and-braces for frames the
 * window event coalesces. Scrolling itself goes through `navigateTo` so the
 * nudge glides on the same one Lenis instance as every other scroll on the site
 * (CLAUDE.md: no second RAF loop). Reduced motion drops the breathing (CSS).
 */
export function ScrollButton() {
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setAtBottom(window.scrollY >= max - BOTTOM_EPSILON);
    };
    compute();
    const lenis = getLenis();
    lenis?.on("scroll", compute);
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      lenis?.off("scroll", compute);
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  const onClick = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = atBottom ? 0 : Math.min(window.scrollY + window.innerHeight * NUDGE, max);
    if (!navigateTo(target)) window.scrollTo({ top: target, behavior: "smooth" });
  };

  const label = atBottom ? siteContent.labels.top : siteContent.labels.scroll;

  return (
    <button
      type="button"
      className={styles.button}
      data-at-bottom={atBottom ? "true" : "false"}
      onClick={onClick}
    >
      {atBottom ? (
        <CircleArrowUpIcon className={styles.icon} />
      ) : (
        <CircleArrowDownIcon className={styles.icon} />
      )}
      {/* Visible text IS the accessible name — no aria-label needed; the icon is
          decorative (aria-hidden in the icon component). */}
      <span className={styles.label}>{label}</span>
    </button>
  );
}
