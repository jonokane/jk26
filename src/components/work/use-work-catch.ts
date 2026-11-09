"use client";

import { useEffect, type RefObject } from "react";
import { useLenis } from "lenis/react";
import { isNavigating } from "@/lib/scroll-nav";
import { WORK } from "@/components/work/work-config";
import { isFlingPastWork, shouldRearm } from "@/components/work/work-catch";

/**
 * The catch at Work's door (work-config `catch`). Watches Lenis's scroll, and
 * when a downward fling is headed past the top of Work, glides the page to
 * rest exactly there instead: the first card, mid-hold.
 *
 * This is where About's deceleration went. The teleprompter's long scroll
 * budget used to soak up a fling before Work; with About shortened and How I
 * lead between the two, a fling would otherwise sail into the gallery and
 * skip its first, most recent study.
 *
 * Only what Lenis smooths can be a fling here: wheel and trackpad. Touch and
 * the keyboard scroll natively, which keeps Lenis's target pinned to the page,
 * so they never look like one. Nav links, hash links and the Scroll button go
 * through navigateTo, which marks the scroll, and the catch stands aside.
 *
 * No RAF loop of its own (CLAUDE.md): Lenis's scroll event already fires on
 * the shared GSAP ticker.
 */
export function useWorkCatch(sectionRef: RefObject<HTMLElement | null>, active: boolean): void {
  const lenis = useLenis();

  useEffect(() => {
    const section = sectionRef.current;
    if (!lenis || !section || !active) return;
    const { fling, duration, rearm, easing } = WORK.catch;
    let armed = true;

    const onScroll = () => {
      const vh = window.innerHeight;
      const scroll = lenis.animatedScroll;
      const target = lenis.targetScroll;
      /* Cheap gate before any layout read: an armed catch only cares about a
         fling in progress, which is most frames' answer of "no". */
      if (armed && !(lenis.direction === 1 && target - scroll > fling * vh)) return;

      const workTop = section.getBoundingClientRect().top + window.scrollY;
      if (!armed) {
        if (shouldRearm(scroll, workTop, vh, rearm)) armed = true;
        return;
      }
      if (isNavigating()) return;
      if (isFlingPastWork({ scroll, target, direction: lenis.direction, workTop, viewportHeight: vh }, fling)) {
        armed = false;
        /* A whole pixel, never the raw offset. Work's top is fractional
           (5089.74 measured), a 2x screen snaps the page to the half pixel
           (5089.5), and every later wheel step then aims at an exact .5.
           Lenis finishes a smooth scroll only when the rounded position
           equals the rounded target, and approaching N.5 from below rounds
           to N forever: it never finishes, stays in smooth mode, and fights
           the scrollbar and the keyboard. Measured, then fixed here.
           lock: input is ignored for the glide, which swallows the rest of
           the fling's momentum. force: run even if Lenis is mid-animation. */
        lenis.scrollTo(Math.round(workTop), { duration, easing, lock: true, force: true });
      }
    };

    lenis.on("scroll", onScroll);
    return () => lenis.off("scroll", onScroll);
  }, [lenis, sectionRef, active]);
}
