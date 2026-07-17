import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/* The detail surface (spec §10) was ported off the removed Cold Noon palette.
   These tokens are undefined now; any that returns resolves to nothing and
   silently unstyles a rule (the bug this whole phase fixes). Guard the module
   CSS the way globals.css.test guards the palettes. */
const DEAD = ["--scrim", "--sub", "--card-bg", "--card-border", "--elev", "--text-glow", "--sky-top", "--sky-mid", "--sky-hor", "--scrim-runway"];

const FILES = [
  "case-study-article.module.css",
  "case-study-intro.module.css",
  "case-study-meta.module.css",
  "case-study-cover.module.css",
  "case-study-next.module.css",
];

describe("case-study CSS uses only live stark tokens", () => {
  for (const file of FILES) {
    it(`${file} references no dead Cold Noon token`, () => {
      const css = readFileSync(join(__dirname, file), "utf8");
      for (const token of DEAD) {
        expect(css.includes(token)).toBe(false);
      }
    });
  }
});
