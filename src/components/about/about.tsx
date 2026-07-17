"use client";

import { Fragment, useCallback, useRef, useState } from "react";
import { aboutPage } from "@/components/about/about-data";
import type { Word } from "@/components/about/statement-tokens";
import { takeHashClick } from "@/lib/scroll-nav";
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
            /* A real href — cmd-click, open-in-new-tab and copy-link all work,
               and the a11y tree announces a link. takeHashClick intercepts only
               the plain left-click on a same-page #hash and hands it to the same
               Lenis navigation the header's nav links use; anything else (an
               external URL, a modified click) falls through to the browser. */
            <a
              href={run.href}
              className={styles.link}
              onClick={(e) => takeHashClick(e, run.href!)}
            >
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
    /* No `data-static` here. It looked like the switch for the reduced-motion
       path and was read by nothing: about.module.css establishes that path with
       a plain `@media (prefers-reduced-motion: reduce)` query, which is what
       makes it correct at FIRST PAINT (spec §11) — an attribute could only ever
       arrive after hydration, having already flashed the animated state. The
       one [data-static] selector in the codebase is the site header's. */
    <section className={styles.about} id="about" aria-labelledby="about-title">
      <div ref={wrapRef} className={styles.wrap}>
        <div className={styles.stage}>
          <h2 className={styles.title} id="about-title">
            {aboutPage.title}
          </h2>

          {/* Statements only. The prototype's #about-col holds four .ablocks
              and nothing else, and the handoff README says "a column of
              statement blocks".

              This is a rule, not a preference: anything in this column that is
              not a [data-statement] is invisible to the hook, and so gets no
              blur, no fade and no focus falloff. An earlier version rendered a
              lede paragraph here, carried over from the parked design's About;
              it scrolled under "Who I am." at full contrast and collided with
              it. The lede has since been cut entirely — its copy said what
              statements 1 and 2 already say. */}
          <div ref={columnRef} className={styles.column}>
            {aboutPage.statements.map((statement, i) => (
              <Statement key={i} words={statement} />
            ))}
          </div>

          {/* Decorative: it reports which statement is in the focal zone and
              offers no way to act on it. It was announced as a list named "Jump
              to a statement" holding four EMPTY listitems — telling a screen
              reader user they could jump, then handing them nothing to jump
              with. The reading order it tracks is the statements themselves,
              which are already in the a11y tree, so the honest thing is to say
              nothing rather than to name a control that does not exist. Real
              jump controls would be a design change, not a fix. */}
          <ol className={styles.rail} aria-hidden="true">
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
