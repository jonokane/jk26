import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { About } from "@/components/about/about";
import { siteContent } from "@/lib/site-content";

// No @testing-library/jest-dom in this repo (see other *.test.tsx files) —
// assertions below stick to plain DOM/vitest matchers.
afterEach(cleanup);

describe("About", () => {
  it("renders all four beats as addressable slabs", () => {
    render(<About />);
    const beats = document.querySelectorAll("[data-beat]");
    expect(beats).toHaveLength(siteContent.beats.length);
    for (const beat of siteContent.beats) {
      expect(screen.getByText(beat.title)).toBeTruthy();
      expect(screen.getByText(beat.statement)).toBeTruthy();
    }
  });

  it("points the two primary CTAs at #work and #contact", () => {
    render(<About />);
    const workLink = screen.getByRole("link", { name: siteContent.about.ctas.work });
    const contactLink = screen.getByRole("link", { name: siteContent.about.ctas.contact });
    expect(workLink.getAttribute("href")).toBe("#work");
    expect(contactLink.getAttribute("href")).toBe("#contact");
  });

  it("does not render a secondary pill whose href is empty", () => {
    render(<About />);
    // Résumé's link is currently "" in site-content.ts, so it must be absent.
    const resumeEntry = siteContent.about.secondary.find((s) => siteContent.links[s.key] === "");
    expect(resumeEntry).toBeDefined();
    if (resumeEntry) {
      expect(screen.queryByRole("link", { name: resumeEntry.label })).toBeNull();
    }
  });

  it("renders the remaining secondary pills as external links", () => {
    render(<About />);
    for (const { label, key } of siteContent.about.secondary) {
      const href = siteContent.links[key];
      if (!href) continue;
      const link = screen.getByRole("link", { name: label });
      expect(link.getAttribute("href")).toBe(href);
      if (href.startsWith("http")) {
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      }
    }
  });

  it("uses siteContent for the heading and lede copy (no hardcoded strings)", () => {
    render(<About />);
    expect(
      screen.getByRole("heading", { level: 2, name: siteContent.titles.about }),
    ).toBeTruthy();
    expect(screen.getByText(siteContent.about.lede)).toBeTruthy();
  });
});
