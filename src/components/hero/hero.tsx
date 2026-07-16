"use client";

import { useEffect, useRef, useState } from "react";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { HERO_BUILD } from "@/components/hero/hero-config";
import { useWordmarkMorph } from "@/components/hero/use-wordmark-morph";
import styles from "@/components/hero/hero.module.css";

const LETTERS = siteContent.wordmark.split("");

/**
 * Welcome (spec §6). Letters resolve from oversized + blurred on a stagger;
 * the eyebrow leads; the tagline and scroll cue follow once the run completes.
 *
 * Two deliberate departures from the prototype, both fixing its bugs:
 *  - The whole build keys off ONE `data-built` attribute, so the from-state
 *    is scoped and the resolved state is the default. The prototype resets
 *    the fly copy, which is display:none under reduced motion, leaving the
 *    visible wordmark permanently scale(2.5) + blur(9px) (§6, bug 1).
 *  - The accessible name lives on the <h1> itself, never on a copy motion can
 *    hide (§6, bug 2).
 */
export function Hero() {
  const reduced = useReducedMotionPref();
  const [built, setBuilt] = useState(false);
  const [runDone, setRunDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion is client-only; resolve immediately with no animated path to defer to
      setBuilt(true);
      setRunDone(true);
      return;
    }
    /* Next frame, so the from-state paints once before the transition runs. */
    const raf = requestAnimationFrame(() => setBuilt(true));
    const t = setTimeout(() => setRunDone(true), HERO_BUILD.totalMs(LETTERS.length));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [reduced]);

  const flowRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const letters = LETTERS.map((letter, i) => (
    <span
      key={i}
      className={styles.letter}
      aria-hidden="true"
      style={{
        transitionDelay: reduced
          ? "0s"
          : `${(HERO_BUILD.letterLeadMs + i * HERO_BUILD.letterStaggerMs) / 1000}s`,
      }}
    >
      {letter}
    </span>
  ));

  useWordmarkMorph({ liveRef, flowRef, active: !reduced && runDone });

  return (
    <section
      className={styles.hero}
      id="welcome"
      data-built={built ? "true" : "false"}
      data-run-done={runDone ? "true" : "false"}
    >
      <p className={styles.kicker}>{siteContent.kicker}</p>
      {/* The anchor owns layout and the accessible name. opacity:0 — NOT
          visibility:hidden — so it stays in the accessibility tree; the
          prototype's anchor is aria-hidden and its fly carries the name,
          which loses the name entirely under reduced motion (§6, bug 2). */}
      <h1
        ref={flowRef}
        data-wordmark="anchor"
        className={styles.wordmark}
        aria-label={siteContent.wordmark}
      >
        {letters}
      </h1>

      {/* The fly is the copy you actually see once the morph arms, and it
          BECOMES the nav brand — it never fades out, so the living gradient
          rides along at nav scale (spec §7). Purely decorative: the anchor
          owns the name.

          It starts hidden and is revealed by the hook only AFTER its first
          apply() positions it. Without that, the fly renders at its CSS
          default (position:fixed; top:0; left:0, full size, untransformed)
          from mount until `active` flips at ~1540ms — a second wordmark
          pinned to the viewport's top-left corner throughout the build-in.
          The prototype hits the same trap and solves it the same way. */}
      {!reduced && (
        <div
          ref={liveRef}
          data-wordmark="fly"
          aria-hidden="true"
          className={`${styles.wordmark} ${styles.fly}`}
        >
          {letters}
        </div>
      )}
      <p className={styles.tagline}>{siteContent.tagline}</p>
      <p className={styles.scrollCue}>{siteContent.labels.scrollCue}</p>
    </section>
  );
}
