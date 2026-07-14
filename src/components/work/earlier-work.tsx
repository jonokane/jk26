import type { EarlierProject } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { isViewUrl, urlLabel } from "@/components/work/url-label";
import { sortedEarlierWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-work.module.css";

/** Compact attribute line for an earlier-work card: role, sector, discipline,
    platform (when set), timeframe — everything the full meta slab shows
    minus client/view, condensed for a small card. Separators are CSS-only
    (spec §15: no punctuation-as-copy in JSX). */
function attributeParts(entry: EarlierProject): string[] {
  const parts = [entry.role, entry.sector.join(", "), entry.discipline.join(", ")];
  if (entry.platform.length > 0) parts.push(entry.platform.join(", "));
  parts.push(entry.timeframe);
  return parts;
}

/**
 * "Selected earlier work" (spec §8): compact cards below the full case
 * studies — title, attribute line, the one-paragraph MDX body, and a link
 * only when `view` is a real URL (unlike the full meta slab, which shows
 * plain-text values like "Archived" too).
 */
export function EarlierWork() {
  return (
    <section aria-labelledby="earlier-work-title" className={styles.earlier}>
      <h3
        id="earlier-work-title"
        className={`heading-display ${styles.heading} text-2xl text-ink sm:text-3xl`}
      >
        {siteContent.work.earlierTitle}
      </h3>
      <ul className={styles.grid}>
        {sortedEarlierWork.map((entry) => (
          <li key={entry.title}>
            <article className={`slab ${styles.card}`} data-earlier-work-entry={entry.title}>
              <h4 className={styles.title}>{entry.title}</h4>
              <p className={styles.attributes}>
                {attributeParts(entry).map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </p>
              <div className={styles.body}>
                <MDXContent code={entry.body} />
              </div>
              {isViewUrl(entry.view) && (
                <a href={entry.view} target="_blank" rel="noreferrer" className={styles.link}>
                  {urlLabel(entry.view)}
                </a>
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
