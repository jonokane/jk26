import type { CaseStudy } from "#site/content";
import { CaseStudyCover } from "@/components/work/case-study-cover";
import { CaseStudyMeta } from "@/components/work/case-study-meta";
import { HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import { formatStudyNumber } from "@/components/work/work-lists";
import styles from "@/components/work/case-study-intro.module.css";

/**
 * The head of a case study (spec §8): number, title, the one-line impact, the
 * frosted meta slab, cover art right.
 *
 * There is exactly one of these. The vertical read (`CaseStudyArticle`, and so
 * `/work/[slug]`) opens with it, and the shelf's intro panel *is* it — the
 * shelf does not get a second, drifting copy of what a case study's head looks
 * like. `variant` changes the proportions (a panel fills a viewport; a document
 * flows), never the content or the semantics.
 */
export function CaseStudyIntro({
  study,
  number,
  headingLevel = 3,
  variant = "document",
}: {
  study: CaseStudy;
  number: number;
  headingLevel?: HeadingLevel;
  variant?: "document" | "panel";
}) {
  const TitleTag = HEADING_TAGS[headingLevel];

  return (
    <div className={styles.intro} data-variant={variant} data-case-study-panel="intro">
      <div className={styles.text}>
        <span className={`${styles.number} text-kicker text-sm`}>{formatStudyNumber(number)}</span>
        <TitleTag className={`heading-display ${styles.title} text-ink`}>{study.title}</TitleTag>
        <p className={styles.impact}>{study.impact}</p>
        <CaseStudyMeta study={study} />
      </div>
      <CaseStudyCover className={styles.cover} />
    </div>
  );
}
