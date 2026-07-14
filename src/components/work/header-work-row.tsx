"use client";

import { motion } from "motion/react";
import { shelfLabels } from "@/components/work/shelf-labels";
import { useShelfState } from "@/components/work/shelf-store";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import styles from "@/components/site-header.module.css";

/** The name's spring re-pop on a study change (spec §6). */
const POP = { type: "spring", stiffness: 520, damping: 26, mass: 0.6 } as const;

/**
 * The nav pill's second row (spec §6): the case study the reader is on, the
 * panel they are on inside it, and pills to jump between studies. It grows open
 * while the shelf holds the viewport and collapses when it lets go.
 *
 * It reads the shelf through `shelf-store`, not props: the header and the Work
 * section are siblings under `app/page.tsx`, and a page that exists to compose
 * sections is the wrong place to grow a context provider. When there is no
 * shelf — `/work/[slug]`, reduced motion, before hydration — the store is empty,
 * `active` is false, and this row is simply closed.
 */
export function HeaderWorkRow() {
  const { active, index, panels, studies, jumpToStudy } = useShelfState();
  const reducedMotion = useReducedMotionPref();
  const panel = panels[index];

  return (
    <div className={styles.work} aria-hidden={!active}>
      <div className={styles.workInner}>
        <div className={styles.row}>
          {panel && (
            <motion.span
              /* keyed by study: a new study remounts the name, which is what
                 makes it re-pop rather than cross-fade */
              key={panel.slug}
              className={`heading-display ${styles.project}`}
              initial={reducedMotion ? false : { scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reducedMotion ? { duration: 0 } : POP}
            >
              {panel.title}
            </motion.span>
          )}

          <span className={styles.panel} data-visible={panel?.firstOfStudy ? undefined : ""}>
            {panel?.label}
          </span>

          <ul className={styles.pills} aria-label={shelfLabels.studyPills}>
            {studies.map((study, studyIndex) => (
              <li key={study.slug}>
                <button
                  type="button"
                  className={styles.pill}
                  aria-current={panel?.studyIndex === studyIndex ? "true" : undefined}
                  /* not focusable while the row is closed: it is aria-hidden,
                     and a focusable node inside aria-hidden is an a11y fault */
                  tabIndex={active ? 0 : -1}
                  onClick={() => jumpToStudy(studyIndex)}
                >
                  {study.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
