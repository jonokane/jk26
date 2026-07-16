/**
 * Turning the About body's markdown into role-tagged words (spec §5) — pure,
 * so it is unit-testable and has no idea Velite or React exist (the
 * `splitMarkdownSections` house style, spec §14).
 *
 * Jono authors the statements as ordinary markdown paragraphs and marks the
 * words that should land heavy with `**bold**`. The teleprompter's per-word
 * emphasis therefore costs him no syntax he does not already know, and
 * changing which words hit never touches a component.
 */

export type WordRole = "ambient" | "emphasis" | "italic";

export interface Word {
  text: string;
  role: WordRole;
}

/** One paragraph, as the words the teleprompter animates. */
export type Statement = Word[];

/** `**bold**` or `*italic*`, non-greedy so adjacent runs do not merge. */
const EMPHASIS = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

/** A stray frontmatter block. Velite strips it, but a silent extra statement
 *  would be worse than a loud one if that ever changes. */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/** True once punctuation-only, no letters or digits — a lone comma, say. */
const PURE_PUNCTUATION = /^[^\p{L}\p{N}]+$/u;

function wordsFrom(run: string, role: WordRole): Word[] {
  return run
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, role }));
}

/**
 * Merge any word that is pure punctuation into its predecessor, keeping the
 * predecessor's role. `**Yahoo!**,` tokenises as the emphasis run
 * `**Yahoo!**` followed by the plain chunk `,` — splitting the plain chunk on
 * whitespace produces a lone `,` word that would render as a floating comma
 * (the spans have no whitespace between them; a flex column-gap does the
 * spacing). Folding it back onto "Yahoo!" restores "Yahoo!,".
 */
function attachTrailingPunctuation(words: Word[]): Word[] {
  const merged: Word[] = [];
  for (const word of words) {
    const prev = merged[merged.length - 1];
    if (prev && PURE_PUNCTUATION.test(word.text)) {
      prev.text += word.text;
    } else {
      merged.push({ ...word });
    }
  }
  return merged;
}

/**
 * Split a markdown body into statements, one per blank-line-separated
 * paragraph, each a flat run of role-tagged words.
 *
 * Punctuation stays attached to its word: the rendered spans sit in a flex row
 * with a `column-gap` and carry no whitespace between them, so a comma split
 * from its word would float on its own (the prototype writes `>love,` for the
 * same reason).
 */
export function tokeniseStatements(markdown: string): Statement[] {
  return markdown
    .replace(FRONTMATTER, "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const words: Word[] = [];
      /* split() with a capturing group interleaves the delimiters, so odd
         indices are the emphasis runs and even indices the plain text. */
      para.split(EMPHASIS).forEach((chunk) => {
        if (!chunk) return;
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          words.push(...wordsFrom(chunk.slice(2, -2), "emphasis"));
        } else if (chunk.startsWith("*") && chunk.endsWith("*")) {
          words.push(...wordsFrom(chunk.slice(1, -1), "italic"));
        } else {
          words.push(...wordsFrom(chunk, "ambient"));
        }
      });
      return attachTrailingPunctuation(words);
    })
    .filter((s) => s.length > 0);
}
