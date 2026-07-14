"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { getLenis } from "@/components/smooth-scroll";
import { siteContent } from "@/lib/site-content";
import { WORDMARK_TEXT, wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useScrollSpy } from "@/lib/use-scroll-spy";

export const NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot";

/** The only click we're allowed to hijack: plain left-click, no modifiers. */
function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * The floating nav pill (spec §6), route-aware.
 *
 * On `/` the nav targets are in-page: the links carry real `#hash` hrefs (so
 * cmd-click, open-in-new-tab and copy-link all work, and screen readers
 * announce a link, not a button) but a plain click is intercepted and handed to
 * Lenis for the smooth scroll. Visibility is not our call there: the wordmark
 * morph (or its reduced-motion fallback) toggles `header-on` on <html> and
 * globals.css transitions the pill in.
 *
 * Off `/` — the case study pages, which are the canonical share/SEO and
 * reduced-motion reading surface — the same nav becomes ordinary cross-page
 * links to `/#…` (HashScroll lands them), the wordmark is a link home, and the
 * pill is simply present from first paint (`data-static`). Without this those
 * pages had no header and no nav landmark at all.
 *
 * The slot span is the morph's landing target — invisible on `/` while the live
 * wordmark is flying, visible everywhere the morph doesn't run.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reducedMotion = useReducedMotionPref();
  const active = useScrollSpy(siteContent.nav.map((n) => n.target));

  /* On `/` with motion, the flying live wordmark is what you see land here. */
  const slotVisible = !isHome || reducedMotion;

  const onNavClick = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!isHome || !isPlainClick(e)) return; // off-home: a real navigation
    const el = document.getElementById(target);
    if (!el) return;
    e.preventDefault();
    history.pushState(null, "", `#${target}`);
    const lenis = getLenis();
    /* no `offset` here: Lenis honors the section's scroll-margin-top
       (scroll-mt-28) and an explicit offset would COMPOUND with it */
    if (lenis) lenis.scrollTo(el);
    else el.scrollIntoView();
  };

  const onHomeClick = (e: MouseEvent<HTMLElement>) => {
    if (!isHome || !isPlainClick(e)) return;
    e.preventDefault();
    history.pushState(null, "", location.pathname);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo(0, 0);
  };

  const slot = (
    <span
      id={NAV_WORDMARK_SLOT_ID}
      style={{
        fontFamily: wordmarkConfig.family,
        fontSize: "1.05rem",
        letterSpacing: `${wordmarkConfig.trackEm}em`,
        /* the locked Area axes — without these the slot renders at the font's
           default axes, which is what you actually see under reduced motion */
        fontVariationSettings: wordmarkFvs(wordmarkConfig.axes.wght),
        opacity: slotVisible ? 1 : 0,
      }}
    >
      {WORDMARK_TEXT}
    </span>
  );

  return (
    <header className="site-header slab" data-static={isHome ? undefined : ""}>
      {isHome ? (
        <button
          type="button"
          onClick={onHomeClick}
          className="site-header-home"
          aria-label={siteContent.labels.backToTop}
        >
          {slot}
        </button>
      ) : (
        <Link href="/" className="site-header-home" aria-label={siteContent.labels.home}>
          {slot}
        </Link>
      )}
      <nav aria-label="Site">
        {siteContent.nav.map(({ label, target }) => (
          <Link
            key={target}
            href={isHome ? `#${target}` : `/#${target}`}
            onClick={(e) => onNavClick(e, target)}
            aria-current={isHome && active === target ? "location" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
