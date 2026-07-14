import styles from "@/components/work/case-study-cover.module.css";

/**
 * Cover placeholder (spec §8): every case study currently has no real cover
 * art, so this scene-gradient block stands in for it everywhere a case study
 * renders. Purely decorative — the study's title and impact carry the
 * meaning, so this is hidden from assistive tech.
 *
 * `className` lets the surface it lands on size it (a shelf panel's cover
 * takes a slice of the viewport; a document's keeps its aspect ratio) without
 * anyone re-declaring what the material is.
 */
export function CaseStudyCover({ className }: { className?: string }) {
  return (
    <div
      className={className ? `${styles.cover} ${className}` : styles.cover}
      data-case-study-panel="cover"
      aria-hidden="true"
    />
  );
}
