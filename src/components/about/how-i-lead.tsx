"use client";

import { useId, useRef } from "react";
import { siteContent } from "@/lib/site-content";
import { useReveal } from "@/lib/use-reveal";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics";
import styles from "@/components/about/how-i-lead.module.css";

/**
 * "How I lead": one quiet card, a sub-section of About.
 *
 * It renders AFTER the teleprompter's 640vh wrapper, inside <section
 * id="about">, never in the statement column — anything in that column that
 * is not a [data-statement] gets no blur, fade or focus falloff (about.tsx).
 * Living inside the section is also what keeps the nav's scroll-spy on
 * "About" while the card is on screen.
 *
 * An h3: the About h2 ("Nice to meet you") already exists. Every string comes
 * from `siteContent.howILead`; the principle numbers are a CSS counter.
 */
export function HowILead() {
  const ref = useRef<HTMLDivElement>(null);
  const reveal = useReveal(ref);
  const titleId = useId();
  const copy = siteContent.howILead;
  const resumeHref = siteContent.links.resume;

  return (
    <div className={styles.wrap}>
      <div
        ref={ref}
        className={styles.card}
        role="group"
        aria-labelledby={titleId}
        data-reveal={reveal}
      >
        <div className={styles.intro}>
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
            <li key={p.title} className={styles.principle}>
              <h4 className={styles.principleTitle}>{p.title}</h4>
              <p className={styles.principleBody}>{p.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
