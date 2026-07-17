"use client";

import type { MouseEvent } from "react";
import { getLenis } from "@/components/smooth-scroll";

/**
 * Navigation scrolls, marked as such.
 *
 * Scroll-driven snapping (the collector, §7) waits for the scroll to go quiet
 * and then pulls the reader to the nearest beat. That is right for a reader who
 * has come to rest inside it, and catastrophic for a reader who is merely
 * FLYING PAST on the way somewhere else: clicking "Contact" in the nav armed the
 * collector's settle timer on the way through, and the timer then fired
 * mid-navigation and yanked the reader back to a beat. Measured before the fix:
 * the nav landed at the collector's end with Contact still 25,701px below.
 *
 * A snap cannot tell those two scrolls apart by watching the scroll position —
 * they look identical. So navigation says so out loud, and snapping stands
 * aside while it is happening.
 *
 * (An instant, un-animated jump — a plain `#hash` anchor — needs no flag: by the
 * time any settle timer fires, the reader is already out of the snapping
 * section's range, and the snap's own `isActive` check declines.)
 */
let inFlight = 0;

/** True while a deliberate navigation scroll is under way. */
export function isNavigating(): boolean {
  return inFlight > 0;
}

/** Belt and braces: never let a dropped onComplete strand the flag raised. */
const MAX_NAV_MS = 2500;

/**
 * Scroll to a navigation target through Lenis, marked as a navigation.
 * Returns false if Lenis is not mounted, so the caller can fall back.
 */
export function navigateTo(
  target: HTMLElement | number,
  opts: { immediate?: boolean } = {},
): boolean {
  const lenis = getLenis();
  if (!lenis) return false;

  inFlight += 1;
  let done = false;
  const release = () => {
    if (done) return;
    done = true;
    inFlight = Math.max(0, inFlight - 1);
  };

  window.setTimeout(release, MAX_NAV_MS);
  lenis.scrollTo(target, {
    ...(opts.immediate ? { immediate: true } : {}),
    onComplete: release,
  });
  return true;
}

/** The only click we're allowed to hijack: plain left-click, no modifiers. */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * Hand a plain click on an in-page `#hash` link to Lenis, so EVERY in-page link
 * on the site glides the same way and one mechanism owns it.
 *
 * This lives here, next to navigateTo, because it was the nav's private
 * behaviour for a phase and the About statement's "Hit me up" was a raw
 * `<a href="#contact">` that fell through to the browser: the header's Contact
 * eased 5897 → 7868 over ~1.2s while the identical destination, one section
 * up, arrived at 7868 in 60ms. Same site, same link, two different mechanisms —
 * which is exactly how they drift.
 *
 * The href stays real and untouched (cmd-click, open-in-new-tab, copy-link and
 * the a11y tree all keep working); only the plain left-click is intercepted.
 * Anything that is not a same-page `#hash` — an external URL, a modified click,
 * a hash with no element behind it — is left entirely to the browser.
 */
export function takeHashClick(e: MouseEvent, href: string): void {
  if (!href.startsWith("#") || !isPlainClick(e)) return;
  const target = href.slice(1);
  const el = document.getElementById(target);
  if (!el) return;
  e.preventDefault();
  history.pushState(null, "", `#${target}`);
  /* navigateTo, not lenis.scrollTo: it marks the scroll as a NAVIGATION so the
     collector's snap stands aside instead of hijacking it mid-flight. No
     `offset` either — Lenis honors the section's scroll-margin-top and an
     explicit offset would COMPOUND with it. */
  if (!navigateTo(el)) el.scrollIntoView();
}
