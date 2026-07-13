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
      if (lenis) lenis.scrollTo(el, { offset: -96, immediate: true });
      else el.scrollIntoView();
    }, 300); // after fonts/lockup/first ScrollTrigger measure
    return () => clearTimeout(timer);
  }, []);
  return null;
}
