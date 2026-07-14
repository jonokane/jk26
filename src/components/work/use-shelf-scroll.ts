"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/components/smooth-scroll";
import {
  panelIndexFromProgress,
  scrollForPanel,
  shelfScrollDistance,
  snapIncrement,
  trackX,
} from "@/components/work/shelf-math";

interface ShelfScrollOptions {
  /** The stage that pins. Must be exactly one viewport tall. */
  stageRef: RefObject<HTMLDivElement | null>;
  /** The row of panels that slides. Transformed, never scrolled. */
  trackRef: RefObject<HTMLDivElement | null>;
  panelCount: number;
  /** Off under reduced motion and on touch — both of which unmount the pin entirely. */
  active: boolean;
  /** Fired on panel *change*, never per frame. */
  onPanelChange: (index: number) => void;
}

/**
 * The shelf's scroll choreography (spec §8): ScrollTrigger `pin` + `scrub` +
 * `snap`, translating the panel track horizontally as the page scrolls
 * vertically. Entering from above, the pin catches the stage at the top of the
 * viewport and `snap` lands it on a panel; past the last panel the pin releases
 * and the page carries on down to Contact.
 *
 * It drives nothing itself: Lenis already drives GSAP's ticker
 * (`smooth-scroll.tsx`), so this rides the one shared RAF loop. No second loop,
 * and emphatically no `wheel` handler — a `preventDefault`ed wheel would fight
 * Lenis and break smooth scrolling for the whole site.
 *
 * ## The part that actually breaks
 *
 * The arithmetic is in `shelf-math.ts`, pure and tested. What is left here is
 * lifecycle, which is where every shipped defect in this codebase has come
 * from, and `ScrollTrigger.pin` inside a re-rendering component is the sharpest
 * version of it: a trigger that tears down and rebuilds on every render leaves
 * a stale pin-spacer behind and measures the next one through it.
 *
 * So the effect below depends on nothing that changes per render. The callbacks
 * arrive through a ref that a *separate*, earlier effect keeps current, so
 * `onPanelChange` may be a fresh closure on every render — as it will be —
 * without the trigger ever noticing. The refs are refs. `panelCount` and
 * `active` are the only real inputs, and a change in either genuinely *should*
 * rebuild the trigger. Everything the effect creates is created inside a
 * `gsap.context`, so one `revert()` removes the pin-spacer, the transform and
 * the trigger together — which is what a live flip to reduced motion does.
 */
export function useShelfScroll({
  stageRef,
  trackRef,
  panelCount,
  active,
  onPanelChange,
}: ShelfScrollOptions): (index: number) => void {
  const trigger = useRef<ScrollTrigger | null>(null);

  /* The latest callback, without it being an input to the trigger. Declared
     before the effect below so React runs it first: on the render that turns
     the shelf on, the trigger is created with a callback already current. */
  const handlers = useRef({ onPanelChange });
  useLayoutEffect(() => {
    handlers.current = { onPanelChange };
  });

  /* useLayoutEffect, and it is load-bearing — see the note on `revert()` below. */
  useLayoutEffect(() => {
    if (!active || panelCount < 2) return;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!stage || !track) return;

    const context = gsap.context(() => {
      const setX = gsap.quickSetter(track, "x", "px");
      let shownPanel = -1;

      const apply = (progress: number) => {
        setX(trackX(progress, panelCount, window.innerWidth));
        const index = panelIndexFromProgress(progress, panelCount);
        if (index !== shownPanel) {
          shownPanel = index;
          handlers.current.onPanelChange(index);
        }
      };

      trigger.current = ScrollTrigger.create({
        trigger: stage,
        start: "top top",
        end: () => `+=${shelfScrollDistance(panelCount, window.innerHeight)}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: true,
        /* remeasure on resize: `end` and the track's travel are both viewport-
           relative, and a stale measurement is a shelf that stops short */
        invalidateOnRefresh: true,
        snap: {
          snapTo: snapIncrement(panelCount),
          duration: { min: 0.15, max: 0.5 },
          delay: 0.04,
          ease: "power1.inOut",
        },
        onUpdate: (self) => apply(self.progress),
        /* a refresh recomputes start/end under our feet; re-apply so the track
           never sits at a position that belongs to the old measurement */
        onRefresh: (self) => apply(self.progress),
      });
    }, stage);

    /* `pin: true` WRAPS the stage in a `.pin-spacer` div of ScrollTrigger's own
       making — it re-parents a node React believes it owns. React records the
       stage's parent as <section id="work">; its real parent is now the spacer.
       So when the shelf unmounts (a live switch to reduced motion is exactly
       that), React calls removeChild on the section, the node is not there, the
       DOM throws, and the error takes the *whole page* down with it — every
       case study gone, which is the precise failure this component exists to
       never have.
       `revert()` unwraps the spacer and puts the stage back where React left
       it. It has to happen BEFORE React removes the node, and a useEffect
       cleanup is passive: it runs after the mutation phase, too late. A layout
       effect's cleanup runs during it. Hence useLayoutEffect — not a style
       preference, the difference between working and a blank page. */
    return () => {
      trigger.current = null;
      context.revert();
    };
  }, [active, panelCount, stageRef, trackRef]);

  /* Where a study pill in the header lands. Reads the trigger's *measured*
     range rather than recomputing it, so it cannot disagree with the pin, and
     hands the scroll to Lenis so the page gets there the way every other jump
     on this site does. */
  return useCallback(
    (index: number) => {
      const st = trigger.current;
      if (!st) return;
      const y = scrollForPanel(index, panelCount, st.start, st.end);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y });
    },
    [panelCount],
  );
}
