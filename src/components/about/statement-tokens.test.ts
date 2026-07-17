import { describe, expect, it } from "vitest";
import { tokeniseStatements, type Statement } from "@/components/about/statement-tokens";

const text = (s: Statement) => s.map((w) => w.text).join(" ");
const roles = (s: Statement) => s.map((w) => w.role);

describe("tokeniseStatements", () => {
  it("splits blank-line-separated paragraphs into statements", () => {
    const out = tokeniseStatements("First one here.\n\nSecond one here.");
    expect(out).toHaveLength(2);
    expect(text(out[0])).toBe("First one here.");
    expect(text(out[1])).toBe("Second one here.");
  });

  it("treats unmarked words as ambient", () => {
    expect(roles(tokeniseStatements("plain words")[0])).toEqual(["ambient", "ambient"]);
  });

  it("marks **bold** as emphasis and *italic* as italic", () => {
    const out = tokeniseStatements("I work at **Meta** and *maybe* elsewhere")[0];
    expect(out.map((w) => [w.text, w.role])).toEqual([
      ["I", "ambient"], ["work", "ambient"], ["at", "ambient"],
      ["Meta", "emphasis"], ["and", "ambient"],
      ["maybe", "italic"], ["elsewhere", "ambient"],
    ]);
  });

  /* The prototype's markup carries punctuation ON the word — `data-role="e"
     >love,` — because the spans are laid out with a flex column-gap and have
     no whitespace between them. A word split from its comma would render a
     floating comma. */
  it("keeps punctuation attached to its word, inside and outside the emphasis", () => {
    const out = tokeniseStatements("**Yahoo!**, Amazon, and **Meta**.")[0];
    expect(out.map((w) => w.text)).toEqual(["Yahoo!,", "Amazon,", "and", "Meta."]);
    expect(out.map((w) => w.role)).toEqual(["emphasis", "ambient", "ambient", "emphasis"]);
  });

  it("handles a multi-word emphasis run", () => {
    const out = tokeniseStatements("**Available now** for work")[0];
    expect(out.map((w) => [w.text, w.role])).toEqual([
      ["Available", "emphasis"], ["now", "emphasis"],
      ["for", "ambient"], ["work", "ambient"],
    ]);
  });

  it("collapses newlines inside a paragraph — a wrapped line is one statement", () => {
    const out = tokeniseStatements("one two\nthree four");
    expect(out).toHaveLength(1);
    expect(text(out[0])).toBe("one two three four");
  });

  it("ignores blank input rather than emitting an empty statement", () => {
    expect(tokeniseStatements("")).toEqual([]);
    expect(tokeniseStatements("\n\n   \n\n")).toEqual([]);
  });

  /* Velite strips frontmatter before handing us `content` (verified against
     velite's matter loader: `value.slice(match[0].length).trim()`), so a
     leading `---` block should never arrive. If the loader ever changes, a
     silent extra statement is far worse than a loud one. */
  it("does not treat a stray frontmatter block as a statement", () => {
    const out = tokeniseStatements("---\ntitle: x\n---\n\nReal statement.");
    expect(out).toHaveLength(1);
    expect(text(out[0])).toBe("Real statement.");
  });

  it("merges opening punctuation forward into the emphasis word it precedes", () => {
    const out = tokeniseStatements("a past role (**Meta**), briefly")[0];
    expect(out.map((w) => w.text)).toEqual(["a", "past", "role", "(Meta),", "briefly"]);
    expect(out.map((w) => w.role)).toEqual([
      "ambient", "ambient", "ambient", "emphasis", "ambient",
    ]);
  });

  it("merges a leading quote forward and a trailing quote backward around an italic word", () => {
    const out = tokeniseStatements('she said "*maybe*" and left')[0];
    expect(out.map((w) => w.text)).toEqual(["she", "said", '"maybe"', "and", "left"]);
    expect(out.map((w) => w.role)).toEqual([
      "ambient", "ambient", "italic", "ambient", "ambient",
    ]);
  });

  it("treats ***triple*** asterisks as a whole emphasis run with no literal asterisks left over", () => {
    const out = tokeniseStatements("This is ***very*** important.")[0];
    expect(out.map((w) => w.text)).toEqual(["This", "is", "very", "important."]);
    expect(out.map((w) => w.role)).toEqual(["ambient", "ambient", "emphasis", "ambient"]);
  });

  it("never leaves a literal asterisk in any word's text, across a multi-emphasis paragraph", () => {
    const out = tokeniseStatements(
      "A **bold** word, an *italic* word, and ***both*** together.",
    )[0];
    for (const word of out) {
      expect(word.text).not.toContain("*");
    }
  });
});

