"use client";

import { useCallback, useRef, useState } from "react";
import { aboutPage } from "@/components/about/about-data";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useTeleprompter } from "@/components/about/use-teleprompter";
import styles from "@/components/about/about.module.css";

/**
 * About, the teleprompter (spec §8). A 640vh wrapper drives a sticky 100vh
 * stage; the statements translate through a fixed focal zone and resolve word
 * by word as they pass it.
 *
 * The copy — and which words land heavy — lives in content/site/about.mdx.
 * Nothing here knows the words.
 */
export function About() {
  const reduced = useReducedMotionPref();
  const wrapRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [activeStatement, setActiveStatement] = useState(0);
  const onActiveStatement = useCallback((i: number) => setActiveStatement(i), []);

  useTeleprompter({ wrapRef, columnRef, active: !reduced, onActiveStatement });

  return (
    <section
      className={styles.about}
      id="about"
      aria-labelledby="about-title"
      /* Under reduced motion the stage is inert: no sticky wrapper, no focal
         zone, every statement legible at once. CSS does the whole job off this
         attribute — never a post-hydration effect, which would flash the
         animated state first (spec §11). */
      data-static={reduced ? "" : undefined}
    >
      <div ref={wrapRef} className={styles.wrap}>
        <div className={styles.stage}>
          <h2 className={styles.title} id="about-title">
            {aboutPage.title}
          </h2>

          {/* Statements only. The prototype's #about-col holds four .ablocks
              and nothing else, and the handoff README says "a column of
              statement blocks" — there is no lede here.

              An earlier version rendered siteContent.about.lede at the top of
              this column, carried over from the parked design's About. It was
              not a [data-statement], so the hook never touched it: no blur, no
              fade, no focus falloff. It scrolled under "Who I am." at full
              contrast and collided with it. Anything inside this column must be
              a statement, or the focal zone does not apply to it. */}
          <div ref={columnRef} className={styles.column}>
            {aboutPage.statements.map((statement, i) => (
              /* The sentence is named ONCE, and the per-word spans are hidden
                 from assistive tech.

                 The words have to be separate elements — each one animates its
                 own colour and weight — and they carry no whitespace between
                 them, because the flex `column-gap` does the spacing and a real
                 space would separate a word from its punctuation (spec §5). The
                 cost is that the accessibility tree sees "I" "help" "teams" as
                 unrelated text runs.

                 A visually-hidden space between the spans does NOT fix that: it
                 puts spaces in `textContent`, so a test asserting on
                 `textContent` passes, while Chrome's accessibility tree still
                 contains zero whitespace nodes — verified. textContent is not
                 what a screen reader reads. Naming the sentence on the
                 paragraph and hiding the fragments is the standard fix, and it
                 is deterministic across assistive tech rather than depending on
                 how each one joins adjacent runs. */
              <p
                key={i}
                data-statement
                className={styles.statement}
                aria-label={statement.map((w) => w.text).join(" ")}
              >
                {statement.map((word, j) => (
                  <span key={j} data-word={word.role} aria-hidden="true" className={styles.word}>
                    {word.text}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <ol className={styles.rail} aria-label={siteContent.labels.aboutRail}>
            {aboutPage.statements.map((_, i) => (
              <li
                key={i}
                className={styles.dot}
                data-active={i === activeStatement ? "" : undefined}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
