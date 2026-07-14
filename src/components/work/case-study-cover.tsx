import styles from "@/components/work/case-study-cover.module.css";

/**
 * Cover placeholder (spec §8): every case study currently has no real cover
 * art, so this scene-gradient block stands in for it everywhere a case study
 * renders. Purely decorative — the study's title and impact carry the
 * meaning, so this is hidden from assistive tech.
 */
export function CaseStudyCover() {
  return <div className={styles.cover} data-case-study-panel="cover" aria-hidden="true" />;
}
