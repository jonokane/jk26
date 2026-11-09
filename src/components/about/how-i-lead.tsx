"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import { HOW_I_LEAD as T } from "@/components/about/how-i-lead-config";
import styles from "@/components/about/how-i-lead.module.css";

/** A clip that draws the band in by `pct` percent of its width on each side. */
const inset = (pct: number) => `inset(0% ${pct}% 0% ${pct}%)`;

/**
 * "How I lead": the leadership sub-section closing out About.
 *
 * The page's two colors swap for one band: --ink ground, --canvas type and
 * About's inverse accent. Full bleed, so the fixed Scroll cue floats over it
 * rather than grazing an edge, and there is no ragged right. As it scrolls in,
 * the band opens from a slightly inset card to the full width of the screen,
 * and it draws back in as it leaves. Each principle is a card that grows to
 * full size as it rises in, then stays put, so all five read at once.
 *
 * It renders AFTER the teleprompter's wrapper, inside <section id="about">,
 * never in the statement column: anything in that column that is not a
 * [data-statement] gets no blur, fade or focus falloff (about.tsx). Living
 * inside the section is also what keeps the nav's scroll-spy on "About".
 *
 * An h3, under About's h2 ("Nice to meet you"), with a mono eyebrow above it:
 * the sub-section signal that keeps it reading as part of About rather than a
 * new section. Every string comes from `siteContent.howILead`; the principle
 * numbers are a CSS counter; every motion number is in how-i-lead-config.
 *
 * The server HTML is the finished layout. Motion only ever starts from it on
 * the client, and never under reduced motion, so a visitor without JavaScript,
 * a crawler, or a reduced-motion visitor sees the band open and every card
 * resolved.
 */
export function HowILead() {
  const bandRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPref();
  const titleId = useId();
  const copy = siteContent.howILead;
  const resumeHref = siteContent.links.resume;

  useEffect(() => {
    const band = bandRef.current;
    /* The direct query as well as the hook: the hook reads false on its first
       pass (it is hydration-safe), and a reduced-motion visitor must never get
       even one frame of the from-state. */
    if (!band || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        band,
        { clipPath: inset(T.inset) },
        {
          clipPath: inset(0),
          ease: T.bandEase,
          scrollTrigger: { trigger: band, start: "top bottom", end: T.openBy, scrub: T.scrub },
        },
      );
      /* immediateRender: false, or this tween would stamp its from-state (full
         width) over the opening tween's at creation. */
      gsap.fromTo(
        band,
        { clipPath: inset(0) },
        {
          clipPath: inset(T.inset),
          ease: T.bandEase,
          immediateRender: false,
          scrollTrigger: { trigger: band, start: T.closeFrom, end: "bottom top", scrub: T.scrub },
        },
      );

      for (const card of gsap.utils.toArray<HTMLElement>("[data-principle]", band)) {
        gsap.fromTo(
          card,
          { scale: T.cardFromScale, opacity: T.cardFromOpacity },
          {
            scale: 1,
            opacity: 1,
            ease: T.cardEase,
            scrollTrigger: { trigger: card, start: "top bottom", end: T.cardFullBy, scrub: T.scrub },
          },
        );
      }
    }, band);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div className={styles.wrap}>
      <div ref={bandRef} className={styles.band} role="group" aria-labelledby={titleId}>
        <div className={styles.inner}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h3 id={titleId} className={styles.title}>
              {copy.title}
            </h3>
            <p className={styles.lede}>{copy.lede}</p>
            {/* A link with no URL is not rendered: the rule Contact's footer and
                the About CTAs follow. Résumé waits on links.resume. */}
            {resumeHref ? (
              <a
                href={resumeHref}
                target="_blank"
                rel="noreferrer"
                className={styles.cta}
                onClick={() => trackEvent(ANALYTICS_EVENTS.resumeDownload)}
              >
                {copy.resumeCta}
              </a>
            ) : null}
          </div>

          <ul className={styles.principles}>
            {copy.principles.map((p) => (
              <li key={p.title} data-principle className={styles.principle}>
                <h4 className={styles.principleTitle}>{p.title}</h4>
                <p className={styles.principleBody}>{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
