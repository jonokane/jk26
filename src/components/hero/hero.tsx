"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { loadAreaFont } from "@/lib/area-font";
import { WORDMARK_TEXT, wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";
import { createCarveEngine, type CarveEngine } from "@/lib/carve-engine";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useHeroLockup } from "@/components/hero/use-hero-lockup";
import { useWordmarkMorph } from "@/components/hero/use-wordmark-morph";
import styles from "@/components/hero/hero.module.css";

type FontState = "loading" | "ready" | "fallback";

/** Letter spans (hand-tuned pair kerns) — shared markup for the flow and live wordmark copies. */
function WordmarkLetters() {
  const kerns = wordmarkConfig.pairKernsMem;
  return (
    <>
      {[...WORDMARK_TEXT].map((ch, i) => (
        <span
          key={i}
          data-letter
          style={i > 0 && kerns[i - 1] ? { marginLeft: `${kerns[i - 1] / 1000}em` } : undefined}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

/**
 * The JONOKANE hero (spec §5): render-gated on the area-full FontFace,
 * per-letter build-in (once, then still), hand-tuned pair kerning.
 * Lockup (Task 4) and carve (Task 5) target the fixed LIVE wordmark layer;
 * the in-flow copy stays as the layout + measurement source (Task 6). Under
 * reduced motion the morph never runs, so the flow copy is what's shown and
 * targeted instead — no live layer is rendered at all.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const liveWordmarkRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLSpanElement>(null);
  const carveRef = useRef<CarveEngine | null>(null);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [settled, setSettled] = useState(false);
  const reducedMotion = useReducedMotionPref();

  /* Under reduced motion the live layer isn't rendered — the flow copy is
     the visible, build-in/carve target instead. */
  const lettersHost = reducedMotion ? wordmarkRef : liveWordmarkRef;

  useHeroLockup({
    innerRef,
    wordmarkRef,
    kickerRef,
    taglineRef,
    mirrorRef: liveWordmarkRef,
    active: settled,
  });

  useWordmarkMorph({
    liveRef: liveWordmarkRef,
    flowRef: wordmarkRef,
    active: settled && fontState === "ready" && !reducedMotion,
    onProgress: (p) => carveRef.current?.setEnabled(p === 0),
  });

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
    const letters = lettersHost.current?.querySelectorAll<HTMLElement>("[data-letter]");
    if (!letters || letters.length === 0) return;

    /* Pin the live copy over the flow copy before revealing it: the morph
       hook doesn't take over positioning until `settled`, so without this
       the live wordmark would build in at its default fixed(0,0) — the
       viewport's top-left corner — then jump into place once settled. */
    if (!reducedMotion) {
      const live = liveWordmarkRef.current;
      const flow = wordmarkRef.current;
      if (live && flow) {
        const f = flow.getBoundingClientRect();
        gsap.set(live, { x: f.left, y: f.top, scale: 1 });
      }
    }

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
      lettersHost.current?.querySelectorAll<HTMLElement>("[data-letter]") ?? [],
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
  }, [settled, fontState, reducedMotion, lettersHost]);

  /* Reduced-motion header fallback: no scrubbed morph, so the header fades
     in past a plain scroll threshold instead. */
  useEffect(() => {
    if (!reducedMotion) return;
    const onScroll = () => {
      document.documentElement.classList.toggle("header-on", window.scrollY > window.innerHeight * 0.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.classList.remove("header-on");
    };
  }, [reducedMotion]);

  const wordmarkStyle = {
    "--wordmark-family": wordmarkConfig.family,
    fontSize: `${wordmarkConfig.sizeVw}vw`,
    letterSpacing: `${wordmarkConfig.trackEm}em`,
    fontVariationSettings:
      fontState === "fallback" ? undefined : wordmarkFvs(wordmarkConfig.axes.wght),
  } as React.CSSProperties;

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
          data-wordmark-flow
          className={reducedMotion ? styles.wordmark : `${styles.wordmark} ${styles.wordmarkFlow}`}
          aria-hidden="true"
          style={wordmarkStyle}
        >
          <WordmarkLetters />
        </div>
        {!reducedMotion && (
          <div
            ref={liveWordmarkRef}
            className={styles.wordmark + " " + styles.wordmarkLive}
            aria-hidden="true"
            style={wordmarkStyle}
          >
            <WordmarkLetters />
          </div>
        )}
        <div>
          <span ref={taglineRef} className={styles.tagline}>
            {siteContent.tagline}
          </span>
        </div>
      </div>
    </section>
  );
}
