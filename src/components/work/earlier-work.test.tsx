import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { EarlierProject } from "#site/content";
import { siteContent } from "@/lib/site-content";

const entry = (over: Partial<EarlierProject> = {}) =>
  ({
    title: "Yahoo! Pattern Library",
    sector: ["Design Systems"],
    discipline: ["Front-end"],
    platform: [],
    role: "Design Lead",
    timeframe: "2007-13",
    view: "Archived",
    url: "/earlier/cinematiq",
    order: 1,
    ...over,
  }) as unknown as EarlierProject;

vi.mock("@/components/work/work-data", () => ({
  sortedEarlierWork: [
    entry(),
    entry({ title: "Shift", view: "https://shift.com", url: "/earlier/shift" }),
  ],
}));

const { EarlierWork } = await import("@/components/work/earlier-work");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);


describe("EarlierWork", () => {
  it("renders the locked heading from site-content", () => {
    render(<EarlierWork />);
    expect(screen.getByRole("heading", { name: siteContent.work.earlierTitle })).toBeTruthy();
  });

  it("renders every entry", () => {
    render(<EarlierWork />);
    expect(screen.getByText("Yahoo! Pattern Library")).toBeTruthy();
    expect(screen.getByText("Shift")).toBeTruthy();
  });

  /* Every title is an internal Link to the earlier detail url, regardless of
     whether `view` is a real URL — the external live link now lives inside the
     modal (Task 3), not the list. The list no longer branches on isViewUrl. */
  it("links every title to its earlier detail url, regardless of view", () => {
    const { container } = render(<EarlierWork />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(2);
    links.forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^\/earlier\//);
    });
  });

  /* The list no longer branches on isViewUrl: the title always links to the
     internal earlier detail url, never out to the external `view`. */
  it("links every title to its earlier detail url, not the external view", () => {
    const { container } = render(<EarlierWork />);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toMatch(/^\/earlier\//);
  });

  /* Spec §9: this panel is a LIST, not the card grid it used to be — no MDX
     body. The body still renders on /work/[slug]; here it would not fit the
     panel and would make the track immeasurably wide. */
  it("renders no MDX body", () => {
    const { container } = render(<EarlierWork />);
    expect(container.querySelector("[data-mdx]")).toBeNull();
  });

  it("renders each entry's attributes as one line", () => {
    render(<EarlierWork />);
    /* getAllByText, not getByText: both mock entries share the default sector
       and discipline (only title/view are overridden for "Shift"), so either
       string legitimately matches twice. */
    /* Design Systems is the sector, Front-end the discipline — both still in
       the compact meta; role (Design Lead) and platform are no longer shown. */
    expect(screen.getAllByText(/Design Systems/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Front-end/).length).toBeGreaterThan(0);
  });
});
