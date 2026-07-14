"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/components/smooth-scroll";
import { isNavigating } from "@/lib/scroll-nav";
import {
  PHONE_QUERY,
  collectorSnap,
  collectorTiming,
  layoutFor,
  type CollectorLayout,
} from "@/components/about/collector-config";
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
  type Point,
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
 * stage, and pocket into a tray — scrubbed continuously against the scroll
 * (spec §14), on the shared GSAP ticker that Lenis already drives. No RAF loop
 * of its own, no wheel handling, and no `ScrollTrigger.pin` (which re-parents
 * the section into a spacer; sticky CSS does the same job without touching the
 * tree React owns).
 *
 * Then they come to rest, and *how* depends on the screen:
 *
 * - **Desktop** — the tray unpacks into the 2×2 wall inside the sticky stage.
 * - **Phone** — the section un-pins and the beats fly home into the document,
 *   which is read by scrolling. This works because the phone beats never leave
 *   the document in the first place: a transform does not reflow, so the
 *   choreography can lift a beat into the viewport while its place in the page
 *   stays reserved underneath. Coming to rest is then a transform of zero, and
 *   the page simply carries on.
 *
 * The breakpoint is not a teardown. It is a value `measure()` reads (from the
 * same media query the stylesheet switches on) and everything else — the
 * trigger's end, the poses, the CSS — is a function of it. A resize across it
 * refreshes; it does not rebuild.
 *
 * The whole choreography is opt-IN: `data-collector`, which switches the
 * section out of being a plain document, is set *here*, by the same effect that
 * positions the beats, and removed the moment it tears down. So the layout and
 * the transforms can never get out of step: if this effect does not run, or
 * stops running, what is left on screen is the static document the server
 * rendered — every beat visible, nothing to erase.
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

    /* Everything viewport-derived, re-read on every refresh (resize, rotate,
       font load) rather than captured once at mount. */
    let vp: Viewport = { width: 0, height: 0 };
    let layout: CollectorLayout = layoutFor(false);
    /** Where each beat's place in the document is, in document px. Phone only. */
    let homes: Point[] = [];
    /** The phone's runway: the scroll the choreography plays over. */
    let runway = 0;
    /** The section's own top, in document px — the stage's origin. */
    let sectionTop = 0;

    const measure = () => {
      vp = { width: window.innerWidth, height: window.innerHeight };
      layout = layoutFor(window.matchMedia(PHONE_QUERY).matches);
      sectionTop = section.getBoundingClientRect().top + window.scrollY;

      if (layout.finish.kind !== "flow") {
        homes = [];
        runway = 0;
        return;
      }

      /* The phone's beats are still in the document; find out where. A rect
         includes the transform we have been writing, so take it off first —
         nothing paints between here and the apply() at the end of the refresh. */
      gsap.set(beats, { clearProps: "transform" });
      homes = beats.map((beat) => {
        const r = beat.getBoundingClientRect();
        return { x: r.left + window.scrollX, y: r.top + window.scrollY };
      });
      /* The runway is the section's top padding — CSS owns the number, and this
         reads whatever it decided (see about.module.css). */
      runway = parseFloat(getComputedStyle(section).paddingTop) || 0;
    };

    let assembled: boolean | null = null;
    const apply = (progress: number) => {
      const releasing = layout.finish.kind === "flow";
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      /* Where the top of the stage is on screen. Zero once the collector is
         running — the section's top is at the top of the viewport, by
         definition of p. It is only ever positive on the approach, while the
         section is still sliding up into view, and that is the point: the
         phone's beats are placed against the stage, so the first beat rides in
         with the section instead of appearing out of nowhere at p=0. (The
         desktop's beats live inside the sticky stage, which does this for them.) */
      const origin = releasing ? Math.max(0, sectionTop - scrollY) : 0;

      for (let i = 0; i < count; i++) {
        /* Where this beat's place in the document is *right now*, on screen.
           The document scrolls under the choreography, so this moves every frame. */
        const spot = homes[i];
        const home =
          releasing && spot ? { x: spot.x - scrollX, y: spot.y - scrollY } : undefined;

        const pose = beatPose(i, count, progress, layout, collectorTiming, vp, home);

        /* A desktop beat is absolutely positioned at the stage's origin, so its
           pose is its transform. A phone beat is where the document put it, so
           its transform is the offset from there. */
        beatSetters[i]({
          x: home ? pose.x - home.x : pose.x,
          y: home ? origin + pose.y - home.y : pose.y,
          scale: pose.scale,
          opacity: pose.opacity,
        });

        const z = String(pose.z);
        if (beats[i].style.zIndex !== z) beats[i].style.zIndex = z;
      }

      /* On a phone the heading, lede and CTAs are ordinary content below the
         runway — they arrive by being scrolled to. Nothing to reveal. */
      const reveal = releasing ? 1 : revealOpacity(progress, count, collectorTiming);
      setIntro({ opacity: reveal });
      setFooter({ opacity: reveal });
      setHint({ opacity: trayHintOpacity(progress, count, collectorTiming) });

      /* Discrete, and only written when it changes: the desktop CSS uses it to
         take the still-invisible CTAs out of the tab order until the wall lands. */
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

        /* Never snap a scroll that is not ours to snap. A snap must only ever
           act on a reader who has come to REST INSIDE the collector.

           Clicking "Contact" in the nav flies Lenis straight through here: the
           timer armed on the way past, then fired mid-navigation and yanked the
           reader back to a beat. Measured before this guard: the nav ended at
           the collector's end with Contact still 25,701px below. A snap cannot
           tell a fly-past from a reader by watching scroll alone, so navigation
           declares itself (scroll-nav.ts) and we stand aside. */
        if (isNavigating()) return; // someone is on their way elsewhere
        if (!trigger.isActive) return; // the reader has left; not our scroll any more

        const target = snapProgress(trigger.progress, direction, targets, release, tolerance);
        const y = trigger.start + target * (trigger.end - trigger.start);
        if (Math.abs(y - window.scrollY) < 2) return; // already there
        lenis.scrollTo(y, { duration: collectorSnap.durationSec, easing: smoothstep });
      }, collectorSnap.settleMs);
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      /* Desktop: the sticky stage travels the whole section. Phone: the
         choreography owns the runway, and the document below it is just a page.
         Re-evaluated on every refresh, so crossing the breakpoint re-ends the
         same trigger instead of rebuilding it. */
      end: () => (layout.finish.kind === "flow" ? `+=${runway}` : "bottom bottom"),
      scrub: true,
      onUpdate: (self) => {
        direction = self.direction;
        apply(self.progress);
        snapWhenSettled();
      },
      onRefreshInit: measure,
      onRefresh: (self) => apply(self.progress),
      /* Pin the end states: a scroll fast enough to skip past the boundary must
         still leave the beats where that boundary puts them. */
      onLeave: () => apply(1),
      onLeaveBack: () => apply(0),
    });

    /* The approach — from the section's first appearance to the moment the
       choreography starts.

       Outside its range, a ScrollTrigger stops calling you. That is fine for a
       beat pinned inside a stage, and wrong for a phone beat, whose transform
       is measured against a document that is still scrolling underneath it: a
       frozen transform is a beat drifting up the page. At load (scroll 0, the
       section four screens down) it put the first beat squarely over the hero.

       Here `p` is 0 the whole way, and the stage's origin does the moving.

       Guarded on the collector's own progress, because ScrollTrigger fires one
       last update as you leave a range: a scroll that jumps clean over the
       approach (an anchor, a restored position) would otherwise land inside the
       collector and then have this stamp p=0 over the top of it — the first
       beat back at center stage, the rest parked, whatever the reader had
       actually scrolled to. It speaks only while the collector has nothing to
       say. */
    const approach = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "top top",
      onUpdate: () => {
        if (trigger.progress === 0) apply(0);
      },
    });

    apply(trigger.progress);
    /* The section just grew by several viewports: every other trigger on the
       page (and any the reader is inside of) is now measuring against a stale
       document height. */
    ScrollTrigger.refresh();

    return () => {
      window.clearTimeout(settle);
      approach.kill();
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
