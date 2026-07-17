import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string, sector: string[], discipline: string[]) =>
  ({
    title,
    sector,
    discipline,
    year: 2024,
    order: 1,
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [
    study("Alpha", ["Music"], ["Product Design"]),
    study("Beta", ["Automotive"], ["Front-end"]),
  ],
}));

const { WorkIndex } = await import("@/components/work/work-index");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);


describe("WorkIndex", () => {
  it("renders one row per study, each linking to its page", () => {
    const { container } = render(<WorkIndex />);
    const links = container.querySelectorAll("[data-work-row] a");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/work/alpha");
  });

  /* Facets are derived from frontmatter (spec §9), so a new study changes the
     bar with no code edit. */
  it("offers a filter pill for every distinct facet value in the data", () => {
    render(<WorkIndex />);
    expect(screen.getByRole("button", { name: "Sector: Music" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sector: Automotive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Discipline: Front-end" })).toBeTruthy();
  });

  /* The pill is a toggle, so it must SAY it is one. aria-pressed is the whole
     difference between "a button called Music" and "a filter that is on". */
  it("reports each pill's pressed state", () => {
    render(<WorkIndex />);
    const music = screen.getByRole("button", { name: "Sector: Music" });
    expect(music.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(music);
    expect(music.getAttribute("aria-pressed")).toBe("true");
  });

  it("filters the rows when a sector pill is pressed", () => {
    const { container } = render(<WorkIndex />);
    fireEvent.click(screen.getByRole("button", { name: "Sector: Music" }));
    const rows = container.querySelectorAll("[data-work-row]");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Alpha");
  });

  /* Clicking the pressed pill again clears it — the same gesture that set it.
     Without this the only way out is the clear button, which is a dead end for
     anyone who does not notice it. */
  it("clears a facet when its pressed pill is clicked again", () => {
    const { container } = render(<WorkIndex />);
    const music = screen.getByRole("button", { name: "Sector: Music" });
    fireEvent.click(music);
    fireEvent.click(music);
    expect(container.querySelectorAll("[data-work-row]")).toHaveLength(2);
    expect(music.getAttribute("aria-pressed")).toBe("false");
  });

  it("restores every row when the filter is cleared", () => {
    const { container } = render(<WorkIndex />);
    fireEvent.click(screen.getByRole("button", { name: "Sector: Music" }));
    fireEvent.click(screen.getByRole("button", { name: siteContent.work.filters.clear }));
    expect(container.querySelectorAll("[data-work-row]")).toHaveLength(2);
  });

  /* The clear control is meaningless with nothing to clear. */
  it("offers no clear control until a filter is active", () => {
    render(<WorkIndex />);
    expect(screen.queryByRole("button", { name: siteContent.work.filters.clear })).toBeNull();
  });

  /* A filtered row must keep the number it has in the gallery and on its own
     page — the number is the study's identity, not its position in a view.

     Note: the brief wrote this interaction as `getByLabelText("Sector")` +
     `fireEvent.change`, which targets a labeled <select>. That control does
     not exist here — Jono chose accent pills over native <select>s (§9,
     work-index.tsx), so there is nothing a plain "Sector" label is attached
     to and no change event to fire. Running it as written throws
     "Unable to find a label with the text of: Sector". Retargeted to the
     actual control (the pressable pill) with the same pass/fail assertions
     the brief specified. */
  it("keeps a study's number when a filter hides the studies before it", () => {
    render(<WorkIndex />);
    fireEvent.click(screen.getByRole("button", { name: "Sector: Automotive" }));
    expect(screen.getByText("02")).toBeTruthy();
    expect(screen.queryByText("01")).toBeNull();
  });
});
