/**
 * Sectioning a case study body (spec §9) — pure, so it is unit-testable and
 * has no idea Velite or React exist (the `wordmark-engine.ts` house style,
 * spec §15).
 *
 * A case study's MDX body is a sequence of `## ` sections — `## Overview`,
 * `## The challenge`, `## What I did`, `## Outcome`, optionally more. The
 * vertical read (`CaseStudyArticle`, `/work/[slug]`) renders the body whole;
 * the shelf (spec §8) needs the same prose split into panels. Splitting the
 * *compiled* MDX is not possible — it is a minified function body — so the
 * split happens on the raw markdown at build time, in `velite.config.ts`,
 * and each section is compiled to its own MDX component alongside the whole
 * body. One source of truth (the .mdx file), two shapes.
 */

/** One `## ` section of a case study body: its heading, and the markdown under it. */
export interface RawSection {
  /** The heading text, verbatim — "Overview", "The challenge", … */
  heading: string;
  /** Everything below the heading, up to the next `## ` (or the end). */
  markdown: string;
}

/** Matches a level-2 ATX heading at the start of a line: `## The challenge`. */
const HEADING = /^##[ \t]+(.+?)[ \t]*#*[ \t]*$/;

/** Fenced code blocks: ``` or ~~~, so a `## ` inside one is never a heading. */
const FENCE = /^[ \t]*(```|~~~)/;

/**
 * Split a raw markdown body into its `## ` sections, in document order.
 *
 * Anything before the first `## ` (a lede paragraph, say) is dropped: the
 * panels are built from named sections, and the whole body still renders
 * verbatim in the vertical read. Sections with no prose under them are kept —
 * an empty panel is a content bug worth seeing, not one worth hiding.
 */
export function splitMarkdownSections(markdown: string): RawSection[] {
  const sections: RawSection[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  let inFence = false;

  for (const line of markdown.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;

    const match = inFence ? null : HEADING.exec(line);
    if (match) {
      if (current) sections.push(finish(current));
      current = { heading: match[1], lines: [] };
      continue;
    }
    current?.lines.push(line);
  }
  if (current) sections.push(finish(current));

  return sections;
}

function finish(section: { heading: string; lines: string[] }): RawSection {
  return { heading: section.heading, markdown: section.lines.join("\n").trim() };
}
