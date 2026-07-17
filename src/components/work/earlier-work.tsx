import type { EarlierProject } from "#site/content";
import { isViewUrl, urlLabel } from "@/components/work/url-label";
import { sortedEarlierWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-work.module.css";

/**
 * Compact attribute line: role, sector, discipline, platform (when set),
 * timeframe. Separators are CSS-only (spec §15: no punctuation-as-copy in JSX).
 */
function attributeParts(entry: EarlierProject): string[] {
  const parts = [entry.role, entry.sector.join(", "), entry.discipline.join(", ")];
  if (entry.platform.length > 0) parts.push(entry.platform.join(", "));
  parts.push(entry.timeframe);
  return parts;
}

/**
 * The gallery's final panel (spec §9): every earlier project as a 2-col list.
 *
 * A list, not the card grid this used to be, and no MDX body: the body is what
 * /work/[slug] is for, and rendering it here would make the panel unbounded and
 * the track immeasurable. Title plus one attribute line is what a poster wall
 * can carry.
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
            <h4 className={styles.title}>{entry.title}</h4>
            <p className={styles.attributes}>
              {attributeParts(entry).map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </p>
            {isViewUrl(entry.view) && (
              <a href={entry.view} target="_blank" rel="noreferrer" className={styles.link}>
                {urlLabel(entry.view)}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
