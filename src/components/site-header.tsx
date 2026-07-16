"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { navigateTo } from "@/lib/scroll-nav";
import { siteContent } from "@/lib/site-content";
import { useHeaderHeight } from "@/lib/use-header-height";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import styles from "@/components/site-header.module.css";

export const NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot";

/** The only click we're allowed to hijack: plain left-click, no modifiers. */
function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * TEMPORARY stand-in for the wordmark morph on `/`. `hero.tsx` is currently a
 * Phase 1 stub — it never calls `useWordmarkMorph`, so nothing writes
 * `header-on` on the home page, and the reduced-motion fallback that used to
 * set it directly was deleted with it. Without this, `html.header-on
 * .site-header` (globals.css) never matches on `/`, so the nav pill —
 * including the theme toggle it contains — is permanently hidden and
 * unreachable there. Delete this the moment Phase 2 mounts the wordmark morph
 * and it starts driving `header-on` itself (same class, same 0.85 threshold).
 *
 * Uses ScrollTrigger off the shared GSAP ticker (the house pattern — see
 * smooth-scroll.tsx) rather than a bespoke scroll listener or a second RAF
 * loop, mirroring the numeric start/end (no trigger element) already proven
 * by use-wordmark-morph.ts.
 */
function useHomeHeaderOnFallback(isHome: boolean, reducedMotion: boolean): void {
  useEffect(() => {
    if (!isHome) return;
    const root = document.documentElement;

    if (reducedMotion) {
      root.classList.add("header-on");
      return () => root.classList.remove("header-on");
    }

    const threshold = () => window.innerHeight * 0.85;
    /* Cover the case where the page mounts already scrolled past the
       threshold (e.g. scroll restoration) — ScrollTrigger's onLeave/
       onEnterBack only fire on a crossing, not on the initial state. */
    if (window.scrollY > threshold()) root.classList.add("header-on");

    const st = ScrollTrigger.create({
      start: 0,
      end: threshold,
      onLeave: () => root.classList.add("header-on"),
      onEnterBack: () => root.classList.remove("header-on"),
    });

    return () => {
      st.kill();
      root.classList.remove("header-on");
    };
  }, [isHome, reducedMotion]);
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
 * wordmark is flying, visible everywhere the morph doesn't run. It lives inside
 * row 1, which keeps the geometry the pill has always had; the Work row (spec
 * §6) grows open *below* it, so the slot never moves and the morph still lands.
 */
export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  useHeaderHeight(headerRef);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const reducedMotion = useReducedMotionPref();
  const active = useScrollSpy(siteContent.nav.map((n) => n.target));
  useHomeHeaderOnFallback(isHome, reducedMotion);

  /* On `/` with motion, the flying live wordmark is what you see land here. */
  const slotVisible = !isHome || reducedMotion;

  const onNavClick = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!isHome || !isPlainClick(e)) return; // off-home: a real navigation
    const el = document.getElementById(target);
    if (!el) return;
    e.preventDefault();
    history.pushState(null, "", `#${target}`);
    /* navigateTo, not lenis.scrollTo: it marks the scroll as a NAVIGATION so
       the collector's snap stands aside instead of hijacking it mid-flight.
       No `offset` either — Lenis honors the section's scroll-margin-top
       (scroll-mt-28) and an explicit offset would COMPOUND with it. */
    if (!navigateTo(el)) el.scrollIntoView();
  };

  const onHomeClick = (e: MouseEvent<HTMLElement>) => {
    if (!isHome || !isPlainClick(e)) return;
    e.preventDefault();
    history.pushState(null, "", location.pathname);
    if (!navigateTo(0)) window.scrollTo(0, 0);
  };

  const slot = (
    <span
      id={NAV_WORDMARK_SLOT_ID}
      className={styles.brandSlot}
      /* opacity is live state, so it stays inline; the type is a design
         decision and lives in CSS. */
      style={{ opacity: slotVisible ? 1 : 0 }}
    >
      {siteContent.wordmark}
    </span>
  );

  return (
    <header
      ref={headerRef}
      className={`site-header slab ${styles.header}`}
      data-static={isHome ? undefined : ""}
    >
      <div className={styles.top}>
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
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
