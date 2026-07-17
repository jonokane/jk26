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

          <div ref={columnRef} className={styles.column}>
            <p className={styles.lede}>{aboutPage.lede}</p>
            {aboutPage.statements.map((statement, i) => (
              <p key={i} data-statement className={styles.statement}>
                {statement.map((word, j) => (
                  <span key={j} data-word={word.role} className={styles.word}>
                    {word.text}
                    {/* A real space character, so the paragraph still reads as one
                        sentence to a screen reader, but visually hidden: the
                        flex row's column-gap already spaces the words, and a
                        visible space here would double it (spec §5). */}
                    {j < statement.length - 1 && (
                      <span className={styles.wordGap}> </span>
                    )}
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
