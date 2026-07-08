import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Central place to register GSAP plugins so they're only registered once.
// Plugins touch the DOM, so guard against the server.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
