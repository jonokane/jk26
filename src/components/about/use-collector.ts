"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/components/smooth-scroll";
import { collectorSnap, collectorTiming, layoutFor } from "@/components/about/collector-config";
import {
  assembleEnd,
  beatPose,
  isAssembled,
  revealOpacity,
  segment,
  smoothstep,
  snapProgress,
  snapTargets,
  trayHintOpacity,
  type Viewport,
} from "@/components/about/collector-math";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The pose math is pure; this is the part that can actually break. It runs
 * before paint (the collector's layout and the transforms that place things
 * inside it must land in the same frame, or the beats flash stacked in the
 * corner), so it is a layout effect — but About is server-rendered, and
 * useLayoutEffect warns there.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** gsap.quickSetter(el, "css") — one setter per element, no per-frame allocation. */
type CssSetter = (values: Record<string, number | string>) => void;
const cssSetter = (el: Element): CssSetter => gsap.quickSetter(el, "css") as CssSetter;

interface CollectorOptions {
  sectionRef: RefObject<HTMLElement | null>;
  stageRef: RefObject<HTMLDivElement | null>;
  introRef: RefObject<HTMLDivElement | null>;
  footerRef: RefObject<HTMLDivElement | null>;
  hintRef: RefObject<HTMLParagraphElement | null>;
  /** false → the static document stands as-is (reduced motion, spec §12). */
  active: boolean;
}

/**
 * Drives the collector (spec §7): the four intro beats rise, hold center
 * stage, pocket into a tray, and unpack into the About wall — scrubbed
 * continuously against the scroll (spec §14), on the shared GSAP ticker that
 * Lenis already drives. No RAF loop of its own, no wheel handling.
 *
 * The whole choreography is opt-IN: `data-collector` (which switches the
 * section from a plain document into a 616vh sticky stage) is set *here*, by
 * the same effect that positions the beats, and removed the moment it tears
 * down. So the layout and the transforms can never get out of step: if this
 * effect does not run, or stops running, what is left on screen is the static
 * wall the server rendered — every beat visible, nothing to erase.
 */
export function useCollector({
  sectionRef,
  stageRef,
  introRef,
  footerRef,
  hintRef,
  active,
}: CollectorOptions): void {
  useBeforePaint(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const intro = introRef.current;
    const footer = footerRef.current;
    const hint = hintRef.current;
    if (!active || !section || !stage || !intro || !footer || !hint) return;

    /* `active` comes from a hook that must return "motion is fine" on the first
       client render to match the server, so it lies for exactly one render.
       Re-read the query here, where the truth is available, or a reduced-motion
       visitor gets a frame of collector before the hook corrects itself. */
    if (window.matchMedia(REDUCED_MOTION).matches) return;

    const beats = Array.from(stage.querySelectorAll<HTMLElement>("[data-beat]"));
    if (!beats.length) return;
    const count = beats.length;

    section.setAttribute("data-collector", "");

    const beatSetters = beats.map(cssSetter);
    const setIntro = cssSetter(intro);
    const setFooter = cssSetter(footer);
    const setHint = cssSetter(hint);

    /* Viewport-derived, so it is re-read on every refresh (resize, font load,
       orientation) rather than captured once at mount. */
    let vp: Viewport = { width: 0, height: 0 };
    let layout = layoutFor(0);
    const measure = () => {
      vp = { width: window.innerWidth, height: window.innerHeight };
      layout = layoutFor(vp.width);
    };

    let assembled: boolean | null = null;
    const apply = (progress: number) => {
      for (let i = 0; i < count; i++) {
        const pose = beatPose(i, count, progress, layout, collectorTiming, vp);
        beatSetters[i]({
          x: pose.x,
          y: pose.y,
          scale: pose.scale,
          opacity: pose.opacity,
        });
        const z = String(pose.z);
        if (beats[i].style.zIndex !== z) beats[i].style.zIndex = z;
      }

      const reveal = revealOpacity(progress, count, collectorTiming);
      setIntro({ opacity: reveal });
      setFooter({ opacity: reveal });
      setHint({ opacity: trayHintOpacity(progress, count, collectorTiming) });

      /* Discrete, and only written when it changes: CSS uses it to take the
         still-invisible CTAs out of the tab order until the wall lands. */
      const now = isAssembled(progress, count);
      if (now !== assembled) {
        assembled = now;
        section.toggleAttribute("data-assembled", now);
      }
    };

    measure();

    const targets = snapTargets(count, collectorTiming);
    const release = assembleEnd(count, collectorTiming);
    const tolerance = collectorSnap.tolerance * segment(count);

    /* Snapping goes THROUGH Lenis, not around it.

       ScrollTrigger's own `snap` writes the scroll position directly, and Lenis
       — which owns scroll here, and re-asserts its own animated value on the
       shared ticker — simply overwrites it on the next frame. Measured: beats
       settled at p = 0.168, 0.44, 0.567 (nowhere at all) about half the time,
       and on a target the other half. A race, not a snap.

       So: wait for the scroll to go quiet, then ask Lenis to take us to the
       resting place. One authority over the scroll position, no fight. */
    let settle: number | undefined;
    let direction = 1;
    const snapWhenSettled = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const lenis = getLenis();
        if (!lenis) return; // no smooth scroll → no snap; the scrub still works
        const target = snapProgress(trigger.progress, direction, targets, release, tolerance);
        const y = trigger.start + target * (trigger.end - trigger.start);
        if (Math.abs(y - window.scrollY) < 2) return; // already there
        lenis.scrollTo(y, { duration: collectorSnap.durationSec, easing: smoothstep });
      }, collectorSnap.settleMs);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        direction = self.direction;
        apply(self.progress);
        snapWhenSettled();
      },
      onRefreshInit: measure,
      onRefresh: (self) => apply(self.progress),
    });

    apply(trigger.progress);
    /* The section just grew from ~2 viewports to ~6: every other trigger on the
       page (and any the reader is inside of) is now measuring against a stale
       document height. */
    ScrollTrigger.refresh();

    return () => {
      window.clearTimeout(settle);
      trigger.kill();
      gsap.set(beats, { clearProps: "all" });
      gsap.set([intro, footer, hint], { clearProps: "all" });
      for (const beat of beats) beat.style.removeProperty("z-index");
      section.removeAttribute("data-assembled");
      section.removeAttribute("data-collector");
      ScrollTrigger.refresh();
    };
  }, [active, sectionRef, stageRef, introRef, footerRef, hintRef]);
}
