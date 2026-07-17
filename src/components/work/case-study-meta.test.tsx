import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { CaseStudyMeta } from "@/components/work/case-study-meta";

const study = (over: Partial<CaseStudy> = {}) =>
  ({
    title: "Alpha",
    client: "Acme",
    role: "Lead",
    sector: ["Music"],
    discipline: ["Product Design"],
    platform: ["Web"],
    timeframe: "2024",
    view: "https://example.com",
    ...over,
  }) as unknown as CaseStudy;

/* No global afterEach is registered (vitest.config.ts has no test.globals),
   so Testing Library never auto-cleans — every render-based test in this repo
   does this explicitly. */
afterEach(cleanup);

describe("CaseStudyMeta", () => {
  it("renders a term/description pair for every attribute", () => {
    const { container } = render(<CaseStudyMeta study={study()} />);
    const terms = container.querySelectorAll("dl dt");
    const values = container.querySelectorAll("dl dd");
    expect(terms.length).toBe(7);
    expect(values.length).toBe(7);
    expect(screen.getByText("Acme")).toBeTruthy();
  });

  it("makes the View value a link when it is a URL", () => {
    const { container } = render(<CaseStudyMeta study={study()} />);
    const link = container.querySelector("dd a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
  });

  it("renders the View value as plain text when it is not a URL", () => {
    const { container } = render(<CaseStudyMeta study={study({ view: "Archived" })} />);
    expect(container.querySelector("dd a")).toBeNull();
    expect(screen.getByText("Archived")).toBeTruthy();
  });
});
