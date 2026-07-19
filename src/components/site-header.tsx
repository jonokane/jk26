"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import { isPlainClick, navigateTo, takeHashClick } from "@/lib/scroll-nav";
import { siteContent } from "@/lib/site-content";
import { useHeaderHeight } from "@/lib/use-header-height";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useScrollSpy } from "@/lib/use-scroll-spy";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import styles from "@/components/site-header.module.css";

export const NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot";

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

  /* No morph under reduced motion (spec §7), so nothing would drive
     `header-on` — show the pill from first paint instead of never. */
  useEffect(() => {
    if (!isHome || !reducedMotion) return;
    const root = document.documentElement;
    root.classList.add("header-on");
    return () => root.classList.remove("header-on");
  }, [isHome, reducedMotion]);

  /* Hover-reveal (Jono's ask): before the wordmark has morphed into the nav,
     sweeping the cursor to the very top edge slides the pill down anyway — a
     logo-less About / Work / Contact / theme bar, since the wordmark is still on
     the hero and the slot stays empty (slotVisible is false here). Scoped to the
     hero region: past ~0.85vh the morph owns `header-on` and this stands aside,
     so the two never fight over it. The reveal zone has hysteresis so a cursor
     hovering the nav itself doesn't flicker it. */
  useEffect(() => {
    if (!isHome || reducedMotion) return;
    const root = document.documentElement;
    const REVEAL_ZONE = 80;
    const HIDE_ZONE = 140;
    const inHeroRegion = () => window.scrollY < window.innerHeight * 0.85;
    const onMove = (e: PointerEvent) => {
      if (!inHeroRegion()) return;
      if (e.clientY <= REVEAL_ZONE) root.classList.add("header-on");
      else if (e.clientY > HIDE_ZONE) root.classList.remove("header-on");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isHome, reducedMotion]);

  /* One-time peek (Jono's ask): a few seconds after load, slide the pill down for
     a beat and retract it, hinting that the nav is up there. Uses its own
     `header-peek` class — never `header-on` — so retracting can't clobber a
     reveal the hover or scroll owns by then. Skipped if the visitor has already
     scrolled out of the hero (the nav is theirs to summon at that point), and
     under reduced motion (where the pill is simply always present). */
  useEffect(() => {
    if (!isHome || reducedMotion) return;
    const root = document.documentElement;
    const PEEK_DELAY = 3000;
    const PEEK_HOLD = 1800;
    let retract: ReturnType<typeof setTimeout> | undefined;
    const show = setTimeout(() => {
      if (window.scrollY >= window.innerHeight * 0.85) return;
      root.classList.add("header-peek");
      retract = setTimeout(() => root.classList.remove("header-peek"), PEEK_HOLD);
    }, PEEK_DELAY);
    return () => {
      clearTimeout(show);
      if (retract) clearTimeout(retract);
      root.classList.remove("header-peek");
    };
  }, [isHome, reducedMotion]);

  /* On `/` with motion, the flying live wordmark is what you see land here. */
  const slotVisible = !isHome || reducedMotion;

  const onNavClick = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!isHome) return; // off-home: a real navigation to /#…
    /* takeHashClick, shared with the About statement's link (spec §8), so every
       in-page link on the site glides through the same Lenis navigation. */
    takeHashClick(e, `#${target}`);
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
      /* Not `slab`: that is the parked design's frosted material, and on the
         nav it now contributes only a stray `border-radius: 18px` — its
         background, border and shadow all read tokens deleted two phases ago,
         and its blur loses to this bar's own. The pill's own 15px radius used
         to mask it; making the nav a full-bleed bar unmasked it (spec §7). */
      className={`site-header ${styles.header}`}
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
