"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";

/**
 * Fires `contact_reached` the first time the Contact section scrolls into view,
 * exactly once per page load. Renders nothing.
 *
 * Mounted only from the one-pager (app/page.tsx), so it never runs on
 * /work/[slug] — those pages have no #contact and this component is not there.
 *
 * Built on ScrollTrigger — the shared GSAP ticker that also drives Lenis (see
 * smooth-scroll.tsx) — not a second RAF loop and not a bare scroll listener.
 * `once: true` self-kills the trigger after the first entry, so it can never
 * double-fire however the visitor scrolls. The effect runs on the client only
 * (useEffect), and gsap.ts guards plugin registration against SSR, so there is
 * nothing to build on the server.
 */
export function ContactReached() {
  useEffect(() => {
    const el = document.getElementById("contact");
    if (!el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      // The section's top crossing 85% down the viewport = it has come into view.
      start: "top 85%",
      once: true,
      onEnter: () => trackEvent(ANALYTICS_EVENTS.contactReached),
    });
    return () => st.kill();
  }, []);
  return null;
}
