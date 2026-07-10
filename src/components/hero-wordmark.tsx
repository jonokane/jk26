"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { heroConfig, WORDMARK_TEXT } from "@/lib/hero-config";
import {
  createWordmarkEngine,
  type WordmarkEngine,
} from "@/lib/wordmark-engine";
import { WordmarkTunePanel } from "@/components/wordmark-tune-panel";

const entranceEase = [0.22, 1, 0.36, 1] as const;
const FONT_LOAD_SPEC = '400 1rem "totalblack-variable"';
const FONT_TIMEOUT_MS = 3000;

type FontState = "loading" | "ready" | "fallback";

// Letters with their index into reducedMotion.weights (spaces excluded).
const GLYPHS = (() => {
  let li = 0;
  return WORDMARK_TEXT.split("").map((ch) =>
    ch === " "
      ? { ch, letterIndex: null }
      : { ch, letterIndex: li++ },
  );
})();

/**
 * The hero wordmark: each letter of TotalBlack Variable drifts through the
 * weight axis (ambient loop) and thins under the cursor (carve). The engine
 * runs on the shared GSAP ticker; this component owns gating and lifecycle.
 * See docs/superpowers/specs/2026-07-10-variable-font-hero-design.md.
 */
export function HeroWordmark({ className }: { className?: string }) {
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const engineRef = useRef<WordmarkEngine | null>(null);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [entranceDone, setEntranceDone] = useState(false);
  // Hydration guard: the server cannot know the visitor's reduced-motion
  // preference, so the first client render must match the server's 400s;
  // the frozen weights apply right after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const reducedMotion = useReducedMotion() ?? false;

  // The wordmark must never appear in a fallback font mid-animation: stay
  // invisible until the webfont is confirmed, and give up after ~3s.
  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise<"fallback">((resolve) =>
      setTimeout(() => resolve("fallback"), FONT_TIMEOUT_MS),
    );
    const load = document.fonts
      .load(FONT_LOAD_SPEC)
      .then((faces): FontState => (faces.length > 0 ? "ready" : "fallback"))
      .catch((): FontState => "fallback");
    Promise.race([load, timeout]).then((state) => {
      if (!cancelled) setFontState(state === "ready" ? "ready" : "fallback");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Engine lifecycle: font in, entrance done, and the visitor is OK with motion.
  useEffect(() => {
    if (fontState !== "ready" || !entranceDone || reducedMotion) return;
    const h1 = h1Ref.current;
    if (!h1) return;

    const letters = Array.from(h1.querySelectorAll<HTMLElement>("[data-letter]"));
    const engine = createWordmarkEngine(letters, heroConfig);
    engineRef.current = engine;

    // Pause while the hero is off-screen so it never competes with scroll
    // choreography further down the page.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) engine.start();
      else engine.stop();
    });
    io.observe(h1);

    // Cursor layer only where a cursor exists; ambient-only on touch.
    const canHover = window.matchMedia("(hover: hover)").matches;
    const onMove = (e: PointerEvent) => engine.setPointer(e.clientX, e.clientY);
    const onLeave = () => engine.clearPointer();
    if (canHover) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      io.disconnect();
      if (canHover) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      engine.stop();
      engineRef.current = null;
    };
  }, [fontState, entranceDone, reducedMotion]);

  const visible = fontState !== "loading";

  return (
    <>
      <motion.h1
        ref={h1Ref}
        aria-label={WORDMARK_TEXT}
        className={`font-wordmark ${className ?? ""}`}
        initial={{ opacity: 0, y: 24 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.8, ease: entranceEase, delay: 0.08 }
        }
        onAnimationComplete={() => {
          if (visible) setEntranceDone(true);
        }}
      >
        {GLYPHS.map(({ ch, letterIndex }, i) =>
          letterIndex === null ? (
            <span key={i} aria-hidden="true" className="inline-block w-[0.32em]" />
          ) : (
            <span
              key={i}
              data-letter
              aria-hidden="true"
              style={
                fontState === "fallback"
                  ? undefined
                  : {
                      fontVariationSettings: `'wght' ${
                        mounted && reducedMotion
                          ? (heroConfig.reducedMotion.weights[letterIndex] ?? 400)
                          : 400
                      }`,
                    }
              }
            >
              {ch}
            </span>
          ),
        )}
      </motion.h1>
      {process.env.NODE_ENV === "development" && (
        <WordmarkTunePanel
          initial={heroConfig}
          onChange={(patch) => engineRef.current?.updateConfig(patch)}
        />
      )}
    </>
  );
}
