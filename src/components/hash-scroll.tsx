"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/smooth-scroll";
import { ScrollTrigger } from "@/lib/gsap";

/** Scrolls to location.hash once layout has settled (spec §2 deep links). */
export function HashScroll() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.refresh();
      const lenis = getLenis();
      /* no `offset`: Lenis honors the section's scroll-margin-top (scroll-mt-28,
         112px) on its own, and an explicit offset COMPOUNDS with it — the two
         together used to overshoot every jump by 208px */
      if (lenis) lenis.scrollTo(el, { immediate: true });
      else el.scrollIntoView();
    }, 300); // after fonts/lockup/first ScrollTrigger measure
    return () => clearTimeout(timer);
  }, []);
  return null;
}
