import type { EarlierProject } from "#site/content";
import { isViewUrl } from "@/components/work/url-label";
import { sortedEarlierWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-work.module.css";

/* A single compact meta line: sector, discipline, timeframe. Deliberately fewer
   parts than the full case-study slab — this is a glanceable secondary list, and
   the whole panel has to clear both the pinned title and the counter inside one
   pinned viewport, which a two-line meta breaks on a laptop-height window. Role
   and platform are dropped as the most redundant with discipline. */
export function attributeParts(entry: EarlierProject): string[] {
  return [entry.sector.join(", "), entry.discipline.join(", "), entry.timeframe];
}

/**
 * The gallery's final panel (spec §9): every earlier project as a 2-col list.
 *
 * Two lines per entry — a title and one meta line — because the whole panel has
 * to sit between the pinned title and the counter inside one pinned viewport.
 * The title itself is the link when the project has a live URL (dropping a third
 * URL line that would not fit); entries whose `view` is a plain value like
 * "Archived" render an unlinked title.
 *
 * A list, not the card grid this used to be, and no MDX body: the body is what
 * /work/[slug] is for, and rendering it here would make the panel unbounded and
 * the track immeasurable.
 */
export function EarlierWork() {
  return (
    <section aria-labelledby="earlier-work-title" className={styles.panel}>
      <h3 id="earlier-work-title" className={styles.heading}>
        {siteContent.work.earlierTitle}
      </h3>
      <ul className={styles.grid}>
        {sortedEarlierWork.map((entry) => (
          <li key={entry.title} className={styles.item} data-earlier-work-entry={entry.title}>
            <h4 className={styles.title}>
              {isViewUrl(entry.view) ? (
                <a
                  href={entry.view}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.titleLink}
                >
                  {entry.title}
                </a>
              ) : (
                entry.title
              )}
            </h4>
            <p className={styles.attributes}>
              {attributeParts(entry).map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
