"use client";

import { useCallback, useRef, useState } from "react";
import { EarlierWork } from "@/components/work/earlier-work";
import { useGallery } from "@/components/work/use-gallery";
import { WorkCard } from "@/components/work/work-card";
import { publishedWork } from "@/components/work/work-data";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * The pinned horizontal gallery (spec §9): a horizontal teleprompter. The
 * "Selected work." title pins top-left inside the sticky stage — exactly as
 * About's "Who I am." does, which is what tells the visitor the scroll has
 * handed off from vertical to horizontal — and the cards pan through a focus
 * below it, one holding at a time.
 *
 * Every count is derived. The prototype numbered its cards 01-08 in markup while
 * its counter read `cards.length`, so the two could disagree; here both come off
 * `publishedWork`, and drafting a study changes them together.
 */
export function WorkGallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  /* useCallback, not an inline arrow: this is in useGallery's dep array, so a
     fresh identity every render would tear the effect down and re-measure the
     track on each one. */
  const onActiveIndex = useCallback((i: number) => setActiveIndex(i), []);

  useGallery({ wrapRef, trackRef, progressRef, active: true, onActiveIndex });

  /* Studies plus the earlier panel. Never written down. */
  const panelCount = publishedWork.length + 1;

  return (
    /* The landmark lands here for now; Task 9's work.tsx owns the region once
       the gallery and the index are two views of one section. */
    <div
      ref={wrapRef}
      className={styles.galleryWrap}
      role="region"
      aria-label={siteContent.work.region}
    >
      <div className={styles.stage}>
        {/* Pinned top-left inside the stage, so it stays put while the cards pan
            beneath it — the horizontal echo of About's "Who I am." The intro
            rides with it. */}
        <div className={styles.pinnedHead}>
          <h2 className={styles.title} id="work-title">
            {siteContent.titles.work}
          </h2>
          <p className={styles.intro}>{siteContent.work.intro}</p>
        </div>

        <div ref={trackRef} className={styles.track}>
          {publishedWork.map((study, i) => (
            <WorkCard key={study.slug} study={study} number={i + 1} />
          ))}
          <div data-work-panel style={{ opacity: 1 }}>
            <EarlierWork />
          </div>
        </div>

        <div className={styles.wayfinding}>
          <p className={styles.counter}>
            <b>{formatStudyNumber(activeIndex + 1)}</b>
            {siteContent.work.counterSeparator}
            <span data-total>{formatStudyNumber(panelCount)}</span>
          </p>
          {/* Decorative: it reports what the counter already says, so naming it
              for a screen reader would announce the same fact twice. */}
          <div className={styles.progress} data-progress aria-hidden="true">
            <i ref={progressRef} className={styles.progressFill} />
          </div>
        </div>
      </div>
    </div>
  );
}
