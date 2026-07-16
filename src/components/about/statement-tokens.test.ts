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
});
