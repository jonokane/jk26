"use client";

import { Fragment, useCallback, useRef, useState } from "react";
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
              /* Each word is its own element because each animates its own
                 colour and weight — but they are separated by REAL spaces, in
                 normal inline flow.
                 The prototype uses a flex row with a column-gap and no
                 whitespace, because its spans need punctuation to ride on the
                 word. Our tokeniser already attaches punctuation at the data
                 level, so real spaces cost nothing — and they are what a copy,
                 a find-in-page and a translation engine actually see. With flex
                 the words computed to display:block and copying a statement
                 produced one word per line.
                 The space sits in the paragraph, not inside a word span: this
                 block's weight never animates, so the gap stays put while the
                 words move 400 -> 780.

                 The sentence is still named ONCE and the fragments hidden.
                 Screen readers read the accessibility tree, which saw "I"
                 "help" "teams" as unrelated runs; note that a visually-hidden
                 space did NOT fix that — it put spaces in textContent, so a
                 test on textContent passed while the tree still held zero
                 whitespace nodes. textContent is not what a screen reader
                 reads, and it is not what the clipboard reads either. Three
                 pipelines, three checks. */
              <p
                key={i}
                data-statement
                className={styles.statement}
                aria-label={statement.map((w) => w.text).join(" ")}
              >
                {statement.map((word, j) => (
                  <Fragment key={j}>
                    <span data-word={word.role} aria-hidden="true" className={styles.word}>
                      {word.text}
                    </span>
                    {j < statement.length - 1 ? " " : null}
                  </Fragment>
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
