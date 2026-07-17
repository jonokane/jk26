import { WorkGallery } from "@/components/work/work-gallery";
import styles from "@/components/work/work.module.css";

/**
 * The Work section (spec §9). Task 7 lands the horizontal gallery; Task 9 makes
 * this the hybrid — this gallery plus a filterable vertical index, and the
 * toggle between them.
 */
export function Work() {
  return (
    /* The title (h2#work-title) is pinned inside the gallery's own stage now, so
       aria-labelledby still resolves. Task 9 makes this the hybrid, at which
       point the index view supplies its own #work-title when the gallery is off. */
    <section className={styles.work} id="work" aria-labelledby="work-title">
      <WorkGallery />
    </section>
  );
}
