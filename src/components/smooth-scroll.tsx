"use client";

import { ReactLenis, useLenis } from "lenis/react";
import type Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let lenisInstance: Lenis | null = null;

/** The app's Lenis instance (null before mount / after unmount). */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Wraps the app in Lenis smooth scroll and drives it from GSAP's ticker so
 * that Lenis and ScrollTrigger share a single, synchronized RAF loop. This is
 * the canonical Lenis + GSAP integration — build all scroll choreography with
 * ScrollTrigger on top of this and it will feel buttery.
 *
 * Reads the instance via useLenis() (backed by ReactLenis's root store)
 * rather than the ref: ReactLenis constructs Lenis inside its own effect and
 * publishes it through a state update, so a ref read in a mount-only effect
 * can race ahead of it and find nothing — this hook re-fires once the
 * instance is actually ready.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(update);
      lenisInstance = null;
    };
  }, [lenis]);

  return (
    <ReactLenis root options={{ autoRaf: false, lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
