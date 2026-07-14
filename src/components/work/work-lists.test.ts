import { describe, expect, it } from "vitest";
import {
  formatStudyNumber,
  nextStudy,
  selectPublishedWork,
  sortByOrder,
  studyNumber,
} from "@/components/work/work-lists";

// Minimal fixtures — only the fields selectPublishedWork/nextStudy/studyNumber
// actually touch. Cast through `unknown` so the fixtures don't have to satisfy
// every field of the real (much larger) CaseStudy schema.
type Fixture = { slug: string; order: number; draft: boolean };

function study(slug: string, order: number, draft = false): Fixture {
  return { slug, order, draft };
}

const studies = [study("c", 3), study("draft", 0, true), study("a", 1), study("b", 2)];

describe("selectPublishedWork", () => {
  it("excludes draft studies", () => {
    const published = selectPublishedWork(studies as never);
    expect(published.some((s) => s.slug === "draft")).toBe(false);
  });

  it("sorts the remaining studies by order ascending", () => {
    const published = selectPublishedWork(studies as never);
    expect(published.map((s) => s.slug)).toEqual(["a", "b", "c"]);
  });

  it("never mutates the input array", () => {
    const input = [...studies];
    selectPublishedWork(input as never);
    expect(input.map((s) => s.slug)).toEqual(studies.map((s) => s.slug));
  });
});

describe("sortByOrder", () => {
  it("sorts ascending without a draft concept", () => {
    const items = [{ order: 2 }, { order: 0 }, { order: 1 }];
    expect(sortByOrder(items).map((i) => i.order)).toEqual([0, 1, 2]);
  });
});

describe("nextStudy", () => {
  const published = selectPublishedWork(studies as never);

  it("returns the following study in sequence", () => {
    expect(nextStudy(published, "a")?.slug).toBe("b");
  });

  it("returns undefined after the last study", () => {
    expect(nextStudy(published, "c")).toBeUndefined();
  });

  it("returns undefined for a slug not in the list (e.g. a draft)", () => {
    expect(nextStudy(published, "draft")).toBeUndefined();
  });
});

describe("studyNumber", () => {
  const published = selectPublishedWork(studies as never);

  it("is the 1-based position in the published, order-sorted list", () => {
    expect(studyNumber(published, "a")).toBe(1);
    expect(studyNumber(published, "b")).toBe(2);
    expect(studyNumber(published, "c")).toBe(3);
  });
});

describe("formatStudyNumber", () => {
  it("pads single digits to two", () => {
    expect(formatStudyNumber(1)).toBe("01");
    expect(formatStudyNumber(12)).toBe("12");
  });
});
