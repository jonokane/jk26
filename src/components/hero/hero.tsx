"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 * Pin the fixed live layer over the in-flow copy — its progress-0 position.
 * Used by the build-in (before the morph exists) and by the reveal effect
 * (when the morph isn't running, e.g. font fallback), so the live wordmark is
 * never left at its default fixed(0,0) in the viewport's top-left corner.
 */
function pinLiveToFlow(live: HTMLElement | null, flow: HTMLElement | null): void {
  if (!live || !flow) return;
  const f = flow.getBoundingClientRect();
  gsap.set(live, { x: f.left, y: f.top, scale: 1 });
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
  const morphProgressRef = useRef(0);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [settled, setSettled] = useState(false);
  const reducedMotion = useReducedMotionPref();

  /* Under reduced motion the live layer isn't rendered — the flow copy is
     the visible, build-in/carve target instead. */
  const lettersHost = reducedMotion ? wordmarkRef : liveWordmarkRef;
  const morphActive = settled && fontState === "ready" && !reducedMotion;

  /* ORDER IS LOAD-BEARING: useHeroLockup must stay declared *before*
     useWordmarkMorph. Effects fire in declaration order, so the lockup writes
     the final wordmark font-size before the morph measures the flow rect it
     FLIPs from. Swap these two and the morph silently starts from the
     pre-lockup (7vw) rect — a wrong start position with no error anywhere. */
  useHeroLockup({
    innerRef,
    wordmarkRef,
    kickerRef,
    taglineRef,
    mirrorRef: liveWordmarkRef,
    mirrorMounted: !reducedMotion,
    active: settled,
  });

  /* stable identity: an inline closure here would re-key the morph effect on
     every render and rebuild the ScrollTrigger mid-scroll */
  const onMorphProgress = useCallback((p: number) => {
    morphProgressRef.current = p;
    carveRef.current?.setEnabled(p === 0);
  }, []);

  useWordmarkMorph({
    liveRef: liveWordmarkRef,
    flowRef: wordmarkRef,
    active: morphActive,
    onProgress: onMorphProgress,
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
     font fallback) there's no flight — the letters are left to the reveal
     effect below, which fades them in (spec §12). */
  useEffect(() => {
    if (fontState === "loading" || settled) return;
    const letters = lettersHost.current?.querySelectorAll<HTMLElement>("[data-letter]");
    if (!letters || letters.length === 0) return;

    if (reducedMotion || fontState === "fallback") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion/fallback have no build-in animation to wait on; settling now hands the reveal + lockup their cue in the same commit
      setSettled(true);
      return;
    }

    /* Pin the live copy over the flow copy before revealing it: the morph
       hook doesn't take over positioning until `settled`, so without this
       the live wordmark would build in at its default fixed(0,0) — the
       viewport's top-left corner — then jump into place once settled. */
    pinLiveToFlow(liveWordmarkRef.current, wordmarkRef.current);

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

  /* Reveal (the lifecycle guard the build-in can't be): the build-in is a
     one-shot keyed to the font resolving, but `lettersHost` SWAPS whenever
     reduced motion is toggled live — the live layer unmounts, the flow copy
     takes over, and vice versa. The incoming host's letters ship at
     `opacity: 0` (hero.module.css) and nothing else ever raises them, so
     before this effect existed either toggle direction erased the wordmark
     permanently. This asserts the visible resting state of whichever host is
     current — and doubles as the reduced-motion "simple fade" (spec §12). */
  useEffect(() => {
    if (!settled || fontState === "loading") return;
    const host = lettersHost.current;
    const letters = host?.querySelectorAll<HTMLElement>("[data-letter]");
    if (!letters || letters.length === 0) return;

    /* Only pin when the morph isn't running: when it is, it owns the live
       layer's transform and has already applied the current scroll progress —
       re-pinning here would yank a docked wordmark back to the hero. */
    if (!morphActive && host === liveWordmarkRef.current) {
      pinLiveToFlow(host, wordmarkRef.current);
    }

    const { fadeMs, fadeEase } = wordmarkConfig.build;
    const tw = gsap.to(letters, {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: fadeMs / 1000,
      ease: fadeEase,
    });
    return () => {
      tw.kill();
    };
  }, [settled, fontState, lettersHost, reducedMotion, morphActive]);

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
    /* Seed it: the morph already ran apply(0) → onProgress() before this ref
       existed, so that first sync was swallowed by the `?.`. Without the seed,
       an engine created while the page is already scrolled (settled flipping
       late) starts `enabled` with the wordmark docked in the header. */
    engine.setEnabled(morphProgressRef.current === 0);
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
