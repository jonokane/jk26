/**
 * Turning the About body's markdown into role-tagged words (spec §5) — pure,
 * so it is unit-testable and has no idea Velite or React exist (spec §14 house
 * style: keep the content-module dependency out of what's unit-tested).
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
  /**
   * Set on every word of a markdown link's text. Consecutive words sharing an
   * href render as ONE `<a>`, so "Hit me up" is one link and not three.
   *
   * A link is orthogonal to the role: `[Hit me up](#contact)` is ambient and
   * linked; `[**Hit me up**](#contact)` is emphasis and linked.
   */
  href?: string;
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

/**
 * `[text](href)`. Split first, so emphasis is then parsed *within* the link's
 * text and `[**Hit me up**](#contact)` composes.
 *
 * `split()` with two capture groups interleaves them, so the parts cycle
 * plain / link-text / href.
 */
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/**
 * An HTML comment. Velite hands us the raw markdown, which the statements
 * never run through an MDX compiler — so without this a commented-out
 * paragraph renders as body text, `<!--` and all, and adds phantom dots to the
 * rail. Stripped before the paragraph split so a commented block disappears
 * entirely rather than becoming a statement.
 */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

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
 * One run of `para.split(EMPHASIS)`, with the whitespace evidence its words no
 * longer carry. `wordsFrom` splits on `/\s+/`, which throws away whether a
 * token touched the chunk's edge or was separated from it by a space — and that
 * is exactly what decides where stray punctuation belongs.
 */
interface Chunk {
  words: Word[];
  /** The chunk's first character is not whitespace. */
  startsTight: boolean;
  /** The chunk's last character is not whitespace. */
  endsTight: boolean;
}

/**
 * Fold a lone punctuation token back onto the word it actually belongs to.
 *
 * `para.split(EMPHASIS)` breaks the paragraph at emphasis boundaries, so a
 * chunk edge can strand punctuation on its own: `"a past role (" ` (plain)
 * followed by `"Meta"` (emphasis) followed by `"), briefly"` (plain) each
 * split on whitespace, and the lone `"("` / `"),"` tokens that fall out
 * belong to "Meta", not to whichever word happens to sit next to them in flat
 * text order:
 *
 * - pure punctuation at the END of a chunk *opened* (the `(` in
 *   `role (**Meta**)`) — merge it FORWARD onto the next chunk's first word,
 *   taking that word's role, since the mark introduces the run.
 * - pure punctuation at the START of a chunk *closed* — merge it BACKWARD
 *   onto the previous word, keeping that word's role.
 *
 * ADJACENCY, not position, is the test. Position alone said the `—` in
 * `**shipped products** — with` was "closing" and glued it on as
 * `products—`; the mark is a word of its own there, and the only thing that
 * distinguishes it from the `)` in `(**Meta**),` is the space beside it. So a
 * merge happens only where the mark actually touches the text it would join.
 *
 * This still needs no character allowlist, which is the point: a straight `"`
 * is ambiguous by character — it could open or close — but never by adjacency.
 *
 * Pure, returns fresh `Word` objects; `chunks` and its contents are not
 * mutated.
 */
function attachEdgePunctuation(chunks: Chunk[]): Statement {
  const out: Word[] = [];
  let forwardCarry = "";

  chunks.forEach((chunk, i) => {
    const local = chunk.words.map((w) => ({ ...w }));

    if (forwardCarry && local.length > 0) {
      local[0] = { ...local[0], text: forwardCarry + local[0].text };
      forwardCarry = "";
    }

    if (
      chunk.startsTight &&
      local.length > 0 &&
      out.length > 0 &&
      PURE_PUNCTUATION.test(local[0].text)
    ) {
      out[out.length - 1] = {
        ...out[out.length - 1],
        text: out[out.length - 1].text + local[0].text,
      };
      local.shift();
    }

    /* Carry only onto a chunk whose own text touches the mark — `role (` into
       `**Meta**` does, `products **—** ` into ` with` would not. */
    if (
      chunk.endsTight &&
      chunks[i + 1]?.startsTight &&
      local.length > 0 &&
      PURE_PUNCTUATION.test(local[local.length - 1].text)
    ) {
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
 * the merge direction — so a comma never separates from the word it belongs
 * to, whatever the layout does with the gaps.
 *
 * Supported: `**bold**`, `*italic*`, `***both***`, `[text](href)`, and HTML
 * comments (stripped). The statements never pass through an MDX compiler —
 * the teleprompter needs per-word data, not compiled JSX — so this small
 * matcher is the whole of the syntax available in About copy.
 *
 * It is regex-based, not CommonMark, and knowingly does not handle:
 * - two stray single `*` in one paragraph, which parse as an italic pair
 *   (e.g. `"20%* to $5M*"` reads the `*`s as opening/closing a run).
 * - `**bold**text` with no space, which does not merge into one word
 *   (mid-word bolding is unsupported).
 * - inline code, images, reference links, or nested links.
 * These are inputs this matcher was never asked to parse, not silent
 * corruption the way the punctuation-direction and `***` bugs were — but an
 * unsupported construct WILL render literally, so it is visible immediately.
 */
export function tokeniseStatements(markdown: string): Statement[] {
  return markdown
    .replace(FRONTMATTER, "")
    .replace(HTML_COMMENT, "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const chunks: Chunk[] = [];
      /* split() with two capture groups interleaves them, so the parts cycle
         plain / link-text / href. Links are split FIRST so that emphasis is
         then parsed within the link's own text. */
      const parts = para.split(LINK);
      parts.forEach((part, i) => {
        const kind = i % 3;
        if (kind === 2 || !part) return; // 2 is the href, consumed with its text
        const href = kind === 1 ? parts[i + 1] : undefined;
        part
          .split(EMPHASIS)
          .filter(Boolean)
          .forEach((chunk) => {
            const words = classifyChunk(chunk);
            chunks.push({
              words: href ? words.map((w) => ({ ...w, href })) : words,
              /* Measured on the RAW chunk, markers and all: `**Meta**` starts
                 tight because `*` is not whitespace, which is the correct
                 reading — the marker is markup between two touching things. */
              startsTight: /^\S/.test(chunk),
              endsTight: /\S$/.test(chunk),
            });
          });
      });
      return attachEdgePunctuation(chunks);
    })
    .filter((s) => s.length > 0);
}
