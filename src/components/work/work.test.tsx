import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string) =>
  ({
    title,
    sector: ["Music"],
    discipline: ["Product Design"],
    year: 2024,
    order: 1,
    impact: "Impact.",
    tags: [],
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [study("Alpha")],
  sortedEarlierWork: [],
}));

/* Drive both media queries the section reads: reduced motion and the narrow
   collapse. Everything else matches false, so the default is the gallery. */
function matchMedia(reduced: boolean, narrow: boolean) {
  window.matchMedia = ((q: string) => ({
    matches:
      (reduced && q.includes("reduced-motion")) || (narrow && q.includes("max-width")),
    media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

matchMedia(false, false);
const { Work } = await import("@/components/work/work");

afterEach(() => { cleanup(); matchMedia(false, false); });

describe("Work", () => {
  it("renders the locked section title from site-content", () => {
    render(<Work />);
    expect(screen.getByRole("heading", { name: siteContent.titles.work })).toBeTruthy();
  });

  /* The visible view owns #work-title, so aria-labelledby always resolves. */
  it("names the landmark, and the title it points at exists", () => {
    const { container } = render(<Work />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("id")).toBe("work");
    expect(section?.getAttribute("aria-labelledby")).toBe("work-title");
    expect(container.querySelector("#work-title")).toBeTruthy();
  });

  it("shows the gallery by default", () => {
    const { container } = render(<Work />);
    expect(container.querySelector("[data-work-card]")).toBeTruthy();
    expect(container.querySelector("[data-work-row]")).toBeNull();
  });

  /* The toggle names the view it switches TO, like the theme control. */
  it("switches to the index and back", () => {
    const { container } = render(<Work />);
    fireEvent.click(screen.getByRole("button", { name: siteContent.work.indexLabel }));
    expect(container.querySelector("[data-work-row]")).toBeTruthy();
    expect(container.querySelector("[data-work-card]")).toBeNull();
    // and the index still exposes the section title
    expect(container.querySelector("#work-title")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: siteContent.work.galleryLabel }));
    expect(container.querySelector("[data-work-card]")).toBeTruthy();
  });

  /* Spec §9, gap 3: under reduce the gallery collapses to the index — and there
     must be no toggle back into it, or the control would offer motion to someone
     who asked for none. */
  it("collapses to the index under reduced motion, with no way back to the gallery", async () => {
    matchMedia(true, false);
    vi.resetModules();
    const { Work: Reduced } = await import("@/components/work/work");
    const { container } = render(<Reduced />);
    expect(container.querySelector("[data-work-row]")).toBeTruthy();
    expect(container.querySelector("[data-work-card]")).toBeNull();
    expect(screen.queryByRole("button", { name: siteContent.work.galleryLabel })).toBeNull();
  });

  /* Spec §9, gap 2: a narrow viewport gets the index too — the gallery's
     vertical-to-horizontal pan is a scroll trap on a phone — and likewise no
     toggle back to it. */
  it("collapses to the index on a narrow viewport, with no toggle", async () => {
    matchMedia(false, true);
    vi.resetModules();
    const { Work: Narrow } = await import("@/components/work/work");
    const { container } = render(<Narrow />);
    expect(container.querySelector("[data-work-row]")).toBeTruthy();
    expect(container.querySelector("[data-work-card]")).toBeNull();
    expect(screen.queryByRole("button", { name: siteContent.work.galleryLabel })).toBeNull();
    expect(screen.queryByRole("button", { name: siteContent.work.indexLabel })).toBeNull();
  });
});
