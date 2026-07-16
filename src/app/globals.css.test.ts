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
