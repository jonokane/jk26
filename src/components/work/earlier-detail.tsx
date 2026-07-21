import type { EarlierProject } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyNext } from "@/components/work/case-study-next";
import { BODY_HEADING_LEVEL, HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import { isViewUrl } from "@/components/work/url-label";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-detail.module.css";

/**
 * One earlier project as a lighter "mini case study" (spec 2026-07-20): eyebrow
 * (primary sector), title, a compact meta line, the body copy, and — only when
 * the project is still live — an outbound link. Rendered by both the standalone
 * `/earlier/[slug]` page and the intercepting modal, exactly as CaseStudyArticle
 * serves both featured surfaces. Earlier items carry none of the featured fields
 * (cover, impact, client), so this reads only what an earlier item has.
 *
 * `headingLevel` sets only the title tag — h1 when the item is the subject.
 */
export function EarlierDetail({
  item,
  headingLevel = 3,
  next,
}: {
  item: EarlierProject;
  headingLevel?: HeadingLevel;
  next?: { title: string; url: string };
}) {
  const TitleTag = HEADING_TAGS[headingLevel];
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];
  const meta = [
    item.role,
    item.timeframe,
    item.discipline.join(", "),
    item.platform.join(", "),
  ].filter(Boolean);

  return (
    <article className={styles.detail} id={item.slug} data-earlier={item.slug}>
      <span className={styles.eyebrow}>{item.sector[0]}</span>
      <TitleTag className={styles.title}>{item.title}</TitleTag>
      <p className={styles.meta}>
        {meta.map((part, i) => (
          <span key={i}>{part}</span>
        ))}
      </p>

      <div className={styles.body}>
        <MDXContent code={item.body} components={{ h2: BodyHeadingTag }} />
      </div>

      {isViewUrl(item.view) && (
        <p className={styles.live}>
          <a href={item.view} target="_blank" rel="noreferrer">
            {siteContent.work.viewLiveLabel}
          </a>
        </p>
      )}

      {next && <CaseStudyNext title={next.title} url={next.url} />}
    </article>
  );
}
