import { describe, expect, it } from "vitest";
import type { CaseStudy } from "#site/content";
import {
  NO_FILTER,
  applyFilter,
  facetValues,
  isFilterActive,
} from "@/components/work/work-filters";

/* Only the fields the filter reads. The cast keeps the fixture honest about
   that: a filter that needs more than this is doing too much. */
const study = (title: string, sector: string[], discipline: string[]) =>
  ({ title, sector, discipline }) as unknown as CaseStudy;

const STUDIES = [
  study("A", ["Music", "AI"], ["Product Design"]),
  study("B", ["Music"], ["Design Systems", "Product Design"]),
  study("C", ["Automotive"], ["Front-end"]),
];

describe("facetValues", () => {
  it("is every distinct value across the studies, sorted", () => {
    expect(facetValues(STUDIES, "sector")).toEqual(["AI", "Automotive", "Music"]);
  });

  it("does not repeat a value two studies share", () => {
    expect(facetValues(STUDIES, "discipline")).toEqual([
      "Design Systems",
      "Front-end",
      "Product Design",
    ]);
  });

  /* Facets are derived from frontmatter (spec §9: "no new content"), so a study
     drafted or added changes the filter bar with no code edit. */
  it("is empty when there are no studies", () => {
    expect(facetValues([], "sector")).toEqual([]);
  });
});

describe("applyFilter", () => {
  it("returns every study when nothing is selected", () => {
    expect(applyFilter(STUDIES, NO_FILTER)).toHaveLength(3);
  });

  it("keeps a study holding the value anywhere in its array", () => {
    expect(applyFilter(STUDIES, { sector: "Music", discipline: null }).map((s) => s.title)).toEqual([
      "A",
      "B",
    ]);
  });

  /* Two facets are AND, not OR: picking Music and Front-end asks for a study
     that is both, and there is none. An OR here would look like the filter was
     ignored. */
  it("ANDs the two facets", () => {
    expect(applyFilter(STUDIES, { sector: "Music", discipline: "Front-end" })).toEqual([]);
    expect(
      applyFilter(STUDIES, { sector: "Music", discipline: "Product Design" }).map((s) => s.title),
    ).toEqual(["A", "B"]);
  });

  it("preserves the incoming order, which is the study numbering", () => {
    expect(applyFilter(STUDIES, { sector: null, discipline: "Product Design" }).map((s) => s.title))
      .toEqual(["A", "B"]);
  });

  it("does not mutate the input", () => {
    const copy = [...STUDIES];
    applyFilter(STUDIES, { sector: "Music", discipline: null });
    expect(STUDIES).toEqual(copy);
  });
});

describe("isFilterActive", () => {
  it("is false only when neither facet is chosen", () => {
    expect(isFilterActive(NO_FILTER)).toBe(false);
    expect(isFilterActive({ sector: "Music", discipline: null })).toBe(true);
    expect(isFilterActive({ sector: null, discipline: "Front-end" })).toBe(true);
  });
});
