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
    expect(letter).toMatch(/(?<!-webkit-)background-clip:\s*text/);
    expect(letter).toMatch(/linear-gradient\(\s*92deg/);
    const wordmark = css.slice(css.indexOf(".wordmark"), css.indexOf("}", css.indexOf(".wordmark")));
    expect(wordmark).not.toContain("background-clip");
  });

  it("sweeps all three accents and loops back to the first", () => {
    expect(css).toMatch(
      /linear-gradient\(\s*92deg,\s*var\(--about\)\s*0%,\s*var\(--work\)\s*40%,\s*var\(--contact\)\s*74%,\s*var\(--about\)\s*100%\s*\)/,
    );
    expect(css).toContain("background-size: 280% 100%");
  });

  /* Load-bearing, not style. Authored standard-first, Turbopack drops the
     unprefixed declaration from the compiled chunk and the feature dies in
     the browser while tests, build and lint all stay green (see
     site-header.module.css, which documents the same trap).

     Scoped to the .letter rule's own body (not the whole file): the
     @supports feature query above this rule legitimately mentions both
     the prefixed and unprefixed property to test for support, and a
     whole-file indexOf/search would find those mentions first and never
     actually see whether the real declarations below were swapped. */
  it("keeps -webkit-background-clip before the standard property", () => {
    const letter = css.slice(css.indexOf(".letter"), css.indexOf("}", css.indexOf(".letter")));
    const webkit = letter.indexOf("-webkit-background-clip");
    const standard = letter.search(/(?<!-webkit-)background-clip:/);
    expect(webkit).toBeGreaterThan(-1);
    expect(standard).toBeGreaterThan(-1);
    expect(webkit).toBeLessThan(standard);
  });

  it("phase-shifts each letter with its own bound negative delay", () => {
    const delays: Array<[number, string]> = [
      [1, "0s"],
      [2, "-0.6s"],
      [3, "-1.2s"],
      [4, "-1.8s"],
      [5, "-2.4s"],
      [6, "-3s"],
      [7, "-3.6s"],
      [8, "-4.2s"],
    ];
    for (const [n, delay] of delays) {
      const selector = `.letter:nth-child(${n})`;
      const start = css.indexOf(selector);
      expect(start).toBeGreaterThan(-1);
      const open = css.indexOf("{", start);
      const close = css.indexOf("}", open);
      const body = css.slice(open, close);
      expect(body).toContain(`animation-delay: ${delay};`);
    }
  });

  /* An infinite colour animation must respect prefers-reduced-motion
     (spec §6, bug 3 — the prototype never gates drift). */
  it("gates drift behind prefers-reduced-motion, on .letter", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(start).toBeGreaterThan(-1);
    /* the media block's own body, not "everything after it" */
    const open = css.indexOf("{", start);
    let depth = 0, end = open;
    for (let i = open; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
    }
    const block = css.slice(open, end);
    expect(block).toContain(".letter");
    expect(block).toMatch(/animation:\s*none/);
  });
});
