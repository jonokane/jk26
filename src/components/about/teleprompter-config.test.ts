import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";

/**
 * The two variable weights exist in two places and must not drift.
 *
 * The teleprompter LERPS them in JS, so the config has to own them; the
 * reduced-motion path runs no JS at all, so about.module.css has to state them
 * outright. CSS cannot read TypeScript, so the duplication is real and cannot
 * be designed away. What can be removed is the SILENCE: before this test,
 * setting `weightEmphasis: 700` moved the animated path and left the
 * reduced-motion path rendering 780, with every gate green.
 *
 * Pattern borrowed from src/app/globals.css.test.ts: read the stylesheet as
 * source text and assert the wiring, not the declaration alone.
 */

/** Every `/* … *\/` comment removed, before anything is searched for. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * The body of the first block with this prelude, found by COUNTING BRACES —
 * `indexOf("}")` would end an @media block at its first nested rule.
 */
function block(source: string, prelude: string): string {
  const i = source.indexOf(prelude);
  if (i === -1) throw new Error(`no \`${prelude}\` block`);
  const open = source.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < source.length; j++) {
    if (source[j] === "{") depth++;
    else if (source[j] === "}" && --depth === 0) return source.slice(open + 1, j);
  }
  throw new Error(`unbalanced braces after \`${prelude}\``);
}

/* Comments are stripped FIRST, and this is not defensive tidiness — the file
   documents the range it animates ("the words' weights move 400 -> 780") right
   above the rules that set it. A search over the raw text would match that
   sentence and pass regardless of what the declaration says. This project has
   shipped that exact class of false pass twice (an unanchored
   /backdrop-filter:/ matching inside `-webkit-backdrop-filter:`, and an
   indexOf that landed on the comment naming the thing it was warning about). */
const css = stripComments(
  readFileSync(path.resolve(__dirname, "about.module.css"), "utf8"),
);
const reducedMotion = block(css, "@media (prefers-reduced-motion: reduce)");

/**
 * The weight a rule pins. Anchored with a negative lookbehind so a prefixed
 * property could never satisfy the match for the standard one.
 */
function pinnedWeight(rule: string, selector: string): number {
  const m = rule.match(/(?<![-\w])font-variation-settings:\s*"wght"\s*(\d+)/);
  if (!m) throw new Error(`\`${selector}\` pins no font-variation-settings`);
  return Number(m[1]);
}

describe("the weights CSS states and the config lerps", () => {
  it("pins ambient words to TELEPROMPTER.weightAmbient", () => {
    const rule = block(reducedMotion, ".word {");
    expect(pinnedWeight(rule, ".word")).toBe(T.weightAmbient);
  });

  it("pins emphasised words to TELEPROMPTER.weightEmphasis", () => {
    const rule = block(reducedMotion, '.word[data-word="emphasis"]');
    expect(pinnedWeight(rule, '.word[data-word="emphasis"]')).toBe(T.weightEmphasis);
  });

  /* Guards the guard. If a refactor moved these rules out of the media query,
     both tests above would throw rather than quietly stop checking anything. */
  it("reads the rules from the reduced-motion block itself", () => {
    expect(reducedMotion).toContain(".word");
    expect(reducedMotion).toContain('.word[data-word="emphasis"]');
  });
});
