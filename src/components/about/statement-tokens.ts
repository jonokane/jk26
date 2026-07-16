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

/**
 * `***bold italic***`, `**bold**`, or `*italic*` — longest-first so
 * `***x***` matches whole. Without the `***` alternative, matching against
 * `**[^*]+\*\*` first lands one character in, leaving a stray `*` orphaned on
 * each side that then merges into neighbouring words as a literal asterisk.
 */
const EMPHASIS = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;

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
 * Classify one chunk of `para.split(EMPHASIS)` into its words. Order matters:
 * a `***bold italic***` chunk also satisfies `startsWith("**")`, so the
 * triple-asterisk case must be checked first or it is read as `**` with two
 * stray asterisks left inside the word. Bold+italic has no combined role in
 * the role table, so it collapses to `emphasis` — the heavier, more honest
 * reading of "the author reached for both".
 */
function classifyChunk(chunk: string): Word[] {
  if (chunk.startsWith("***") && chunk.endsWith("***")) {
    return wordsFrom(chunk.slice(3, -3), "emphasis");
  }
  if (chunk.startsWith("**") && chunk.endsWith("**")) {
    return wordsFrom(chunk.slice(2, -2), "emphasis");
  }
  if (chunk.startsWith("*") && chunk.endsWith("*")) {
    return wordsFrom(chunk.slice(1, -1), "italic");
  }
  return wordsFrom(chunk, "ambient");
}

/**
 * Fold a lone punctuation token back onto the word it actually belongs to.
 *
 * `para.split(EMPHASIS)` breaks the paragraph at emphasis boundaries, so a
 * chunk edge can strand punctuation on its own: `"a past role (" ` (plain)
 * followed by `"Meta"` (emphasis) followed by `"), briefly"` (plain) each
 * split on whitespace, and the lone `"("` / `"),"` tokens that fall out
 * belong to "Meta", not to whichever word happens to sit next to them in flat
 * text order. The direction is positional, not character-based:
 *
 * - pure punctuation at the END of a chunk, with a chunk following it,
 *   *opened* (the `(` in `role (**Meta**)`) — merge it FORWARD onto the next
 *   chunk's first word, taking that word's role, since the mark is visually
 *   part of the run it introduces.
 * - pure punctuation at the START of a chunk, with a previous word already
 *   emitted, *closed* — merge it BACKWARD onto that previous word, keeping
 *   its role.
 *
 * This handles `(`/`)`/`[`/`]` and straight quotes without a character
 * allowlist: a straight `"` is ambiguous by character (it could open or
 * close) but never by position.
 *
 * Pure, returns fresh `Word` objects; `chunks` and its contents are not
 * mutated.
 */
function attachEdgePunctuation(chunks: Word[][]): Statement {
  const out: Word[] = [];
  let forwardCarry = "";

  chunks.forEach((chunkWords, i) => {
    const local = chunkWords.map((w) => ({ ...w }));

    if (forwardCarry && local.length > 0) {
      local[0] = { ...local[0], text: forwardCarry + local[0].text };
      forwardCarry = "";
    }

    if (local.length > 0 && out.length > 0 && PURE_PUNCTUATION.test(local[0].text)) {
      out[out.length - 1] = {
        ...out[out.length - 1],
        text: out[out.length - 1].text + local[0].text,
      };
      local.shift();
    }

    const hasNextChunk = i < chunks.length - 1;
    if (hasNextChunk && local.length > 0 && PURE_PUNCTUATION.test(local[local.length - 1].text)) {
      forwardCarry = local.pop()!.text;
    }

    out.push(...local);
  });

  /* A carry left dangling (an opening mark with no following chunk to land
     on — a paragraph ending mid-emphasis, which authored copy should never
     do) is emitted as its own ambient word rather than silently dropped. */
  if (forwardCarry) {
    out.push({ text: forwardCarry, role: "ambient" });
  }

  return out;
}

/**
 * Split a markdown body into statements, one per blank-line-separated
 * paragraph, each a flat run of role-tagged words.
 *
 * Punctuation stays attached to its word — see `attachEdgePunctuation` for
 * the merge direction — because the rendered spans sit in a flex row with a
 * `column-gap` and carry no whitespace between them, so a comma split from
 * its word would float on its own (the prototype writes `>love,` for the
 * same reason).
 *
 * This is a regex-based matcher, not CommonMark, and knowingly does not
 * handle every edge a full parser would:
 * - two stray single `*` in one paragraph parse as an italic pair (e.g.
 *   `"20%* to $5M*"` reads the `*`s as opening/closing an italic run, not as
 *   two literal asterisks).
 * - `**bold**text` with no space does not merge into one word — the boundary
 *   between the emphasis run and the trailing text is a token break, so
 *   "bold" and "text" render as two separate words (mid-word bolding is
 *   unsupported).
 * - markdown links and inline code are not recognised at all; they pass
 *   through literally (brackets, parens, backticks and all) and fragment on
 *   their own internal whitespace.
 * None of these are silent corruption the way the punctuation-direction and
 * `***` bugs were — they're inputs this matcher was never asked to parse —
 * but whoever writes About copy should avoid them.
 */
export function tokeniseStatements(markdown: string): Statement[] {
  return markdown
    .replace(FRONTMATTER, "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      /* split() with a capturing group interleaves the delimiters, so odd
         indices are the emphasis runs and even indices the plain text. */
      const chunks = para.split(EMPHASIS).filter(Boolean).map(classifyChunk);
      return attachEdgePunctuation(chunks);
    })
    .filter((s) => s.length > 0);
}
