"use client";

import { getLenis } from "@/components/smooth-scroll";
import { siteContent } from "@/lib/site-content";
import { WORDMARK_TEXT, wordmarkConfig } from "@/lib/wordmark-config";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useScrollSpy } from "@/lib/use-scroll-spy";

export const NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot";

/**
 * The floating nav pill (spec §6). It has no opinion about when it shows:
 * the wordmark morph (or its reduced-motion fallback) toggles `header-on`
 * on <html>, and globals.css transitions the pill in. The slot span is the
 * morph's landing target — invisible except under reduced motion, where
 * the morph doesn't run and the slot itself displays the wordmark.
 */
export function SiteHeader() {
  const reducedMotion = useReducedMotionPref();
  const active = useScrollSpy(siteContent.nav.map((n) => n.target));

  const go = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    history.pushState(null, "", `#${target}`);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -96 });
    else el.scrollIntoView();
  };

  return (
    <header className="site-header slab fixed inset-x-[2vw] top-[14px] z-40 flex items-center gap-[3vw] !rounded-[15px] !px-6 !py-3">
      <button
        type="button"
        onClick={() => {
          history.pushState(null, "", location.pathname);
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(0);
          else window.scrollTo(0, 0);
        }}
        className="border-0 bg-transparent p-0 text-left"
        aria-label="Back to top"
      >
        <span
          id={NAV_WORDMARK_SLOT_ID}
          className="text-ink"
          style={{
            fontFamily: wordmarkConfig.family,
            fontSize: "1.05rem",
            letterSpacing: `${wordmarkConfig.trackEm}em`,
            opacity: reducedMotion ? 1 : 0,
          }}
        >
          {WORDMARK_TEXT}
        </span>
      </button>
      <nav aria-label="Site" className="ml-auto flex gap-7">
        {siteContent.nav.map(({ label, target }) => (
          <button
            key={target}
            type="button"
            onClick={() => go(target)}
            aria-current={active === target ? "true" : undefined}
            className={`border-0 bg-transparent p-0 text-sm tracking-wide transition-colors ${
              active === target ? "text-ink underline underline-offset-8" : "text-sub"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
