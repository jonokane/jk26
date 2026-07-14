import type { CaseStudy } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyIntro } from "@/components/work/case-study-intro";
import { CaseStudyNext } from "@/components/work/case-study-next";
import { BODY_HEADING_LEVEL, HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import styles from "@/components/work/case-study-article.module.css";

/**
 * One case study as a vertical document — the whole body, in order.
 *
 * Two surfaces render this: `/work/[slug]` (the canonical share/SEO and
 * long-form reading path) and the home Work section under reduced motion or
 * with JS off (spec §12), where it is the shelf's fallback. The shelf renders
 * the *same* content re-cut into panels: the head from the same
 * `CaseStudyIntro`, the teaser from the same `CaseStudyNext`, and the prose
 * from the same MDX file, sectioned at build time (`case-study-sections.ts`).
 * There is no second definition of what a case study is.
 *
 * `headingLevel` adapts only the heading *tag* — h1 when the study is a page's
 * subject, h3 when it is nested under the Work section's h2 — never the markup,
 * classes or content. The body's own `##` headings are remapped one level below
 * the title so the document outline stays sane either way.
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
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];

  return (
    <article className={styles.article} id={study.slug} data-case-study={study.slug}>
      <CaseStudyIntro study={study} number={number} headingLevel={headingLevel} />

      <div className={styles.body} data-case-study-panel="body">
        {/* The MDX body's `## Overview` / `## The challenge` / `## What I did` /
            `## Outcome` compile to <h2> by default — remapped here so they never
            collide with the section-level <h2> or the study title above them. */}
        <MDXContent code={study.body} components={{ h2: BodyHeadingTag }} />
      </div>

      {next && <CaseStudyNext title={next.title} url={next.url} />}
    </article>
  );
}
