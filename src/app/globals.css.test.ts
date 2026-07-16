import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf8");

describe("type tokens", () => {
  it("uses Mae Variable for display and body", () => {
    expect(css).toMatch(/--font-display:\s*"mae-variable"/);
    expect(css).toMatch(/--font-body:\s*"mae-variable"/);
  });

  it("uses Config Mono for the mono role", () => {
    expect(css).toMatch(/--font-mono:\s*"config-mono-vf",\s*monospace/);
  });

  /* Config Variable is the wordmark face and nothing else (spec §Type,
     conflict register #2). TotalBlack is the parked hero. */
  it("uses Config Variable for the wordmark, and only there", () => {
    expect(css).toMatch(/--font-wordmark:\s*"config-variable"/);
    expect(css).not.toContain("totalblack-variable");
  });

  it("carries no Geist fallbacks — the site is served from the Adobe kit", () => {
    expect(css).not.toContain("font-geist");
  });
});

const TOKENS = [
  "--canvas", "--ink", "--mute", "--dim",
  "--hairline", "--row-hover", "--about", "--work", "--contact",
];

/** `:root { ... }` and `:root[data-theme="dark"] { ... }` bodies. */
function paletteBody(selector: string): string {
  const i = css.indexOf(selector);
  if (i === -1) throw new Error(`no ${selector} block`);
  return css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
}

describe("palettes", () => {
  it("declares every token in both themes", () => {
    const light = paletteBody(":root {");
    const dark = paletteBody(':root[data-theme="dark"]');
    for (const t of TOKENS) {
      expect(light, `light is missing ${t}`).toContain(`${t}:`);
      expect(dark, `dark is missing ${t}`).toContain(`${t}:`);
    }
  });

  it("keeps the handoff's light values verbatim", () => {
    const light = paletteBody(":root {");
    expect(light).toMatch(/--canvas:\s*#ffffff/);
    expect(light).toMatch(/--ink:\s*#0d0d0d/);
    expect(light).toMatch(/--about:\s*#3f9b4e/);
    expect(light).toMatch(/--work:\s*#6d4bd8/);
    expect(light).toMatch(/--contact:\s*#2f7d8f/);
  });

  it("uses a pure black dark canvas", () => {
    expect(paletteBody(':root[data-theme="dark"]')).toMatch(/--canvas:\s*#000000/);
  });

  /* The whole point of two locked palettes: a hex is a hex. If a dark value
     is ever expressed as a function of a light one, the muddiness that killed
     Cold Noon has a way back in. */
  it("derives nothing — no colour functions in either palette", () => {
    for (const body of [paletteBody(":root {"), paletteBody(':root[data-theme="dark"]')]) {
      expect(body).not.toMatch(/color-mix|oklch|hsl\(|rgb\(|calc\(/);
    }
  });
});

const headerCss = readFileSync(
  path.resolve(__dirname, "../components/site-header.module.css"),
  "utf8",
);

describe("nav glass", () => {
  /* The tokens existed in both palettes for a whole phase while the header
     rendered transparent, because nothing consumed them. Assert the wiring,
     not just the declaration. */
  it("consumes the nav glass tokens", () => {
    expect(headerCss).toContain("var(--nav-glass)");
    expect(headerCss).toContain("var(--nav-edge)");
  });

  it("applies the prototype's blur and saturate", () => {
    expect(headerCss).toMatch(/(?<!-webkit-)backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.4\)/);
    expect(headerCss).toMatch(/-webkit-backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.4\)/);
  });

  /* The order is load-bearing, not style. Authored standard-first, Turbopack
     dropped the unprefixed declaration from the compiled chunk and the nav
     rendered with no blur — while the unit tests, build and lint all stayed
     green. The prefixed property MUST come first. */
  it("keeps -webkit-backdrop-filter before the standard property", () => {
    const webkit = headerCss.indexOf("-webkit-backdrop-filter");
    const standard = headerCss.search(/(?<!-webkit-)backdrop-filter:/);
    expect(webkit).toBeGreaterThan(-1);
    expect(standard).toBeGreaterThan(-1);
    expect(webkit).toBeLessThan(standard);
  });

  /* --scrim was a scene token deleted in Phase 1. Referencing it silently
     paints nothing. --card-border was never declared in either v3 palette
     either — the divider/hairline token is --hairline. */
  it("references no deleted scene tokens", () => {
    expect(headerCss).not.toContain("--scrim");
    expect(headerCss).not.toContain("--card-bg");
    expect(headerCss).not.toContain("--sub");
    expect(headerCss).not.toContain("--card-border");
  });
});

/** The first `{...}` block whose selector is exactly `selector` in `source`,
 *  found by brace-matching from the selector's own opening brace — not by
 *  `indexOf`/`toContain` over the whole file, which would just as happily
 *  match a comment or an @media/@supports condition mentioning the same
 *  literal. */
function ruleBody(source: string, selector: string): string {
  const i = source.indexOf(selector);
  if (i === -1) throw new Error(`no ${selector} rule`);
  const open = source.indexOf("{", i);
  return source.slice(open + 1, source.indexOf("}", open));
}

describe(".site-header nav links (globals.css)", () => {
  /* The nav glass tests above read site-header.module.css — the file that
     never had this bug. The real instance was here: `.site-header nav a`
     set `color: var(--sub)`, and --sub has not been declared in either
     palette for two phases. Invalid-at-computed-value-time, so `color`
     silently fell back to the inherited --ink — hover and the scroll-spy's
     aria-current state changed nothing visible. Scoped to the rule's own
     body so this can't pass by matching a comment or an unrelated rule
     elsewhere in the file that legitimately still uses tokens like
     --card-bg/--scrim (scene tokens written by JS, not dangling). */
  it("references no deleted scene tokens in the .site-header nav link rule", () => {
    const rule = ruleBody(css, ".site-header nav a {");
    expect(rule).not.toContain("--sub");
  });

  it("colours the nav link with the muted-text token at rest", () => {
    const rule = ruleBody(css, ".site-header nav a {");
    expect(rule).toMatch(/color:\s*var\(--mute\)/);
  });
});
