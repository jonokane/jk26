import type { CaseStudy } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyCover } from "@/components/work/case-study-cover";
import { CaseStudyIntro } from "@/components/work/case-study-intro";
import { CaseStudyNext } from "@/components/work/case-study-next";
import type { ShelfPanel } from "@/components/work/shelf-panels";
import styles from "@/components/work/shelf-panel.module.css";

/** DOM id of a panel — the shelf's keyboard/anchor target, and its dots' labels. */
export function shelfPanelId(key: string): string {
  return `shelf-panel-${key}`;
}

/**
 * One panel of the shelf (spec §8) — a server component, so the MDX for every
 * panel is compiled and rendered on the server exactly like the vertical read.
 * The client shell around it (`shelf-stage.tsx`) only moves it; it never
 * renders content.
 *
 * Intro panels are the shared `CaseStudyIntro`. Section panels are one frosted
 * slab per `##` section, labelled with that section's own heading — so
 * "Overview" and "The challenge" ride one panel as two slabs, exactly as spec'd,
 * with no copy in the JSX: every word here comes from the MDX.
 */
export function ShelfPanelView({
  panel,
  next,
}: {
  panel: ShelfPanel<CaseStudy>;
  next?: { title: string; url: string };
}) {
  const last = panel.position === panel.panelsInStudy;

  return (
    <section
      id={shelfPanelId(panel.key)}
      className={styles.panel}
      data-shelf-panel={panel.index}
      data-shelf-study={panel.studyIndex}
      data-shelf-kind={panel.kind}
      aria-label={panel.caption}
    >
      {panel.kind === "intro" ? (
        <CaseStudyIntro study={panel.study} number={panel.number} variant="panel" />
      ) : (
        <div className={styles.sections} data-count={panel.sections.length}>
          {panel.sections.map((section) => (
            <div key={section.heading} className={`slab ${styles.slab}`}>
              <h4 className={`text-kicker text-xs ${styles.sectionHeading}`}>{section.heading}</h4>
              <div className={styles.prose}>
                <MDXContent code={section.body} />
              </div>
            </div>
          ))}
          {/* Artifact block (spec §8): the single-section panels — "What I did"
              and "Outcome" — carry an artifact beside the prose, or they read as
              a lone slab in an empty viewport. A scene-gradient placeholder
              until real art lands, same as the covers. */}
          {panel.sections.length === 1 && <CaseStudyCover className={styles.artifact} />}
          {/* the study's last panel closes it out — outside the map, so a panel
              that ever carries two sections still shows exactly one teaser */}
          {last && next && <CaseStudyNext title={next.title} url={next.url} />}
        </div>
      )}
    </section>
  );
}
