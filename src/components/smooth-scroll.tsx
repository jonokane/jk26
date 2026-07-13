"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import type Lenis from "lenis";
import { useEffect, useRef } from "react";
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
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
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
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.1, smoothWheel: true }}
    >
      {children}
    </ReactLenis>
  );
}
