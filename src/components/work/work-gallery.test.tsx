import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string, order: number) =>
  ({
    title,
    order,
    year: 2024,
    impact: `${title} impact.`,
    tags: [],
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [study("Alpha", 1), study("Beta", 2)],
  sortedEarlierWork: [],
}));

const { WorkGallery } = await import("@/components/work/work-gallery");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);

describe("WorkGallery", () => {
  it("renders one card per published study", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelectorAll("[data-work-card]")).toHaveLength(2);
  });

  /* Prototype gap 4: card numbers 01-08 were hardcoded in markup while the
     counter was live off cards.length, so they could disagree. Both derive from
     the same list now.

     Scoped to the cards rather than screen.getByText: the counter renders the
     ACTIVE number, which is "01" at rest, so an unscoped query for "01" matches
     the counter as well as the first card and fails on the ambiguity. Reading
     the numbers out of the cards themselves is what this test actually means. */
  it("numbers the cards from the data, not from markup", () => {
    const { container } = render(<WorkGallery />);
    const numbers = [...container.querySelectorAll("[data-work-card]")].map(
      (card) => card.querySelector("[class*='num']")?.textContent,
    );
    expect(numbers).toEqual(["01", "02"]);
  });

  /* The panel count is studies + the earlier panel, and is never written down:
     2 studies + 1 panel = 03. When Tappa and the Meta studies come off draft
     this becomes 08 with no code change. */
  it("counts the earlier panel in the total", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelector("[data-total]")?.textContent).toBe("03");
    expect(container.querySelectorAll("[data-work-panel]")).toHaveLength(1);
  });

  it("names the gallery landmark from site-content", () => {
    render(<WorkGallery />);
    expect(screen.getByRole("region", { name: siteContent.work.region })).toBeTruthy();
  });

  /* The progress bar reports the same thing the counter does, so it is noise to
     a screen reader. */
  it("hides the progress bar from assistive tech", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelector("[data-progress]")?.getAttribute("aria-hidden")).toBe("true");
  });
});
