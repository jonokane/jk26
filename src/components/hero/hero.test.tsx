import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Hero } from "@/components/hero/hero";
import { siteContent } from "@/lib/site-content";

const css = readFileSync(
  path.resolve(__dirname, "hero.module.css"),
  "utf8",
);

afterEach(cleanup);

describe("Hero markup", () => {
  it("renders one span per wordmark letter", () => {
    const { container } = render(<Hero />);
    const letters = container.querySelectorAll("h1 span");
    expect(letters.length).toBe(siteContent.wordmark.length);
  });

  /* The accessible name must never depend on the motion path. The prototype
     puts it on the fly copy, which is display:none under reduced motion,
     leaving the wordmark with no name at all (spec §6, bug 2). */
  it("gives the wordmark an accessible name from site-content", () => {
    render(<Hero />);
    expect(screen.getByLabelText(siteContent.wordmark)).toBeTruthy();
  });

  it("hides the decorative per-letter spans from assistive tech", () => {
    const { container } = render(<Hero />);
    for (const span of container.querySelectorAll("h1 span")) {
      expect(span.getAttribute("aria-hidden")).toBe("true");
    }
  });
});

describe("living gradient", () => {
  /* The gradient MUST be on each letter, not the container: letters are
     transformed during the build-in, and a container-level background-clip
     makes them invisible mid-flight (spec §6). */
  it("puts the gradient on .letter, not on .wordmark", () => {
    const letter = css.slice(css.indexOf(".letter"), css.indexOf("}", css.indexOf(".letter")));
    expect(letter).toContain("background-clip: text");
    expect(letter).toMatch(/linear-gradient\(92deg/);
    const wordmark = css.slice(css.indexOf(".wordmark"), css.indexOf("}", css.indexOf(".wordmark")));
    expect(wordmark).not.toContain("background-clip");
  });

  it("sweeps all three accents and loops back to the first", () => {
    expect(css).toMatch(
      /linear-gradient\(92deg,\s*var\(--about\)\s*0%,\s*var\(--work\)\s*40%,\s*var\(--contact\)\s*74%,\s*var\(--about\)\s*100%\)/,
    );
    expect(css).toContain("background-size: 280% 100%");
  });

  it("phase-shifts each letter with negative delays so colour travels", () => {
    for (const d of ["-0.6s", "-1.2s", "-1.8s", "-2.4s", "-3s", "-3.6s", "-4.2s"]) {
      expect(css).toContain(d);
    }
  });

  /* An infinite colour animation must respect prefers-reduced-motion
     (spec §6, bug 3 — the prototype never gates drift). */
  it("gates drift behind prefers-reduced-motion", () => {
    const rm = css.slice(css.indexOf("prefers-reduced-motion"));
    expect(css).toContain("prefers-reduced-motion");
    expect(rm).toMatch(/animation:\s*none/);
  });
});
