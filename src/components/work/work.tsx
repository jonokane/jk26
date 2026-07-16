import { siteContent } from "@/lib/site-content";
import { publishedWork } from "@/components/work/work-data";
import { formatStudyNumber } from "@/components/work/work-lists";
import styles from "@/components/work/work.module.css";

/**
 * Phase 1 stub: a plain index holding the #work anchor. Phase 4 builds the
 * hybrid — horizontal gallery plus this filterable vertical index (spec §9).
 */
export function Work() {
  return (
    <section className={styles.work} id="work" aria-labelledby="work-title">
      <h2 className={styles.title} id="work-title">
        {siteContent.titles.work}
      </h2>
      <p className={styles.intro}>{siteContent.work.intro}</p>
      <ol className={styles.index}>
        {publishedWork.map((study, index) => (
          <li key={study.slug} className={styles.row}>
            <span className={styles.num}>{formatStudyNumber(index + 1)}</span>
            <a className={styles.rowTitle} href={study.url}>
              {study.title}
            </a>
            <span className={styles.meta}>{study.year}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
