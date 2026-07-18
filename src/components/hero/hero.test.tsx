import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Hero } from "@/components/hero/hero";
import { HERO_BUILD } from "@/components/hero/hero-config";
import { siteContent } from "@/lib/site-content";

const css = readFileSync(
  path.resolve(__dirname, "hero.module.css"),
  "utf8",
);

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
    /* The gradient spans the whole word (--wm-w), sliced per letter — not 280%
       of each letter's own box, which is what made each letter its own gradient. */
    expect(css).toContain("background-size: var(--wm-w, 100%) 100%");
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

  /* The gradient is ONE cohesive sweep across the word: each letter clips its
     own glyphs but samples the word-wide gradient at its own offset (--wm-x of
     --wm-w), rather than each painting the full gradient in its own box. */
  it("slices one word-wide gradient across the letters", () => {
    const start = css.indexOf(".letter", css.indexOf("@supports"));
    expect(start).toBeGreaterThan(-1);
    const open = css.indexOf("{", start);
    const close = css.indexOf("}", open);
    const body = css.slice(open, close);
    expect(body).toContain("background-size: var(--wm-w");
    expect(body).toContain("var(--wm-x");
  });

  /* The whole word drifts as one — the animation lives on the wordmark and pans
     the shared --hero-drift, not a per-letter delay cycle. */
  it("drifts the wordmark as a whole, via the shared --hero-drift", () => {
    const wm = css.slice(css.indexOf(".wordmark {"), css.indexOf("}", css.indexOf(".wordmark {")));
    expect(wm).toContain("animation: heroDrift");
    expect(css).toContain("@property --hero-drift");
  });

  /* An infinite colour animation must respect prefers-reduced-motion
     (spec §6, bug 3 — the prototype never gates drift). The drift now lives on
     the wordmark, so that is where reduced motion must switch it off. */
  it("gates the wordmark drift behind prefers-reduced-motion", () => {
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
    expect(block).toContain(".wordmark");
    expect(block).toMatch(/animation:\s*none/);
  });
});

describe("HERO_BUILD", () => {
  /* 0.3 + n*0.08 + 0.6 — the prototype's own arithmetic. */
  it("computes the run length from the letter count", () => {
    expect(HERO_BUILD.totalMs(8)).toBe(1540);
    expect(HERO_BUILD.totalMs(0)).toBe(900);
  });

  it("exposes the stagger and lead as tunables", () => {
    expect(HERO_BUILD.letterLeadMs).toBe(300);
    expect(HERO_BUILD.letterStaggerMs).toBe(80);
    expect(HERO_BUILD.settleMs).toBe(600);
  });
});

describe("build-in", () => {
  it("starts unbuilt and resolves after the run", async () => {
    const { container } = render(<Hero />);
    const section = container.querySelector("section")!;
    /* data-built is the single switch the CSS keys off, so the from-state
       cannot be left stranded on any copy (spec §6, bug 1). */
    expect(section.getAttribute("data-built")).toBe("false");
    await waitFor(() => expect(section.getAttribute("data-built")).toBe("true"), {
      timeout: HERO_BUILD.totalMs(siteContent.wordmark.length) + 500,
    });
  });

  /* The prototype's reduced-motion path resets the FLY copy, which is
     display:none in that mode — leaving the visible wordmark permanently
     scale(2.5) + blur(9px) (spec §6, bug 1). Resolve immediately instead. */
  it("is already built on first render under reduced motion", () => {
    matchMediaReduced(true);
    const { container } = render(<Hero />);
    expect(container.querySelector("section")!.getAttribute("data-built")).toBe("true");
  });
});

