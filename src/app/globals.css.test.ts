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
    expect(headerCss).toMatch(/backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.4\)/);
    expect(headerCss).toMatch(/-webkit-backdrop-filter:\s*blur\(20px\)\s+saturate\(1\.4\)/);
  });

  /* --scrim was a scene token deleted in Phase 1. Referencing it silently
     paints nothing. */
  it("references no deleted scene tokens", () => {
    expect(headerCss).not.toContain("--scrim");
    expect(headerCss).not.toContain("--card-bg");
    expect(headerCss).not.toContain("--sub");
  });
});
