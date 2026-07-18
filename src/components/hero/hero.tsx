"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
  /* The wordmark's laid-out width, so the tagline can lock to it (see the effect
     below). null until measured — the tagline falls back to its own max-width. */
  const [wordmarkWidth, setWordmarkWidth] = useState<number | null>(null);

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

  /* The morph is the only writer of header-on on `/`, and it's gated on
     `runDone` — a fixed ~1.5s timeout, the build-in's length. A load that
     starts already scrolled past the header threshold (a deep link that
     lands below the fold, scroll restoration) gets no nav at all for that
     whole window: the morph hasn't armed yet to write the class, so the
     pill — and the theme toggle inside it — stays invisible even though the
     scroll position already warrants it. A previous phase carried a guard
     for exactly this; a later task deleted it along with the function that
     held it. Re-added here, un-gated by `runDone`, as a layout effect so it
     lands before the first paint. The morph's own apply() takes over
     normally once it arms; this only covers the gap before that. Reduced
     motion is unaffected — site-header.tsx already writes header-on
     directly there, with no morph to hand off to. */
  useLayoutEffect(() => {
    if (reduced) return;
    if (window.scrollY > window.innerHeight * 0.85) {
      document.documentElement.classList.add("header-on");
    }
  }, [reduced]);

  const flowRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  /* Lock the tagline's width to the wordmark's, so the two read as one block and
     the tagline never spills past the name (Jono's ask). `offsetWidth` is the
     wordmark's LAID-OUT width — unaffected by the build-in's transforms, which
     are visual only — so this is stable to measure whatever the animation state.
     Re-measures on viewport resize and once the fonts load (both change the
     wordmark's real width). The wordmark shrink-wraps its glyphs (align-self in
     CSS), so this is the name's width, not the stretched column's. */
  useEffect(() => {
    const el = flowRef.current;
    if (!el) return;
    const measure = () => setWordmarkWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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
      /* Published as a CSS var so the tagline's max-width reads it; live state,
         so it stays inline (the type role stays in CSS). */
      style={
        wordmarkWidth ? ({ "--wordmark-w": `${wordmarkWidth}px` } as CSSProperties) : undefined
      }
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
    </section>
  );
}
