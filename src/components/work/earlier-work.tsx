import Link from "next/link";
import type { EarlierProject } from "#site/content";
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
 * The title itself is always the internal link to that entry's modal (dropping
 * a third URL line that would not fit); the external live `view` link, when
 * there is one, lives inside the modal instead.
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
              <Link href={entry.url} className={styles.titleLink}>
                {entry.title}
              </Link>
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
