import type { CaseStudy } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyIntro } from "@/components/work/case-study-intro";
import { CaseStudyCover } from "@/components/work/case-study-cover";
import { CaseStudyNext } from "@/components/work/case-study-next";
import { BODY_HEADING_LEVEL, HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import styles from "@/components/work/case-study-article.module.css";

/**
 * One case study as a vertical document (spec §10) — the whole body, in order.
 * Rendered by both surfaces: `/work/[slug]` (canonical share / SEO / long read)
 * and the slide-up modal (the intercepting route). One definition of what a case
 * study is; the surfaces differ only in their chrome.
 *
 * `headingLevel` adapts only the heading *tag* — h1 when the study is the
 * subject — never the markup, classes, or content. The body's own `##` headings
 * remap one level below the title so the outline stays sane.
 */
export function CaseStudyArticle({
  study,
  headingLevel = 3,
  next,
}: {
  study: CaseStudy;
  headingLevel?: HeadingLevel;
  next?: { title: string; url: string };
}) {
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];

  return (
    <article className={styles.article} id={study.slug} data-case-study={study.slug}>
      <CaseStudyIntro study={study} headingLevel={headingLevel} />

      <div className={styles.body} data-case-study-panel="body">
        <MDXContent code={study.body} components={{ h2: BodyHeadingTag }} />
      </div>

      <CaseStudyCover study={study} />

      {next && <CaseStudyNext title={next.title} url={next.url} />}
    </article>
  );
}
