import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { WorkCard } from "@/components/work/work-card";
import { siteContent } from "@/lib/site-content";

afterEach(cleanup);

const study = (over: Partial<CaseStudy> = {}) =>
  ({
    title: "Collaya",
    year: 2025,
    impact: "Shipped a professional audio plugin.",
    tags: ["Audio", "Plugin"],
    slug: "collaya",
    url: "/work/collaya",
    ...over,
  }) as unknown as CaseStudy;

describe("WorkCard", () => {
  it("renders the study's number, year, title and impact", () => {
    render(<WorkCard study={study()} number={3} />);
    expect(screen.getByText("03")).toBeTruthy();
    expect(screen.getByText("2025")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Collaya" })).toBeTruthy();
    expect(screen.getByText("Shipped a professional audio plugin.")).toBeTruthy();
  });

  /* The whole card is the link. A card with a link INSIDE it would give the
     visitor a small target inside a large clickable-looking area.
     next/link renders an <a>, so this assertion holds either way — what it
     pins is that there is exactly ONE, and where it points. */
  it("is one link to the study, not a card containing a link", () => {
    const { container } = render(<WorkCard study={study()} number={1} />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/work/collaya");
  });

  it("renders every tag", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText("Audio")).toBeTruthy();
    expect(screen.getByText("Plugin")).toBeTruthy();
  });

  it("renders no tag list at all when the study has no tags", () => {
    const { container } = render(<WorkCard study={study({ tags: [] })} number={1} />);
    expect(container.querySelector("[data-tags]")).toBeNull();
  });

  /* The image slot is a hatched placeholder until `cover` is set. Spec §9: a
     real screen drops in with no code change. */
  it("shows the pending caption when there is no cover", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText(siteContent.work.shotPending)).toBeTruthy();
  });

  it("renders the cover image, and drops the caption, when one is set", () => {
    const { container } = render(
      <WorkCard study={study({ cover: "/covers/collaya.png" })} number={1} />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/covers/collaya.png");
    expect(screen.queryByText(siteContent.work.shotPending)).toBeNull();
  });

  /* An <img> with no alt is announced by its filename. The title is what the
     image is OF. */
  it("names the cover image", () => {
    const { container } = render(
      <WorkCard study={study({ cover: "/covers/collaya.png" })} number={1} />,
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Collaya");
  });

  it("carries its slug, so the hook can find it without an index", () => {
    const { container } = render(<WorkCard study={study()} number={1} />);
    expect(container.querySelector("[data-work-card]")?.getAttribute("data-slug")).toBe("collaya");
  });

  /* Copy never lives in JSX (spec §15). */
  it("takes its call to action from site-content", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText(siteContent.work.viewLabel)).toBeTruthy();
  });
});
