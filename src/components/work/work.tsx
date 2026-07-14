import { CaseStudyArticle } from "@/components/work/case-study-article";
import { EarlierWork } from "@/components/work/earlier-work";
import { ShelfPanelView } from "@/components/work/shelf-panel";
import { buildShelfPanels, toPanelMeta, toStudyMeta } from "@/components/work/shelf-panels";
import { WorkShelf } from "@/components/work/work-shelf";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * The Work section (spec §8): a runway of open sky with the scrim ramping in,
 * the "Selected Work" heading with its own breathing room, then the shelf —
 * three published case studies, four panels each, pinned while vertical scroll
 * carries them past. "Selected earlier work" closes the section on the way to
 * Contact.
 *
 * Everything here renders on the server, both forms of it: the shelf's twelve
 * panels *and* the vertical document they fall back to. `WorkShelf` only picks
 * between them (read it for why that, rather than a `display: none`). The draft
 * study appears in neither — `publishedWork` filtered it out before this file
 * ever saw it.
 */
export function Work() {
  const panels = buildShelfPanels(publishedWork);

  const teaser = (slug: string) => {
    const next = nextStudy(publishedWork, slug);
    return next ? { title: next.title, url: next.url } : undefined;
  };

  return (
    <section
      id="work"
      aria-labelledby="work-title"
      className={`scrim-ramp scroll-mt-28 ${styles.section}`}
    >
      {/* The heading moment (spec §8): its own breathing room, scrolled away
          before the shelf catches. The runway of open sky above it is this
          section's top padding, and the scrim ramps in across it. */}
      <header className={styles.header}>
        <h2
          id="work-title"
          className={`heading-display ${styles.heading} text-4xl text-ink sm:text-5xl`}
        >
          {siteContent.titles.work}
        </h2>
        <p className={styles.intro}>{siteContent.work.intro}</p>
      </header>

      <WorkShelf
        panels={toPanelMeta(panels)}
        studies={toStudyMeta(publishedWork)}
        fallback={
          <div className={styles.studies}>
            {publishedWork.map((study, index) => (
              <CaseStudyArticle
                key={study.slug}
                study={study}
                number={index + 1}
                headingLevel={3}
                next={teaser(study.slug)}
              />
            ))}
          </div>
        }
      >
        {panels.map((panel) => (
          <ShelfPanelView key={panel.key} panel={panel} next={teaser(panel.study.slug)} />
        ))}
      </WorkShelf>

      <EarlierWork />
    </section>
  );
}
