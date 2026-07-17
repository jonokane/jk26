import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Statement } from "@/components/about/statement-tokens";

/* Mock the glue, not the content module. `.velite/` is generated and
   git-ignored, and vitest aliases only `@` — importing #site/content here
   would make `pnpm test` fail on a clean checkout until someone ran
   `pnpm build`. work-data.ts exists for exactly this reason. */
const fixture: { title: string; lede: string; statements: Statement[] } = {
  title: "Who I am.",
  lede: "A short lede.",
  statements: [
    [
      { text: "I", role: "ambient" },
      { text: "work", role: "ambient" },
      { text: "at", role: "ambient" },
      { text: "Meta.", role: "emphasis" },
    ],
    [
      { text: "Available", role: "emphasis" },
      { text: "now.", role: "emphasis" },
    ],
  ],
};
vi.mock("@/components/about/about-data", () => ({ aboutPage: fixture }));

const { About } = await import("@/components/about/about");

function matchMediaReduced(reduced: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes("reduced-motion"),
    media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => { cleanup(); matchMediaReduced(false); });

describe("About", () => {
  it("renders the locked section title from MDX, not the nav label", () => {
    render(<About />);
    expect(screen.getByRole("heading", { name: "Who I am." })).toBeTruthy();
  });

  it("renders every statement's every word as its own span", () => {
    const { container } = render(<About />);
    const expected = fixture.statements.reduce((n, st) => n + st.length, 0);
    expect(container.querySelectorAll("[data-word]").length).toBe(expected);
  });

  /* The words are laid out in a flex row with a column-gap and carry no
     whitespace between them (spec §5). If the spans were joined by text
     nodes the spacing would double. But the statement must still read as
     one sentence to a screen reader. */
  it("reads each statement as one accessible sentence", () => {
    const { container } = render(<About />);
    const first = container.querySelector("[data-statement]");
    const text = fixture.statements[0].map((w) => w.text).join(" ");
    expect(first?.textContent?.replace(/\s+/g, " ").trim()).toBe(text);
  });

  it("keeps the landmark named", () => {
    const { container } = render(<About />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-labelledby")).toBe("about-title");
    expect(container.querySelector("#about-title")).toBeTruthy();
  });

  /* Reduced motion gets the whole thing at rest — every statement legible at
     once, no focal zone, no sticky stage. Established by CSS, never by a
     post-hydration effect (Phase 2 shipped that bug). */
  it("marks the stage inert under reduced motion", () => {
    matchMediaReduced(true);
    const { container } = render(<About />);
    expect(container.querySelector("section")?.getAttribute("data-static")).toBe("");
  });
});
