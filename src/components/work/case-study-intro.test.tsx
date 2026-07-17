import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { CaseStudyIntro } from "@/components/work/case-study-intro";

const study = () =>
  ({
    title: "Alpha Study",
    client: "Acme Corp",
    role: "Lead",
    sector: ["Music"],
    discipline: ["Product Design"],
    platform: ["Web"],
    timeframe: "2024",
    view: "Archived",
    impact: "Shipped the thing.",
  }) as unknown as CaseStudy;

afterEach(cleanup);

describe("CaseStudyIntro", () => {
  it("uses the client as the eyebrow, not a number", () => {
    // study.client also appears in the CaseStudyMeta attribute grid, so
    // getByText("Acme Corp") would match twice — scope to the eyebrow's
    // <span>, the only <span> the intro renders.
    const { container } = render(<CaseStudyIntro study={study()} headingLevel={1} />);
    const eyebrow = container.querySelector("span");
    expect(eyebrow?.textContent).toBe("Acme Corp");
    // The parked design led with a two-digit study number; the detail eyebrow
    // is the client now (spec §10).
    expect(screen.queryByText("01")).toBeNull();
  });

  it("renders the title at the requested heading level", () => {
    render(<CaseStudyIntro study={study()} headingLevel={1} />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Alpha Study" });
    expect(h1).toBeTruthy();
  });

  it("renders the impact lead", () => {
    render(<CaseStudyIntro study={study()} headingLevel={1} />);
    expect(screen.getByText("Shipped the thing.")).toBeTruthy();
  });
});
