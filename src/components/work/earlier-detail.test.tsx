import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { EarlierProject } from "#site/content";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { siteContent } from "@/lib/site-content";

afterEach(cleanup);

const item = (over: Partial<EarlierProject> = {}) =>
  ({
    title: "Cinematiq",
    sector: ["Creative Tech"],
    discipline: ["Product Design", "Full-stack Product"],
    platform: [],
    role: "UX, visual, front-end",
    timeframe: "Summer 2015",
    view: "https://cinematiq.com",
    slug: "cinematiq",
    url: "/earlier/cinematiq",
    // Velite compiles MDX to a JS function body; a component that renders nothing
    // is enough for these assertions (the body path is covered by the browser pass).
    body: "const {jsx:_jsx}=arguments[0];return{default:()=>null}",
    ...over,
  }) as unknown as EarlierProject;

describe("EarlierDetail", () => {
  it("renders the title and the primary sector eyebrow", () => {
    render(<EarlierDetail item={item()} />);
    expect(screen.getByRole("heading", { name: "Cinematiq" })).toBeTruthy();
    expect(screen.getByText("Creative Tech")).toBeTruthy();
  });

  it("shows a live link when view is a URL", () => {
    render(<EarlierDetail item={item()} />);
    const link = screen.getByRole("link", { name: new RegExp(siteContent.work.viewLiveLabel) });
    expect(link.getAttribute("href")).toBe("https://cinematiq.com");
  });

  it("shows no live link when view is Archived", () => {
    render(<EarlierDetail item={item({ view: "Archived" })} />);
    expect(screen.queryByRole("link", { name: new RegExp(siteContent.work.viewLiveLabel) })).toBeNull();
  });

  it("uses an h1 title when headingLevel is 1", () => {
    const { container } = render(<EarlierDetail item={item()} headingLevel={1} />);
    expect(container.querySelector("h1")?.textContent).toBe("Cinematiq");
  });
});