/* The About copy's emphasis marks are a DESIGN decision the prototype already
   made — not a judgment for whoever edits the file. This pins the intent that
   is checkable without reading .velite: statement 1 uses the italic role, and
   the heavy words are the prototype's.
   The full word-by-word diff against the prototype's own data-role markup
   lives in the phase's verification, since it needs the compiled collection
   and no test here may import #site/content. */
describe("the About copy's emphasis marks match the prototype", () => {
  const st1 =
    "I help teams build products people **love,** spanning **design,** product management, **strategy,** and hands-on building to turn *concept* and *vision* into **shipped products.**";

  it("marks exactly the prototype's heavy words in statement 1", () => {
    const marked = tokeniseStatements(st1)[0]
      .filter((w) => w.role !== "ambient")
      .map((w) => `${w.text}/${w.role[0]}`);
    expect(marked).toEqual([
      "love,/e", "design,/e", "strategy,/e", "concept/i", "vision/i", "shipped/e", "products./e",
    ]);
  });

  /* `product management` is AMBIENT in the prototype. An earlier draft of the
     content bolded it, diluting the "field of green with black bold hits". */
  it("leaves product management ambient", () => {
    const w = tokeniseStatements(st1)[0].find((x) => x.text === "management,");
    expect(w?.role).toBe("ambient");
  });
});

describe("links", () => {
  it("tags every word of a link with its href, keeping the ambient role", () => {
    const out = tokeniseStatements("Say hi via [Hit me up](#contact) today.")[0];
    expect(out.map((w) => [w.text, w.role, w.href ?? null])).toEqual([
      ["Say", "ambient", null],
      ["hi", "ambient", null],
      ["via", "ambient", null],
      ["Hit", "ambient", "#contact"],
      ["me", "ambient", "#contact"],
      ["up", "ambient", "#contact"],
      ["today.", "ambient", null],
    ]);
  });

  /* A link is orthogonal to the role, so emphasis inside one composes. */
  it("keeps emphasis inside a link", () => {
    const out = tokeniseStatements("[**Hit me up**](#contact)")[0];
    expect(out.every((w) => w.href === "#contact")).toBe(true);
    expect(out.every((w) => w.role === "emphasis")).toBe(true);
  });

  it("leaves no bracket or paren in the rendered text", () => {
    for (const w of tokeniseStatements("a [link here](#x) and [another](https://e.com) b")[0]) {
      expect(w.text).not.toMatch(/[[\]()]/);
    }
  });

  it("carries an absolute href through unchanged", () => {
    const out = tokeniseStatements("see [Collaya](https://collaya.com) now")[0];
    expect(out.find((w) => w.text === "Collaya")?.href).toBe("https://collaya.com");
  });

  it("attaches punctuation after a link to the link's last word", () => {
    const out = tokeniseStatements("ask [me](#contact), please")[0];
    const me = out.find((w) => w.text.startsWith("me"));
    expect(me?.text).toBe("me,");
    expect(me?.href).toBe("#contact");
  });
});

describe("html comments", () => {
  /* The statements never pass through an MDX compiler, so without stripping
     these a commented-out paragraph renders as body text — `<!--` and all —
     and adds phantom dots to the rail. */
  it("drops a commented-out paragraph entirely", () => {
    const out = tokeniseStatements("Real one.\n\n<!-- Hidden one.\n\nAlso hidden. -->\n\nSecond real.");
    expect(out).toHaveLength(2);
    expect(out.map((s) => s.map((w) => w.text).join(" "))).toEqual(["Real one.", "Second real."]);
  });

  it("leaves no comment marker in the text", () => {
    for (const st of tokeniseStatements("a <!-- x --> b")) {
      for (const w of st) expect(w.text).not.toMatch(/<!--|-->/);
    }
  });
});

