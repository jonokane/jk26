import type { CaseStudy } from "#site/content";
import { CaseStudyMeta } from "@/components/work/case-study-meta";
import { HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import styles from "@/components/work/case-study-intro.module.css";

/**
 * The head of a case study (spec §10): a single column — eyebrow (the client),
 * the title, the impact lead, then the attribute grid. The prototype's detail
 * view, not the parked two-column intro-with-cover; the image now sits in a wide
 * slot at the foot of the article (CaseStudyCover), where the prototype's
 * `.dshot` is.
 *
 * `headingLevel` sets only the title *tag* — h1 when the study is a page or
 * modal's subject — never the markup or content.
 */
export function CaseStudyIntro({
  study,
  headingLevel = 3,
}: {
  study: CaseStudy;
  headingLevel?: HeadingLevel;
}) {
  const TitleTag = HEADING_TAGS[headingLevel];

  return (
    <div className={styles.intro} data-case-study-panel="intro">
      <span className={styles.eyebrow}>{study.client}</span>
      <TitleTag className={styles.title}>{study.title}</TitleTag>
      <p className={styles.impact}>{study.impact}</p>
      <CaseStudyMeta study={study} />
    </div>
  );
}
