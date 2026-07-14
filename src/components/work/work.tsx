import { CaseStudyArticle } from "@/components/work/case-study-article";
import { EarlierWork } from "@/components/work/earlier-work";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * The home Work section (spec §8): every published case study renders in
 * full, one after another ("the whole case study lives on the page, wysiwyg,
 * no click required"), each pointing to the next, followed by the compact
 * "Selected earlier work" cards. No motion/pinning yet — this plain vertical
 * document IS the reduced-motion path (spec §12); the pinned horizontal shelf
 * lands in a later pass on top of this same markup.
 */
export function Work() {
  return (
    <section id="work" aria-labelledby="work-title" className={`scroll-mt-28 ${styles.section}`}>
      <header className={styles.header}>
        <h2
          id="work-title"
          className={`heading-display ${styles.heading} text-4xl text-ink sm:text-5xl`}
        >
          {siteContent.titles.work}
        </h2>
        <p className={styles.intro}>{siteContent.work.intro}</p>
      </header>

      <div className={styles.studies}>
        {publishedWork.map((study, index) => {
          const next = nextStudy(publishedWork, study.slug);
          return (
            <CaseStudyArticle
              key={study.slug}
              study={study}
              number={index + 1}
              headingLevel={3}
              next={next ? { title: next.title, url: next.url } : undefined}
            />
          );
        })}
      </div>

      <EarlierWork />
    </section>
  );
}
