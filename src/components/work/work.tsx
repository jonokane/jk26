import { siteContent } from "@/lib/site-content";
import { WorkGallery } from "@/components/work/work-gallery";
import styles from "@/components/work/work.module.css";

/**
 * The Work section (spec §9). Task 7 lands the horizontal gallery; Task 9 makes
 * this the hybrid — this gallery plus a filterable vertical index, and the
 * toggle between them.
 */
export function Work() {
  return (
    <section className={styles.work} id="work" aria-labelledby="work-title">
      <div className={styles.head}>
        <h2 className={styles.title} id="work-title">
          {siteContent.titles.work}
        </h2>
        <p className={styles.intro}>{siteContent.work.intro}</p>
      </div>
      <WorkGallery />
    </section>
  );
}