describe("morph copies", () => {
  /* Two copies: an in-flow anchor that owns layout and the accessible name,
     and a fixed fly copy that actually moves. */
  it("renders an in-flow anchor and a fly copy", () => {
    const { container } = render(<Hero />);
    expect(container.querySelector("[data-wordmark='anchor']")).toBeTruthy();
    expect(container.querySelector("[data-wordmark='fly']")).toBeTruthy();
  });

  /* The name must survive BOTH paths. The prototype puts it on the fly, which
     is hidden under reduced motion — so the wordmark has no name at all
     there (spec §6, bug 2). The anchor keeps it in both modes. */
  it("keeps exactly one accessible name, on the anchor", () => {
    /* ONE render — a second would mount a second Hero and make
       getAllByLabelText find two names for reasons unrelated to the code. */
    const { container } = render(<Hero />);
    expect(screen.getAllByLabelText(siteContent.wordmark)).toHaveLength(1);
    expect(container.querySelector("[data-wordmark='anchor']")!.getAttribute("aria-label"))
      .toBe(siteContent.wordmark);
    expect(container.querySelector("[data-wordmark='fly']")!.getAttribute("aria-hidden"))
      .toBe("true");
  });

  it("drops the fly copy entirely under reduced motion", () => {
    matchMediaReduced(true);
    const { container } = render(<Hero />);
    expect(container.querySelector("[data-wordmark='fly']")).toBeNull();
  });
});

describe("reduced-motion first-paint guard", () => {
  /* useReducedMotionPref is hydration-safe: it returns false on the server
     and on the first client render, correcting only in a later effect. SSR
     therefore ships data-built="false", and the JS path alone cannot stop
     the from-state painting before hydration commits — a giant, blurred,
     transparent wordmark for exactly the visitors who asked for less
     motion. A @media (prefers-reduced-motion: reduce) query is resolved by
     the browser at first paint, before any script runs, so the guard has
     to live there and must not depend on data-built at all.

     There are two reduced-motion blocks in the file (one guts the drift
     keyframe, one guts the transitions); the guard under test is the rule
     added to the second, so this locates that block specifically rather
     than the first match. */
  it("neutralises the from-state inside the reduced-motion media block, independent of data-built", () => {
    const mediaStart = css.lastIndexOf("@media (prefers-reduced-motion: reduce)");
    expect(mediaStart).toBeGreaterThan(-1);
    const mediaOpen = css.indexOf("{", mediaStart);
    let depth = 0, mediaEnd = mediaOpen;
    for (let i = mediaOpen; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") { depth--; if (depth === 0) { mediaEnd = i; break; } }
    }
    const mediaBlock = css.slice(mediaOpen, mediaEnd);

    /* Locate the guard rule by its selector, then slice its own declaration
       body by brace-matching (not the whole media block) so a comment or a
       neighbouring rule can't make this pass for the wrong reason. */
    const selector = '.hero[data-built="false"] .letter';
    const selectorStart = mediaBlock.indexOf(selector);
    expect(selectorStart).toBeGreaterThan(-1);
    const ruleOpen = mediaBlock.indexOf("{", selectorStart);
    const ruleClose = mediaBlock.indexOf("}", ruleOpen);
    const ruleSelectorList = mediaBlock.slice(selectorStart, ruleOpen);
    const ruleBody = mediaBlock.slice(ruleOpen, ruleClose);

    /* The from-states this guard must cover: the letters, the eyebrow/tagline
       gated by data-built, and the tagline's second gate on data-run-done. */
    expect(ruleSelectorList).toContain('.hero[data-built="false"] .kicker');
    expect(ruleSelectorList).toContain('.hero[data-built="false"] .tagline');
    expect(ruleSelectorList).toContain('.hero[data-run-done="false"] .tagline');

    expect(ruleBody).toMatch(/(?<![\w-])opacity:\s*1\s*;/);
    expect(ruleBody).toMatch(/(?<![\w-])transform:\s*none\s*;/);
    expect(ruleBody).toMatch(/(?<![\w-])filter:\s*none\s*;/);

    /* Selector specificity is identical to the from-state rules it must
       beat, so only source order decides the winner: the guard has to
       appear after every from-state rule it neutralises. */
    expect(mediaStart).toBeGreaterThan(css.indexOf('.hero[data-built="false"] .letter {'));
    expect(mediaStart).toBeGreaterThan(css.indexOf('.hero[data-built="false"] .kicker,'));
    expect(mediaStart).toBeGreaterThan(css.indexOf('.hero[data-run-done="false"] .tagline,'));
  });
});
