import type { ComponentType, HTMLAttributes } from "react";
import Link from "next/link";
import type { CaseStudy } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyCover } from "@/components/work/case-study-cover";
import { CaseStudyMeta } from "@/components/work/case-study-meta";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-article.module.css";

type HeadingLevel = 1 | 2 | 3 | 4 | 5;

/** Module-scope, defined once: stable component identities for `HEADING_TAGS`
    lookups below, so picking a heading level at render time never creates a
    new component (which would remount the subtree — react-hooks/static-components). */
const HEADING_TAGS: Record<HeadingLevel, ComponentType<HTMLAttributes<HTMLHeadingElement>>> = {
  1: (props) => <h1 {...props} />,
  2: (props) => <h2 {...props} />,
  3: (props) => <h3 {...props} />,
  4: (props) => <h4 {...props} />,
  5: (props) => <h5 {...props} />,
};

const BODY_HEADING_LEVEL: Record<HeadingLevel, HeadingLevel> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 5,
};

/**
 * One case study, rendered identically wherever it appears (spec §8): the
 * home Work section and the dedicated `/work/[slug]` page both render this
 * component, so there is exactly one definition of what a case study looks
 * like. `headingLevel` adapts only the heading *tag* — h3 when nested under
 * the Work section's own h2 (home), h1 when this is a standalone page's
 * subject (`/work/[slug]`) — never the markup, classes, or content. The MDX
 * body's own `##` headings are remapped one level below the study title so
 * the document outline stays sane either way.
 */
export function CaseStudyArticle({
  study,
  number,
  headingLevel = 3,
  next,
}: {
  study: CaseStudy;
  number: number;
  headingLevel?: HeadingLevel;
  next?: { title: string; url: string };
}) {
  const TitleTag = HEADING_TAGS[headingLevel];
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];

  return (
    <article className={styles.article} id={study.slug} data-case-study={study.slug}>
      <div className={styles.intro} data-case-study-panel="intro">
        <div className={styles.introText}>
          <span className={`${styles.number} text-kicker text-sm`}>
            {formatStudyNumber(number)}
          </span>
          <TitleTag className={`heading-display ${styles.title} text-3xl text-ink sm:text-4xl`}>
            {study.title}
          </TitleTag>
          <p className={styles.impact}>{study.impact}</p>
          <CaseStudyMeta study={study} />
        </div>
        <CaseStudyCover />
      </div>

      <div className={styles.body} data-case-study-panel="body">
        {/* The MDX body's `## Overview` / `## The challenge` / `## What I did` /
            `## Outcome` compile to <h2> by default — remapped here so they never
            collide with the section-level <h2> or the study title above them. */}
        <MDXContent code={study.body} components={{ h2: BodyHeadingTag }} />
      </div>

      {next && (
        <p className={styles.next} data-case-study-panel="next">
          <Link href={next.url}>
            {siteContent.work.nextLabel}: {next.title}
          </Link>
        </p>
      )}
    </article>
  );
}
