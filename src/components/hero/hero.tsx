"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { loadAreaFont } from "@/lib/area-font";
import { WORDMARK_TEXT, wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";
import { createCarveEngine, type CarveEngine } from "@/lib/carve-engine";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useHeroLockup } from "@/components/hero/use-hero-lockup";
import styles from "@/components/hero/hero.module.css";

type FontState = "loading" | "ready" | "fallback";

/**
 * The JONOKANE hero (spec §5): render-gated on the area-full FontFace,
 * per-letter build-in (once, then still), hand-tuned pair kerning.
 * Lockup (Task 4), carve (Task 5), and the header morph (Task 6) wire into
 * the refs this component owns.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLSpanElement>(null);
  const carveRef = useRef<CarveEngine | null>(null);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [settled, setSettled] = useState(false);
  const reducedMotion = useReducedMotionPref();

  useHeroLockup({ innerRef, wordmarkRef, kickerRef, taglineRef, active: settled });

  useEffect(() => {
    let cancelled = false;
    loadAreaFont().then((ok) => {
      if (!cancelled) setFontState(ok ? "ready" : "fallback");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Build-in: runs once when the font resolves. Under reduced motion (or
     font fallback) the letters simply appear — no flight. */
  useEffect(() => {
    if (fontState === "loading" || settled) return;
    const letters = wordmarkRef.current?.querySelectorAll<HTMLElement>("[data-letter]");
    if (!letters || letters.length === 0) return;

    if (reducedMotion || fontState === "fallback") {
      gsap.set(letters, { opacity: 1 });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion/fallback settle synchronously; letters must be visible immediately, no animated intermediate render
      setSettled(true);
      return;
    }

    const { durMs, staggerMs, fromScale, fromBlurPx, fromDropVh, ease } = wordmarkConfig.build;
    const tl = gsap.timeline({ onComplete: () => setSettled(true) });
    tl.fromTo(
      letters,
      {
        opacity: 0,
        scale: fromScale,
        y: () => (fromDropVh / 100) * window.innerHeight,
        filter: `blur(${fromBlurPx}px)`,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: durMs / 1000,
        ease,
        stagger: staggerMs / 1000,
      },
    );
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- build-in runs once per font resolution; reducedMotion is read at that moment
  }, [fontState]);

  /* Cursor weight-carve (spec §5): pointer-only, starts once the wordmark
     has settled and the font is ready. IntersectionObserver starts/stops
     the engine with hero visibility so it never ticks off-screen. */
  useEffect(() => {
    if (!settled || fontState !== "ready" || reducedMotion) return;
    if (!window.matchMedia("(hover: hover)").matches) return; // touch: inert
    const letterEls = Array.from(
      wordmarkRef.current?.querySelectorAll<HTMLElement>("[data-letter]") ?? [],
    );
    if (letterEls.length === 0) return;
    const engine = createCarveEngine(letterEls);
    carveRef.current = engine;

    const io = new IntersectionObserver(([entry]) =>
      entry.isIntersecting ? engine.start() : engine.stop(),
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    const onMove = (e: PointerEvent) => engine.setPointer(e.clientX, e.clientY);
    const onLeave = () => engine.clearPointer();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    const onResize = () => engine.refreshRects();
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
      engine.stop();
      carveRef.current = null;
    };
  }, [settled, fontState, reducedMotion]);

  const letters = [...WORDMARK_TEXT];
  const kerns = wordmarkConfig.pairKernsMem;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-settled={settled || undefined}
      aria-label="Introduction"
    >
      <div ref={innerRef} className={styles.inner}>
        <h1 className="sr-only">Jono Kane</h1>
        <div>
          <span ref={kickerRef} className={`${styles.kicker} text-kicker text-sm`}>
            {siteContent.kicker}
          </span>
        </div>
        <div
          ref={wordmarkRef}
          className={styles.wordmark}
          aria-hidden="true"
          style={
            {
              "--wordmark-family": wordmarkConfig.family,
              fontSize: `${wordmarkConfig.sizeVw}vw`,
              letterSpacing: `${wordmarkConfig.trackEm}em`,
              fontVariationSettings:
                fontState === "fallback" ? undefined : wordmarkFvs(wordmarkConfig.axes.wght),
            } as React.CSSProperties
          }
        >
          {letters.map((ch, i) => (
            <span
              key={i}
              data-letter
              style={i > 0 && kerns[i - 1] ? { marginLeft: `${kerns[i - 1] / 1000}em` } : undefined}
            >
              {ch}
            </span>
          ))}
        </div>
        <div>
          <span ref={taglineRef} className={styles.tagline}>
            {siteContent.tagline}
          </span>
        </div>
      </div>
    </section>
  );
}
