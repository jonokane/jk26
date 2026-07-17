"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { aboutPage } from "@/components/about/about-data";
import type { Word } from "@/components/about/statement-tokens";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useReservedWidths } from "@/components/about/use-reserved-widths";
import { useTeleprompter } from "@/components/about/use-teleprompter";
import styles from "@/components/about/about.module.css";

/** A run of words that render together: a link, or a stretch of plain text. */
interface Run {
  href?: string;
  words: Word[];
}

/**
 * Group consecutive words sharing an href into one run, so "Hit me up" is a
 * single <a> rather than three adjacent links — three would be three tab
 * stops and three announcements for one destination.
 */
function groupWords(words: Word[]): Run[] {
  const runs: Run[] = [];
  for (const word of words) {
    const last = runs[runs.length - 1];
    if (last && last.href === word.href) last.words.push(word);
    else runs.push({ href: word.href, words: [word] });
  }
  return runs;
}

/** The words, with a real space between each — see the note at the call site. */
function Words({ words }: { words: Word[] }) {
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span data-word={word.role} className={styles.word}>
            {word.text}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

/**
 * One statement. Each word is its own element because each animates its own
 * colour and weight — separated by REAL spaces, in normal inline flow.
 *
 * The prototype uses a flex row with a column-gap and no whitespace, because
 * its spans need punctuation to ride on the word. Our tokeniser attaches
 * punctuation at the data level, so real spaces cost nothing — and they are
 * what the clipboard, a find-in-page and a translation engine see. Under flex
 * the words computed to display:block and copying gave one word per line. The
 * spaces sit in this paragraph, not inside a word span: this block's weight
 * never animates, so the gaps stay put while the words move 400 -> 780.
 *
 * No aria-label, deliberately. One was added when the words had NO whitespace
 * between them and the accessibility tree saw "I" "help" "teams" as unrelated
 * runs. Real spaces made this ordinary inline markup — innerText now equals
 * the sentence exactly — so the label became redundant, and it actively
 * blocked links: aria-hidden fragments cannot contain a reachable <a>.
 */
function Statement({ words }: { words: Word[] }) {
  const runs = groupWords(words);
  return (
    <p data-statement className={styles.statement}>
      {runs.map((run, i) => (
        <Fragment key={i}>
          {run.href ? (
            <a href={run.href} className={styles.link}>
              <Words words={run.words} />
            </a>
          ) : (
            <Words words={run.words} />
          )}
          {i < runs.length - 1 ? " " : null}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * About, the teleprompter (spec §8). A 640vh wrapper drives a sticky 100vh
 * stage; the statements translate through a fixed focal zone and resolve word
 * by word as they pass it.
 *
 * The copy — which words land heavy, and any links — lives in
 * content/site/about.mdx. Nothing here knows the words.
 */
export function About() {
  const reduced = useReducedMotionPref();
  const wrapRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [activeStatement, setActiveStatement] = useState(0);
  const onActiveStatement = useCallback((i: number) => setActiveStatement(i), []);

  /* Before the teleprompter animates anything: the weights it lerps change the
     words' widths, so their boxes are pinned to the focused width first and the
     statement can never re-wrap under the animation. Inert under reduced
     motion, where no weight moves and there is nothing to pin. */
  useReservedWidths(columnRef, !reduced);
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
              <Statement key={i} words={statement} />
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
