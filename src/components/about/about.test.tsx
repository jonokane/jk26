import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { About } from "@/components/about/about";
import { siteContent } from "@/lib/site-content";

// No @testing-library/jest-dom in this repo (see other *.test.tsx files) —
// assertions below stick to plain DOM/vitest matchers.

/* A reduced-motion setting the test can toggle at runtime, the way a visitor
   can toggle it in System Settings while the page is open. Everything else the
   page asks matchMedia about answers false. */
const realMatchMedia = window.matchMedia;
let reduced = false;
const listeners = new Set<(e: MediaQueryListEvent) => void>();

function setSystemReducedMotion(next: boolean) {
  reduced = next;
  act(() => {
    for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
  });
}

beforeEach(() => {
  reduced = false;
  listeners.clear();
  // ScrollTrigger restores the scroll position when it refreshes; jsdom has no
  // scrollTo and complains loudly about it.
  window.scrollTo = () => {};
  window.matchMedia = ((query: string) => {
    const isReduceQuery = query.includes("prefers-reduced-motion");
    return {
      get matches() {
        return isReduceQuery ? reduced : false;
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        if (isReduceQuery) listeners.add(listener);
      },
      removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
});

const section = () => document.getElementById("about") as HTMLElement;
const beats = () => Array.from(document.querySelectorAll<HTMLElement>("[data-beat]"));

describe("About (the static document — reduced motion, no JS, spec §12)", () => {
  beforeEach(() => {
    reduced = true;
  });

  it("renders all four beats as addressable slabs", () => {
    render(<About />);
    expect(beats()).toHaveLength(siteContent.beats.length);
    for (const beat of siteContent.beats) {
      expect(screen.getByText(beat.title)).toBeTruthy();
      expect(screen.getByText(beat.statement)).toBeTruthy();
    }
  });

  it("stays a plain document: no sticky stage, no transforms", () => {
    render(<About />);
    expect(section().hasAttribute("data-collector")).toBe(false);
    for (const beat of beats()) {
      expect(beat.style.transform).toBe("");
      expect(beat.style.opacity).toBe("");
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

describe("About (the collector — spec §7)", () => {
  it("upgrades the section into the sticky stage when motion is welcome", () => {
    render(<About />);
    expect(section().hasAttribute("data-collector")).toBe(true);
    // The travel is derived from the content, not hardcoded in CSS.
    expect(section().style.getPropertyValue("--collector-beats")).toBe(
      String(siteContent.beats.length),
    );
    for (const beat of beats()) expect(beat.style.transform).not.toBe("");
  });

  it("never runs for a visitor who already asked for reduced motion", () => {
    reduced = true;
    render(<About />);
    expect(section().hasAttribute("data-collector")).toBe(false);
    for (const beat of beats()) expect(beat.style.transform).toBe("");
  });

  /* The bug this repo has already paid for once: a live OS toggle left the
     hero's letters erased, because what was visible had been decided by an
     effect that never ran again. Every beat must survive both directions. */
  it("survives a live reduced-motion toggle, in both directions", () => {
    render(<About />);
    expect(section().hasAttribute("data-collector")).toBe(true);

    setSystemReducedMotion(true);
    expect(section().hasAttribute("data-collector")).toBe(false);
    expect(section().hasAttribute("data-assembled")).toBe(false);
    expect(beats()).toHaveLength(siteContent.beats.length);
    for (const beat of beats()) {
      expect(beat.style.transform).toBe("");
      expect(beat.style.opacity).toBe("");
      expect(beat.style.zIndex).toBe("");
      expect(beat.textContent).toBeTruthy();
    }

    setSystemReducedMotion(false);
    expect(section().hasAttribute("data-collector")).toBe(true);
    for (const beat of beats()) expect(beat.style.transform).not.toBe("");

    setSystemReducedMotion(true);
    expect(section().hasAttribute("data-collector")).toBe(false);
    for (const beat of beats()) expect(beat.style.opacity).toBe("");
    for (const beat of siteContent.beats) {
      expect(screen.getByText(beat.statement)).toBeTruthy();
    }
  });

  it("leaves nothing behind when it unmounts", () => {
    render(<About />);
    const kept = beats();
    cleanup();
    for (const beat of kept) expect(beat.isConnected).toBe(false);
  });
});
