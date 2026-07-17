import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Statement } from "@/components/about/statement-tokens";

/* Mock the glue, not the content module. `.velite/` is generated and
   git-ignored, and vitest aliases only `@` — importing #site/content here
   would make `pnpm test` fail on a clean checkout until someone ran
   `pnpm build`. work-data.ts exists for exactly this reason. */
const fixture: { title: string; statements: Statement[] } = {
  title: "Who I am.",
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
  /* The words are separated by REAL spaces in normal inline flow, so the
     rendered text already IS the sentence — no aria-label, and nothing
     aria-hidden. An earlier version needed both because the words had no
     whitespace between them at all; real spaces made that workaround
     redundant, and it had been blocking links (an aria-hidden fragment cannot
     contain a reachable <a>). */
  it("renders each statement as its sentence, with real spaces", () => {
    const { container } = render(<About />);
    const first = container.querySelector("[data-statement]");
    const sentence = fixture.statements[0].map((w) => w.text).join(" ");
    expect(first?.textContent).toBe(sentence);
  });

  it("does not hide the words from assistive tech", () => {
    const { container } = render(<About />);
    for (const w of container.querySelectorAll("[data-word]")) {
      expect(w.getAttribute("aria-hidden")).toBeNull();
    }
  });

  it("keeps the landmark named", () => {
    const { container } = render(<About />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-labelledby")).toBe("about-title");
    expect(container.querySelector("#about-title")).toBeTruthy();
  });

  /* Reduced motion gets the whole thing at rest — every statement legible at
     once, no focal zone, no sticky stage. That is established by a media query
     in about.module.css, so it is right at first paint (spec §11).
     There is deliberately no test here asserting a `data-static` attribute:
     one used to exist, and it passed while reading nothing. Nothing in the
     codebase selected [data-static] on this section, so the assertion would
     have stayed green if the entire reduced-motion block had been deleted —
     green on markup, blind to the behaviour. The mechanism is CSS, so the
     tests that can actually see it are the CSS ones (teleprompter-config.test)
     and the browser. */

  /* The rail is decorative and offers nothing to activate — see the note at
     its markup. This is the one thing a unit test CAN pin about it. */
  it("does not promise assistive tech a jump it cannot deliver", () => {
    const { container } = render(<About />);
    const rail = container.querySelector("ol");
    expect(rail?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.queryByRole("list", { name: /jump/i })).toBeNull();
  });
});

describe("links in a statement", () => {
  it("renders one <a> for the whole link text, not one per word", async () => {
    vi.resetModules();
    vi.doMock("@/components/about/about-data", () => ({
      aboutPage: {
        title: "Who I am.",
        statements: [
          [
            { text: "Say", role: "ambient" },
            { text: "hi", role: "ambient" },
            { text: "Hit", role: "ambient", href: "#contact" },
            { text: "me", role: "ambient", href: "#contact" },
            { text: "up", role: "ambient", href: "#contact" },
            { text: "today.", role: "ambient" },
          ],
        ],
      },
    }));
    const { About: Linked } = await import("@/components/about/about");
    const { container } = render(<Linked />);

    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("#contact");
    /* the link's words still animate individually inside it */
    expect(links[0].querySelectorAll("[data-word]")).toHaveLength(3);
    expect(links[0].textContent).toBe("Hit me up");
    /* and the sentence still reads whole */
    expect(container.querySelector("[data-statement]")?.textContent).toBe("Say hi Hit me up today.");
  });
});

