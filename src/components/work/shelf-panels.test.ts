import { describe, expect, it } from "vitest";
import {
  buildShelfPanels,
  firstPanelOfStudy,
  toPanelMeta,
  toStudyMeta,
  type PanelSource,
} from "@/components/work/shelf-panels";

function study(slug: string, title: string, headings = FULL_BODY): PanelSource {
  return {
    slug,
    title,
    sections: headings.map((heading) => ({ heading, body: `code:${slug}:${heading}` })),
  };
}

const FULL_BODY = ["Overview", "The challenge", "What I did", "Outcome"];
const studies = [study("a", "Alpha"), study("b", "Beta"), study("c", "Gamma")];

describe("buildShelfPanels", () => {
  const panels = buildShelfPanels(studies);

  it("gives every study four panels — three studies make twelve", () => {
    expect(panels).toHaveLength(12);
    expect(panels.every((p) => p.panelsInStudy === 4)).toBe(true);
  });

  it("orders them intro, Overview & The challenge, What I did, Outcome (spec §8)", () => {
    expect(panels.slice(0, 4).map((p) => p.label)).toEqual([
      "Intro",
      "Overview & The challenge",
      "What I did",
      "Outcome",
    ]);
  });

  it("numbers panels globally and positions them within their study", () => {
    expect(panels.map((p) => p.index)).toEqual([...Array(12).keys()]);
    expect(panels.slice(4, 8).map((p) => p.position)).toEqual([1, 2, 3, 4]);
    expect(panels[5].studyIndex).toBe(1);
    expect(panels[5].number).toBe(2);
  });

  it("marks the first panel of each study — the dot that starts a new group", () => {
    expect(panels.filter((p) => p.firstOfStudy).map((p) => p.index)).toEqual([0, 4, 8]);
  });

  it("carries only the intro panel as `intro`; the rest carry their sections", () => {
    expect(panels[0].kind).toBe("intro");
    expect(panels[0].sections).toEqual([]);
    expect(panels[1].sections.map((s) => s.heading)).toEqual(["Overview", "The challenge"]);
    expect(panels[2].sections.map((s) => s.body)).toEqual(["code:a:What I did"]);
  });

  it("writes the caption the shelf prints", () => {
    expect(panels[1].caption).toBe("Alpha — Overview & The challenge (2/4)");
    expect(panels[7].caption).toBe("Beta — Outcome (4/4)");
  });

  it("splits the caption after the study name, which the shelf sets apart", () => {
    expect(panels[1].captionRest).toBe(" — Overview & The challenge (2/4)");
    expect(panels[1].study.title + panels[1].captionRest).toBe(panels[1].caption);
  });

  it("hands the client panel meta without the compiled MDX behind it", () => {
    const meta = toPanelMeta(panels);
    expect(meta).toHaveLength(12);
    expect(meta[5]).toEqual({
      key: "b-2",
      index: 5,
      studyIndex: 1,
      slug: "b",
      title: "Beta",
      label: "Overview & The challenge",
      caption: "Beta — Overview & The challenge (2/4)",
      captionRest: " — Overview & The challenge (2/4)",
      firstOfStudy: false,
    });
    expect(toStudyMeta(studies)).toEqual([
      { slug: "a", title: "Alpha" },
      { slug: "b", title: "Beta" },
      { slug: "c", title: "Gamma" },
    ]);
  });

  it("keys panels uniquely across the whole shelf", () => {
    expect(new Set(panels.map((p) => p.key)).size).toBe(12);
  });

  it("matches headings case- and whitespace-insensitively", () => {
    const [, grouped] = buildShelfPanels([study("x", "X", ["  overview  ", "THE CHALLENGE"])]);
    expect(grouped.sections).toHaveLength(2);
  });

  it("gives a section no group claims its own panel at the end, rather than dropping it", () => {
    const panelsWithExtra = buildShelfPanels([study("x", "X", [...FULL_BODY, "Selected screens"])]);
    expect(panelsWithExtra).toHaveLength(5);
    expect(panelsWithExtra[4].label).toBe("Selected screens");
    expect(panelsWithExtra.every((p) => p.panelsInStudy === 5)).toBe(true);
  });

  it("still produces an intro panel for a study with no sections at all", () => {
    const empty = buildShelfPanels([study("x", "X", [])]);
    expect(empty).toHaveLength(1);
    expect(empty[0].caption).toBe("X — Intro (1/1)");
  });

  it("takes the studies it is given — a filtered (draft-free) list stays draft-free", () => {
    expect(panels.map((p) => p.study.slug)).not.toContain("draft");
  });
});

describe("firstPanelOfStudy", () => {
  const panels = buildShelfPanels(studies);

  it("is the study's intro panel — where a header study pill jumps", () => {
    expect(firstPanelOfStudy(panels, 0)).toBe(0);
    expect(firstPanelOfStudy(panels, 1)).toBe(4);
    expect(firstPanelOfStudy(panels, 2)).toBe(8);
  });

  it("falls back to the first panel for a study that is not on the shelf", () => {
    expect(firstPanelOfStudy(panels, 9)).toBe(0);
  });
});
