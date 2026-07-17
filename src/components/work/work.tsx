"use client";

import { useState } from "react";
import { WorkGallery } from "@/components/work/work-gallery";
import { WorkIndex } from "@/components/work/work-index";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useNarrowViewport } from "@/lib/use-narrow-viewport";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

type View = "gallery" | "index";

/**
 * Work (spec §9): two views over one dataset.
 *
 * The gallery is the default and the index is the escape hatch the parked Cold
 * Noon shelf never had. If the gallery ever stops earning its place on the
 * pixels, the index is already built and this default is a one-word change.
 *
 * The index is also the automatic view when the gallery cannot serve: under
 * reduced motion (the gallery IS the motion) and on a narrow viewport (its
 * vertical-to-horizontal pan is a scroll trap on a phone). In both, offering a
 * toggle back into the gallery would offer what the context has ruled out — so
 * there is no toggle then, and the index is simply the section.
 *
 * The toggle is owned here and handed to whichever view renders, so the two
 * views place it consistently — top-right, opposite the section title — while
 * this component stays the single source of which view is showing.
 */
export function Work() {
  const reduced = useReducedMotionPref();
  const narrow = useNarrowViewport();
  const [view, setView] = useState<View>("gallery");

  const forced = reduced || narrow;
  const showing: View = forced ? "index" : view;

  const toggle = forced ? null : (
    /* A two-segment control: both views shown, the active one selected — so the
       alternative is visible, not hidden behind a label naming the other view.
       aria-pressed marks the active segment, the same treatment the filter pills
       use. */
    <div className={styles.viewToggle} role="group" aria-label={siteContent.work.viewToggleLabel}>
      <button
        type="button"
        className={styles.viewSegment}
        aria-pressed={showing === "gallery"}
        onClick={() => setView("gallery")}
      >
        {siteContent.work.galleryLabel}
      </button>
      <button
        type="button"
        className={styles.viewSegment}
        aria-pressed={showing === "index"}
        onClick={() => setView("index")}
      >
        {siteContent.work.indexLabel}
      </button>
    </div>
  );

  return (
    /* Each view renders its own #work-title (the gallery pins it, the index
       heads with it), so aria-labelledby always resolves to the visible one. */
    <section className={styles.work} id="work" aria-labelledby="work-title">
      {showing === "gallery" ? <WorkGallery toggle={toggle} /> : <WorkIndex toggle={toggle} />}
    </section>
  );
}
