import { describe, expect, it } from "vitest";
import { splitMarkdownSections } from "@/components/work/case-study-sections";

const body = `## Overview

First overview paragraph.

Second overview paragraph.

## The challenge

The hard part.

## What I did

The work.

## Outcome

What happened.
`;

describe("splitMarkdownSections", () => {
  it("splits a case study body into its `## ` sections, in document order", () => {
    expect(splitMarkdownSections(body).map((s) => s.heading)).toEqual([
      "Overview",
      "The challenge",
      "What I did",
      "Outcome",
    ]);
  });

  it("keeps every paragraph under a heading, and leaves the heading line out", () => {
    const [overview] = splitMarkdownSections(body);
    expect(overview.markdown).toBe("First overview paragraph.\n\nSecond overview paragraph.");
    expect(overview.markdown).not.toContain("##");
  });

  it("drops anything before the first heading (the whole body still renders it)", () => {
    const sections = splitMarkdownSections(`A stray lede.\n\n## Overview\n\nProse.\n`);
    expect(sections).toHaveLength(1);
    expect(sections[0].markdown).toBe("Prose.");
  });

  it("ignores `## ` inside a fenced code block", () => {
    const sections = splitMarkdownSections(
      "## Overview\n\n```\n## Not a heading\n```\n\n## Outcome\n\nEnd.\n",
    );
    expect(sections.map((s) => s.heading)).toEqual(["Overview", "Outcome"]);
    expect(sections[0].markdown).toContain("## Not a heading");
  });

  it("ignores deeper and shallower headings", () => {
    const sections = splitMarkdownSections("# Title\n\n## Overview\n\n### Detail\n\nProse.\n");
    expect(sections.map((s) => s.heading)).toEqual(["Overview"]);
    expect(sections[0].markdown).toContain("### Detail");
  });

  it("tolerates closing hashes and trailing space in a heading", () => {
    expect(splitMarkdownSections("##   Outcome   ##\n\nProse.\n")[0].heading).toBe("Outcome");
  });

  it("keeps a section with no prose rather than hiding a content bug", () => {
    const sections = splitMarkdownSections("## Overview\n\n## Outcome\n\nEnd.\n");
    expect(sections.map((s) => s.heading)).toEqual(["Overview", "Outcome"]);
    expect(sections[0].markdown).toBe("");
  });

  it("returns nothing for a body with no sections", () => {
    expect(splitMarkdownSections("Just prose.\n")).toEqual([]);
  });
});
