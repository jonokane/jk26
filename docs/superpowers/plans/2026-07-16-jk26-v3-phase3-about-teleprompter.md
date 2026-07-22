# jk26-v3 Phase 3: About teleprompter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the About stub into the teleprompter — statements authored as plain markdown in MDX, read word by word as you scroll, with a moving focal zone that carries the eye.

**Architecture:** Four tasks, bottom-up. A pure tokenizer turns markdown emphasis into per-word roles; a new Velite `site` collection compiles `content/site/about.mdx` through it; a pure focus engine turns scroll progress into per-block/per-word values; the component wires them onto a sticky stage. Every number is a tunable in one config file, because Jono adjusts these by feel.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS-first) · Velite (MDX) · GSAP ScrollTrigger on the shared Lenis ticker · Vitest + Testing Library · pnpm.

**Spec:** `docs/superpowers/specs/2026-07-16-stark-visual-language-design.md` — §5 (content architecture), §8 (About teleprompter).
**Ground truth for behavior:** `docs/notes/jk26-v3-handoff/prototypes/Portfolio v2.dc.html`. **Where it and the README disagree, the prototype's code wins** — see the spec's conflict register, and §8's warning below.
**Base:** branch `jk26-v3` (Phase 2 complete: 82 tests, build + lint clean).

## Global Constraints

- **pnpm only.** Never npm/yarn. **No new dependencies** — everything needed is installed.
- **`pnpm test`** — package.json declares `"test": "vitest run"`, already non-watch. Never `pnpm test run` (passes `run` as a filename filter, matches nothing, exits 1). One file: `pnpm test <path>`.
- `pnpm build`, `pnpm test`, `pnpm lint` clean before every commit. Baseline: **82 tests / 10 files**.
- **Never `git add -A`** — stage only intended files.
- **After every commit `git status --porcelain` must be EMPTY.** Evidence must reflect what was COMMITTED, not a dirty tree.
- **Content never lives in JSX.** Prose goes in MDX; micro-strings in `src/lib/site-content.ts`. Accessible names are copy too.
- **Design decisions live in CSS.** Note: unlayered rules beat anything in an `@layer`.
- **No second RAF loop.** Lenis is driven from GSAP's ticker as one loop (`smooth-scroll.tsx`). Use `ScrollTrigger` from `@/lib/gsap`. A competing loop has silently locked scrolling on this site before.
- **Do not change any palette hex.** Both palettes are locked and hand-edited by Jono.
- **Reduced motion is a first-class path**, established by CSS or an inline script — **never by a post-hydration effect.** `useReducedMotionPref()` is hydration-safe: it returns `false` on the server and first client render, so anything gated on it flashes the wrong state until hydration. Phase 2 shipped exactly that bug and fixed it with a `@media` block.
- **Do not touch:** `content/work/**`, `content/earlier/**`, `smooth-scroll.tsx`, `gsap.ts`, `mdx-content.tsx`, `hash-scroll.tsx`, `use-reduced-motion.ts`, `fonts-ready.tsx`, `api/contact/route.ts`, `theme-engine.ts`, `pre-hydration-theme.ts`, `site-header.tsx`, `hero/**`.

## Hard-won lessons this project has paid for — do not re-learn them

- **The source is not the artifact.** A test that reads a source file proves authorship, not behavior. Turbopack silently dropped a CSS property while tests, build and lint stayed green.
- **A source-text test must anchor on the SYNTAX it means** — a rule body, a template literal — never a bare identifier. Comments, imports and `@media`/`@supports` conditions all contain the same words. Four agents (and the author of this plan) have shipped a test that passed by matching its own explanatory comment.
- **A CSS property asserted with `toContain` also matches its `-webkit-` twin.** Anchor with `(?<!-webkit-)`.
- **A settled-state read cannot see a pre-hydration window.** Sample the timeline from `waitUntil: 'commit'`, not the end state after `load`.
- **Reachability is never `element.click()`** — it fires on hidden elements. Use `document.elementFromPoint(rect center)`.
- **Check the dev server's listener postdates your commit**: `lsof -ti:3000 -sTCP:LISTEN` (plain `lsof -ti:3000` also returns Chrome clients and hands you the wrong pid), then `ps -p <pid> -o lstart=`.
- **Any test claiming to catch a regression: break the thing on purpose, watch it fail, restore, report what you saw.** A test nobody has seen fail is not evidence.

---

### Task 1: The statement tokenizer

A pure function turning a markdown body into statements of role-tagged words. No Velite, no React — the house style (`splitMarkdownSections`, `theme-engine.ts`).

**Files:**
- Create: `src/components/about/statement-tokens.ts`, `src/components/about/statement-tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export type WordRole = "ambient" | "emphasis" | "italic";
  export interface Word { text: string; role: WordRole }
  export type Statement = Word[];
  export function tokenizeStatements(markdown: string): Statement[];
  ```
  Task 2 calls `tokenizeStatements` from `velite.config.ts`; Task 4 renders the `Word[]`.

**The role mapping** (spec §5, and §8's conflict-register note):

| Markdown | Role | Renders as |
|---|---|---|
| unmarked | `ambient` | mixes `--dim` → **`--about`**, weight 400 → 440 |
| `**bold**` | `emphasis` | mixes `--dim` → **`--ink`**, weight 400 → 780 |
| `*italic*` | `italic` | mixes `--dim` → `--ink`, weight 400 → 440, italic |

> **This is inverted from the handoff README, deliberately.** The README says emphasized words take the accent. The prototype's code does the opposite — *unmarked* words take the accent and *emphasized* words go to ink. The design is a field of green with black bold hits, not black text with green highlights. Jono confirmed it against a prototype still (2026-07-16). Build the table above.

- [ ] **Step 1: Write the failing test**

Create `src/components/about/statement-tokens.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { tokenizeStatements, type Statement } from "@/components/about/statement-tokens";

const text = (s: Statement) => s.map((w) => w.text).join(" ");
const roles = (s: Statement) => s.map((w) => w.role);

describe("tokenizeStatements", () => {
  it("splits blank-line-separated paragraphs into statements", () => {
    const out = tokenizeStatements("First one here.\n\nSecond one here.");
    expect(out).toHaveLength(2);
    expect(text(out[0])).toBe("First one here.");
    expect(text(out[1])).toBe("Second one here.");
  });

  it("treats unmarked words as ambient", () => {
    expect(roles(tokenizeStatements("plain words")[0])).toEqual(["ambient", "ambient"]);
  });

  it("marks **bold** as emphasis and *italic* as italic", () => {
    const out = tokenizeStatements("I work at **Meta** and *maybe* elsewhere")[0];
    expect(out.map((w) => [w.text, w.role])).toEqual([
      ["I", "ambient"], ["work", "ambient"], ["at", "ambient"],
      ["Meta", "emphasis"], ["and", "ambient"],
      ["maybe", "italic"], ["elsewhere", "ambient"],
    ]);
  });

  /* The prototype's markup carries punctuation ON the word — `data-role="e"
     >love,` — because the spans are laid out with a flex column-gap and have
     no whitespace between them. A word split from its comma would render a
     floating comma. */
  it("keeps punctuation attached to its word, inside and outside the emphasis", () => {
    const out = tokenizeStatements("**Yahoo!**, Amazon, and **Meta**.")[0];
    expect(out.map((w) => w.text)).toEqual(["Yahoo!,", "Amazon,", "and", "Meta."]);
    expect(out.map((w) => w.role)).toEqual(["emphasis", "ambient", "ambient", "emphasis"]);
  });

  it("handles a multi-word emphasis run", () => {
    const out = tokenizeStatements("**Available now** for work")[0];
    expect(out.map((w) => [w.text, w.role])).toEqual([
      ["Available", "emphasis"], ["now", "emphasis"],
      ["for", "ambient"], ["work", "ambient"],
    ]);
  });

  it("collapses newlines inside a paragraph — a wrapped line is one statement", () => {
    const out = tokenizeStatements("one two\nthree four");
    expect(out).toHaveLength(1);
    expect(text(out[0])).toBe("one two three four");
  });

  it("ignores blank input rather than emitting an empty statement", () => {
    expect(tokenizeStatements("")).toEqual([]);
    expect(tokenizeStatements("\n\n   \n\n")).toEqual([]);
  });

  /* Velite strips frontmatter before handing us `content` (verified against
     velite's matter loader: `value.slice(match[0].length).trim()`), so a
     leading `---` block should never arrive. If the loader ever changes, a
     silent extra statement is far worse than a loud one. */
  it("does not treat a stray frontmatter block as a statement", () => {
    const out = tokenizeStatements("---\ntitle: x\n---\n\nReal statement.");
    expect(out).toHaveLength(1);
    expect(text(out[0])).toBe("Real statement.");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/components/about/statement-tokens.test.ts`
Expected: FAIL — `Cannot find module '@/components/about/statement-tokens'`.

- [ ] **Step 3: Write the tokenizer**

Create `src/components/about/statement-tokens.ts`:

```ts
/**
 * Turning the About body's markdown into role-tagged words (spec §5) — pure,
 * so it is unit-testable and has no idea Velite or React exist (the
 * `splitMarkdownSections` house style, spec §14).
 *
 * Jono authors the statements as ordinary markdown paragraphs and marks the
 * words that should land heavy with `**bold**`. The teleprompter's per-word
 * emphasis therefore costs him no syntax he does not already know, and
 * changing which words hit never touches a component.
 */

export type WordRole = "ambient" | "emphasis" | "italic";

export interface Word {
  text: string;
  role: WordRole;
}

/** One paragraph, as the words the teleprompter animates. */
export type Statement = Word[];

/** `**bold**` or `*italic*`, non-greedy so adjacent runs do not merge. */
const EMPHASIS = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

/** A stray frontmatter block. Velite strips it, but a silent extra statement
 *  would be worse than a loud one if that ever changes. */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function wordsFrom(run: string, role: WordRole): Word[] {
  return run
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => ({ text, role }));
}

/**
 * Split a markdown body into statements, one per blank-line-separated
 * paragraph, each a flat run of role-tagged words.
 *
 * Punctuation stays attached to its word: the rendered spans sit in a flex row
 * with a `column-gap` and carry no whitespace between them, so a comma split
 * from its word would float on its own (the prototype writes `>love,` for the
 * same reason).
 */
export function tokenizeStatements(markdown: string): Statement[] {
  return markdown
    .replace(FRONTMATTER, "")
    .split(/\r?\n\s*\r?\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => {
      const words: Word[] = [];
      /* split() with a capturing group interleaves the delimiters, so odd
         indices are the emphasis runs and even indices the plain text. */
      para.split(EMPHASIS).forEach((chunk) => {
        if (!chunk) return;
        if (chunk.startsWith("**") && chunk.endsWith("**")) {
          words.push(...wordsFrom(chunk.slice(2, -2), "emphasis"));
        } else if (chunk.startsWith("*") && chunk.endsWith("*")) {
          words.push(...wordsFrom(chunk.slice(1, -1), "italic"));
        } else {
          words.push(...wordsFrom(chunk, "ambient"));
        }
      });
      return words;
    })
    .filter((s) => s.length > 0);
}
```

> **The punctuation test will likely fail on the first attempt.** `**Yahoo!**,` splits into the emphasis run `**Yahoo!**` and the plain chunk `,` — producing a lone `,` word rather than `Yahoo!,`. Solve it so the trailing punctuation joins the preceding word: after building the list, merge any word that is pure punctuation into its predecessor, keeping the predecessor's role. Do not "fix" it by changing the test — the prototype's markup is the ground truth and it attaches punctuation to the word.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/components/about/statement-tokens.test.ts`
Expected: PASS, all eight cases.

- [ ] **Step 5: Commit**

```bash
git add src/components/about/statement-tokens.ts src/components/about/statement-tokens.test.ts
git commit -m "feat(about): the statement tokenizer

Markdown paragraphs to role-tagged words: unmarked -> ambient,
**bold** -> emphasis, *italic* -> italic (spec §5). Pure, so it has no
idea Velite or React exist.

Roles are the prototype's, not the README's: ambient words take the
ACCENT and emphasized words go to INK. The README says the opposite;
Jono confirmed the prototype against a still (spec conflict register #5).

Punctuation stays attached to its word — the rendered spans have no
whitespace between them (a flex column-gap does the spacing), so a comma
split from its word would float."
```

---

### Task 2: The `site` content collection

`content/site/about.mdx` compiled through the tokenizer by Velite (spec §5).

**Files:**
- Create: `content/site/about.mdx`
- Modify: `velite.config.ts`
- Test: `src/components/about/statement-tokens.test.ts` (extend)

**Interfaces:**
- Consumes: `tokenizeStatements` from `@/components/about/statement-tokens`.
- Produces: `import { site } from "#site/content"` — an array with one entry, shaped `{ title: string; lede: string; statements: Statement[] }`. Task 4 reads it.

- [ ] **Step 1: Write the content**

Create `content/site/about.mdx`. The statements are Jono's locked copy, lifted verbatim from `siteContent.beats` — **do not reword them**. The `**bold**` marks are the design decision this file exists to make editable: they are the words that land heavy in ink.

```mdx
---
title: "Who I am."
lede: "Twenty years shipping products at Yahoo!, Amazon, and Meta, and now as founder of Collaya. Equal parts designer, design manager, and product strategist, with enough front-end fluency to build what I draw."
---

I help teams build products people love, spanning **design**, **product management**, **strategy**, and hands-on building to turn concept and vision into **shipped products**.

For two decades I have solved challenging product and UX problems at **Yahoo!**, **Amazon**, **Meta**, and smaller startups, and now as founder of **Collaya**.

I care about **people** and real user needs, and I balance that with the **metrics** that grow a business.

**Available now** for fractional work, around **20+ hours a week**, mostly with early-stage teams in music, creative, AI, IoT, and automotive. Remote-first, open to LA or SF hybrid for the right opportunity.
```

> `title` is **"Who I am."** — the prototype's locked section title. The Phase 1 stub renders `siteContent.titles.about` (`"About"`), which was placeholder. The nav label stays "About"; the section heading is "Who I am." (the same deliberate split as "Work" vs "Selected Work").

> The emphasis marks on statement 3 (`**people**`, `**metrics**`) match the prototype still exactly. The others are the natural read of the same rule: the proper nouns and the offer.

- [ ] **Step 2: Do NOT write a vitest test that imports `#site/content`**

This is deliberate, and it is the house pattern. **No test in this repo imports `#site/content`** — every consumer is a component. `work-data.ts` states the rule in its own comment: *"The thin glue between `#site/content` and the pure list logic in `work-lists.ts` … keep the content-module dependency out of what's unit-tested."*

The reason is concrete: `.velite/` is **generated and git-ignored**, and `vitest.config.ts` aliases only `@` — not `#site/content`. A test importing it would fail on a clean checkout until someone ran `pnpm build`, breaking `pnpm test`'s independence.

So the split is: **the schema validates content at build time; vitest validates pure logic.** The tokenizer's own tests (Task 1) already cover the logic. This task's correctness is proven by the build and by Step 5's check.

- [ ] **Step 3: Add the collection**

In `velite.config.ts`, add the import and the collection. The `statements` field mirrors the existing `sections()` preprocess precedent exactly — read it first (`velite.config.ts:19-34`) and match its shape:

```ts
import { tokenizeStatements } from "./src/components/about/statement-tokens";
```

```ts
/**
 * The About statements (spec §5). Jono authors them as ordinary markdown
 * paragraphs and marks the heavy words with `**bold**`; the tokenizer turns
 * that into the role-tagged words the teleprompter animates. Editing the copy,
 * or which words land, never touches a component.
 *
 * `.min(1)` turns an empty body into a loud build failure rather than an About
 * section that silently renders nothing.
 *
 * `ctx.meta.content` is the body with frontmatter already stripped — velite's
 * matter loader does `value.slice(match[0].length).trim()` — so paragraph
 * splitting is safe here.
 */
const statements = () =>
  s.preprocess(
    (_value, ctx) => tokenizeStatements(ctx.meta.content ?? ""),
    s
      .array(
        s.array(
          s.object({
            text: s.string(),
            role: s.enum(["ambient", "emphasis", "italic"]),
          }),
        ),
      )
      .min(1),
  );

const site = defineCollection({
  name: "SitePage",
  pattern: "site/**/*.mdx",
  schema: s.object({
    title: s.string(),
    lede: s.string(),
    statements: statements(),
  }),
});
```

and register it: `collections: { work, earlier, site },`

> `s.enum` **is** available in this Velite version (verified in `velite.config.ts`'s dependency). Use it — do not silently weaken the schema to `s.string()`.

- [ ] **Step 4: Build, and prove the schema is a real gate**

```bash
pnpm build
```
Expected: succeeds, and `.velite/site.json` appears.

Then check the compiled output is actually what the component will read:

```bash
node -e "
const s = require('./.velite/site.json');
console.log('entries      :', s.length);
console.log('title        :', JSON.stringify(s[0].title));
console.log('statements   :', s[0].statements.length);
console.log('first words  :', s[0].statements[0].slice(0,6).map(w => w.text + '/' + w.role).join(' '));
console.log('emphasis/stmt:', s[0].statements.map(t => t.filter(w => w.role === 'emphasis').length).join(', '));
"
```
Expected: 1 entry, title `"Who I am."`, 4 statements, the first words tagged `I/ambient help/ambient …`, and every statement carrying at least one emphasis. **Report the actual output.** If any statement has zero emphasis words, the `**bold**` marks did not survive — say so rather than moving on.

- [ ] **Step 5: Prove the `.min(1)` gate is real**

The schema is the only thing standing between an empty About body and a section that silently renders nothing. Temporarily empty `content/site/about.mdx`'s body (keep the frontmatter), run `pnpm build`, and confirm it **FAILS loudly**. Restore, rebuild. Report what you saw. A guard nobody has watched fire is not a guard.

- [ ] **Step 6: Commit**

```bash
git add content/site/about.mdx velite.config.ts
git commit -m "feat(about): the site content collection

content/site/about.mdx carries the About title, lede, and the four
statements as plain markdown paragraphs; a Velite preprocess runs them
through the tokenizer (spec §5), mirroring the sections() precedent.

Jono's locked copy, verbatim. The **bold** marks are the design decision
the file exists to make editable — the words that land heavy in ink.

The section title is 'Who I am.' — the prototype's locked title. The
Phase 1 stub rendered siteContent.titles.about ('About'), a placeholder."
```

---

### Task 3: The focus engine

The teleprompter's maths, pure and unit-tested. Every number is a tunable.

**Files:**
- Create: `src/components/about/teleprompter-config.ts`, `src/components/about/teleprompter-engine.ts`, `src/components/about/teleprompter-engine.test.ts`

**Interfaces:**
- Consumes: `WordRole` from `@/components/about/statement-tokens`.
- Produces:
  ```ts
  // teleprompter-config.ts
  export const TELEPROMPTER: {
    focalPosition: number;   // 0.6  × vh
    focalRange: number;      // 0.24 × vh
    blurAbove: number;       // 7 px
    blurBelow: number;       // 2 px
    opacityAbove: number;    // 0.5
    opacityBelow: number;    // 0.14
    weightFloor: number;     // 400
    weightAmbient: number;   // 440
    weightEmphasis: number;  // 780
    stageHeightVh: number;   // 640
    dotRest: number;         // 6 px
    dotActive: number;       // 9 px
  };

  // teleprompter-engine.ts
  export function smoothstep(edge0: number, edge1: number, x: number): number;
  export function focusFor(delta: number, focalRange: number): number;
  export function blockStyle(delta: number, focus: number): { blur: number; opacity: number };
  export function wordWeight(role: WordRole, focus: number): number;
  export function activeCenter(first: number, last: number, progress: number): number;
  ```
  Task 4 calls all of these.

- [ ] **Step 1: Write the failing test**

Create `src/components/about/teleprompter-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  activeCenter, blockStyle, focusFor, smoothstep, wordWeight,
} from "@/components/about/teleprompter-engine";
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";

describe("smoothstep", () => {
  it("clamps outside the edges and eases between them", () => {
    expect(smoothstep(0, 10, -5)).toBe(0);
    expect(smoothstep(0, 10, 15)).toBe(1);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
    expect(smoothstep(0, 10, 2.5)).toBeCloseTo(0.15625, 5);
  });
});

describe("focusFor", () => {
  it("is 1 at the focal center and 0 at the edge of the range", () => {
    expect(focusFor(0, 240)).toBe(1);
    expect(focusFor(240, 240)).toBe(0);
    expect(focusFor(-240, 240)).toBe(0);
  });

  it("is symmetric — distance decides focus, not direction", () => {
    expect(focusFor(-100, 240)).toBe(focusFor(100, 240));
  });
});

describe("blockStyle", () => {
  /* The asymmetry is the design: words ABOVE the focus (already read,
     delta < 0) blur hard but stay present; words BELOW (not yet read) stay
     sharp but recede. Read words go soft; unread words fade. */
  it("blurs already-read blocks harder than unread ones", () => {
    expect(blockStyle(-100, 0).blur).toBe(T.blurAbove);
    expect(blockStyle(100, 0).blur).toBe(T.blurBelow);
    expect(T.blurAbove).toBeGreaterThan(T.blurBelow);
  });

  it("keeps already-read blocks more visible than unread ones", () => {
    expect(blockStyle(-100, 0).opacity).toBe(T.opacityAbove);
    expect(blockStyle(100, 0).opacity).toBe(T.opacityBelow);
    expect(T.opacityAbove).toBeGreaterThan(T.opacityBelow);
  });

  it("resolves to sharp and opaque at full focus, from either side", () => {
    expect(blockStyle(-100, 1)).toEqual({ blur: 0, opacity: 1 });
    expect(blockStyle(100, 1)).toEqual({ blur: 0, opacity: 1 });
  });
});

describe("wordWeight", () => {
  /* Base is 400, NOT 440 — the README says 440, the prototype lerps from 400
     and 440 is the ambient TARGET (spec conflict register #6). */
  it("starts every role at the 400 floor when unfocused", () => {
    expect(wordWeight("ambient", 0)).toBe(T.weightFloor);
    expect(wordWeight("emphasis", 0)).toBe(T.weightFloor);
    expect(wordWeight("italic", 0)).toBe(T.weightFloor);
  });

  it("drives emphasis far heavier than ambient at full focus", () => {
    expect(wordWeight("ambient", 1)).toBe(T.weightAmbient);
    expect(wordWeight("emphasis", 1)).toBe(T.weightEmphasis);
    expect(wordWeight("italic", 1)).toBe(T.weightAmbient);
  });

  it("interpolates linearly with focus", () => {
    expect(wordWeight("emphasis", 0.5)).toBe((T.weightFloor + T.weightEmphasis) / 2);
  });
});

describe("activeCenter", () => {
  it("sweeps from the first block to the last across the scroll", () => {
    expect(activeCenter(100, 900, 0)).toBe(100);
    expect(activeCenter(100, 900, 1)).toBe(900);
    expect(activeCenter(100, 900, 0.5)).toBe(500);
  });
});

describe("TELEPROMPTER config", () => {
  /* These are tunables, not literals — Jono adjusts them by feel and that must
     stay a one-line edit in one file (spec §8). */
  it("carries the prototype's values", () => {
    expect(T.focalPosition).toBe(0.6);
    expect(T.focalRange).toBe(0.24);
    expect(T.blurAbove).toBe(7);
    expect(T.blurBelow).toBe(2);
    expect(T.opacityAbove).toBe(0.5);
    expect(T.opacityBelow).toBe(0.14);
    expect(T.weightFloor).toBe(400);
    expect(T.weightAmbient).toBe(440);
    expect(T.weightEmphasis).toBe(780);
    expect(T.stageHeightVh).toBe(640);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/components/about/teleprompter-engine.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the config**

Create `src/components/about/teleprompter-config.ts`:

```ts
/**
 * Every number the teleprompter uses (spec §8). Tunables, not literals — Jono
 * adjusts these by feel after watching it move, and that must stay a one-line
 * edit in one file. The values are the Portfolio v2 prototype's verbatim.
 */
export const TELEPROMPTER = {
  /** × vh — where the focused line sits. */
  focalPosition: 0.6,
  /** × vh — falloff radius either side of the focus. */
  focalRange: 0.24,

  /* The asymmetry IS the design. Words above the focus are already read: they
     blur hard but hold presence. Words below are not yet read: they stay sharp
     but recede. */
  /** px at zero focus, already-read. */
  blurAbove: 7,
  /** px at zero focus, not-yet-read. */
  blurBelow: 2,
  /** floor at zero focus, already-read. */
  opacityAbove: 0.5,
  /** floor at zero focus, not-yet-read. */
  opacityBelow: 0.14,

  /* 400 is the FLOOR every role starts from; 440 is ambient's target. The
     handoff README calls the range "440 → 780", which is wrong (spec's
     conflict register #6). */
  weightFloor: 400,
  weightAmbient: 440,
  weightEmphasis: 780,

  /** vh — the tall wrapper that drives the sticky stage. */
  stageHeightVh: 640,

  /** px — the right rail's dots. */
  dotRest: 6,
  dotActive: 9,
} as const;
```

- [ ] **Step 4: Write the engine**

Create `src/components/about/teleprompter-engine.ts`:

```ts
/**
 * The teleprompter's maths (spec §8) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `theme-engine.ts` house style, spec §14).
 * The hook measures and writes; it holds no numbers.
 */
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";
import type { WordRole } from "@/components/about/statement-tokens";

/** The classic smoothstep: clamped, then eased with t²(3−2t). */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 1 at the focal center, easing to 0 at `focalRange` away, either side. */
export function focusFor(delta: number, focalRange: number): number {
  return 1 - smoothstep(0, focalRange, Math.abs(delta));
}

/**
 * A block's blur and opacity, from its signed distance to the focus.
 * `delta < 0` means the block sits ABOVE the focus — already read.
 */
export function blockStyle(delta: number, focus: number): { blur: number; opacity: number } {
  const above = delta < 0;
  const slack = 1 - focus;
  return {
    blur: slack * (above ? T.blurAbove : T.blurBelow),
    opacity: (above ? T.opacityAbove : T.opacityBelow) + focus * (1 - (above ? T.opacityAbove : T.opacityBelow)),
  };
}

/** A word's variable weight, from its role and its block's focus. */
export function wordWeight(role: WordRole, focus: number): number {
  const target = role === "emphasis" ? T.weightEmphasis : T.weightAmbient;
  return T.weightFloor + (target - T.weightFloor) * focus;
}

/** The focal center sweeps the column from the first block to the last. */
export function activeCenter(first: number, last: number, progress: number): number {
  return first + (last - first) * progress;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test src/components/about/teleprompter-engine.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Prove the config test can fail**

The config test is the only thing pinning Jono's tunables. Temporarily change `blurAbove` to `8`, run the test, confirm it FAILS, restore. Report what you saw. A test nobody has seen fail is not evidence.

- [ ] **Step 7: Commit**

```bash
git add src/components/about/teleprompter-config.ts src/components/about/teleprompter-engine.ts src/components/about/teleprompter-engine.test.ts
git commit -m "feat(about): the teleprompter's focus engine

Pure maths for the scroll-driven focal zone (spec §8): smoothstep,
per-block blur/opacity from signed distance, per-word weight from role
and focus. No DOM, no React — the theme-engine.ts house style.

Every number lives in teleprompter-config.ts as a tunable. Jono adjusts
these by feel; that must stay a one-line edit in one file.

Two values are the prototype's, not the README's: the weight floor is
400 (the README's '440 → 780' mistakes ambient's TARGET for the floor),
and the blur/opacity asymmetry is real — already-read words blur hard
but hold presence, unread words stay sharp but recede."
```

---

### Task 4: The stage

The component: a tall wrapper driving a sticky stage, the column translated so the focal center tracks the scroll.

**Files:**
- Modify: `src/components/about/about.tsx`, `src/components/about/about.module.css`, `src/lib/site-content.ts`
- Create: `src/components/about/about-data.ts`, `src/components/about/use-teleprompter.ts`
- Test: `src/components/about/about.test.tsx` (create)

**Interfaces:**
- Consumes: `TELEPROMPTER` from `@/components/about/teleprompter-config`; `activeCenter`, `blockStyle`, `focusFor`, `wordWeight` from `@/components/about/teleprompter-engine`; `Statement` from `@/components/about/statement-tokens`; `useReducedMotionPref` from `@/lib/use-reduced-motion`; `ScrollTrigger` from `@/lib/gsap`.
- Produces:
  ```ts
  // about-data.ts
  export interface AboutPage { title: string; lede: string; statements: Statement[] }
  export const aboutPage: AboutPage;
  ```

> **`about.tsx` must NOT import `#site/content` directly.** It reads `aboutPage` from `about-data.ts`, a two-line glue module — exactly what `work-data.ts` is for `work-lists.ts`. That is what keeps the content module out of what is unit-tested: `.velite/` is generated and git-ignored, and `vitest.config.ts` aliases only `@`, so a test that pulls in `#site/content` fails on a clean checkout until someone runs `pnpm build`. The component test mocks `about-data`.

**The mechanic** (spec §8, the prototype's `update()`):

```js
focalY     = vh * TELEPROMPTER.focalPosition        // 0.6
focalRange = vh * TELEPROMPTER.focalRange           // 0.24
lp         = clamp(-wrapRect.top / (wrapH - vh), 0, 1)
center     = activeCenter(firstBlockCenter, lastBlockCenter, lp)
column.style.transform = `translateY(${focalY - center}px)`

// per block:
delta   = block.center - center
focus   = focusFor(delta, focalRange)
{ blur, opacity } = blockStyle(delta, focus)

// per word:
color  = mix(--dim, role === "ambient" ? --about : --ink, focus)
weight = wordWeight(role, focus)
```

- [ ] **Step 1: Add the copy that stays in site-content**

The statements and title now live in MDX, but the rail's accessible name does not. In `src/lib/site-content.ts`, inside `labels`, add:

```ts
    aboutRail: "Jump to a statement",
```

Then **delete** `siteContent.about.lede` and the whole `beats: [...]` array — both now live in `content/site/about.mdx`. Leave `siteContent.titles.about` alone: it is the **nav** label ("About"), which stays.

> Do not delete `about.trayHint`, `about.ctas`, or `about.secondary` in this task even though they are dead — that is unrelated cleanup and belongs in whichever phase decides the About CTAs. **Do not touch `links.*`**: Phase 5's contact footer needs them.

- [ ] **Step 2: Write the failing test**

Create `src/components/about/about.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Statement } from "@/components/about/statement-tokens";

/* Mock the glue, not the content module. `.velite/` is generated and
   git-ignored, and vitest aliases only `@` — importing #site/content here
   would make `pnpm test` fail on a clean checkout until someone ran
   `pnpm build`. work-data.ts exists for exactly this reason. */
const fixture: { title: string; lede: string; statements: Statement[] } = {
  title: "Who I am.",
  lede: "A short lede.",
  statements: [
    [
      { text: "I", role: "ambient" },
      { text: "work", role: "ambient" },
      { text: "at", role: "ambient" },
      { text: "Meta.", role: "emphasis" },
    ],
    [
      { text: "Available", role: "emphasis" },
      { text: "now.", role: "emphasis" },
    ],
  ],
};
vi.mock("@/components/about/about-data", () => ({ aboutPage: fixture }));

const { About } = await import("@/components/about/about");

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

describe("About", () => {
  it("renders the locked section title from MDX, not the nav label", () => {
    render(<About />);
    expect(screen.getByRole("heading", { name: "Who I am." })).toBeTruthy();
  });

  it("renders every statement's every word as its own span", () => {
    const { container } = render(<About />);
    const expected = fixture.statements.reduce((n, st) => n + st.length, 0);
    expect(container.querySelectorAll("[data-word]").length).toBe(expected);
  });

  /* The words are laid out in a flex row with a column-gap and carry no
     whitespace between them (spec §5). If the spans were joined by text
     nodes the spacing would double. But the statement must still read as
     one sentence to a screen reader. */
  it("reads each statement as one accessible sentence", () => {
    const { container } = render(<About />);
    const first = container.querySelector("[data-statement]");
    const text = fixture.statements[0].map((w) => w.text).join(" ");
    expect(first?.textContent?.replace(/\s+/g, " ").trim()).toBe(text);
  });

  it("keeps the landmark named", () => {
    const { container } = render(<About />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("aria-labelledby")).toBe("about-title");
    expect(container.querySelector("#about-title")).toBeTruthy();
  });

  /* Reduced motion gets the whole thing at rest — every statement legible at
     once, no focal zone, no sticky stage. Established by CSS, never by a
     post-hydration effect (Phase 2 shipped that bug). */
  it("marks the stage inert under reduced motion", () => {
    matchMediaReduced(true);
    const { container } = render(<About />);
    expect(container.querySelector("section")?.getAttribute("data-static")).toBe("");
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm test src/components/about/about.test.tsx`
Expected: FAIL — the stub renders "About" and has no `[data-word]` spans.

- [ ] **Step 4: Write the hook**

Create `src/components/about/use-teleprompter.ts`:

```ts
"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";
import { activeCenter, blockStyle, focusFor, wordWeight } from "@/components/about/teleprompter-engine";
import type { WordRole } from "@/components/about/statement-tokens";

interface Opts {
  wrapRef: RefObject<HTMLElement | null>;
  columnRef: RefObject<HTMLElement | null>;
  active: boolean;
  onActiveStatement?: (index: number) => void;
}

/**
 * The teleprompter (spec §8). A tall wrapper drives a sticky stage; the column
 * is translated so the focal center tracks the scroll, and each block's words
 * resolve as they pass through it.
 *
 * Runs on ScrollTrigger — the shared GSAP ticker that also drives Lenis. No
 * second RAF loop: a competing one has silently locked scrolling on this site.
 *
 * Every color is READ FROM THE TOKEN LAYER, never hardcoded. The prototype
 * interpolates toward the string literals '#0d0d0d' and '#bcbcbc'; ported that
 * way, dark mode breaks silently — emphasized words would resolve to near-black
 * on a black canvas (spec §3).
 */
export function useTeleprompter({ wrapRef, columnRef, active, onActiveStatement }: Opts): void {
  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const column = columnRef.current;
    if (!wrap || !column) return;

    const blocks = [...column.querySelectorAll<HTMLElement>("[data-statement]")].map((el) => ({
      el,
      words: [...el.querySelectorAll<HTMLElement>("[data-word]")],
      center: 0,
    }));
    if (blocks.length === 0) return;

    /* Resolved once per theme change, not per frame: reading a custom property
       off <html> is a style read, and this runs on every scrub frame. */
    let dim = "", ink = "", accent = "";
    const readTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      dim = cs.getPropertyValue("--dim").trim();
      ink = cs.getPropertyValue("--ink").trim();
      accent = cs.getPropertyValue("--about").trim();
    };

    let measured = false;
    const measure = () => {
      for (const b of blocks) b.center = b.el.offsetTop + b.el.offsetHeight / 2;
      measured = blocks.length > 0;
    };

    const apply = (progress: number) => {
      /* An explicit flag, not `if (!first) return`: the prototype guards on the
         first block's center being truthy, so a center of exactly 0 silently
         kills the whole section (spec §8). */
      if (!measured) return;
      const vh = window.innerHeight;
      const focalY = vh * T.focalPosition;
      const focalRange = vh * T.focalRange;
      const center = activeCenter(blocks[0].center, blocks[blocks.length - 1].center, progress);
      column.style.transform = `translateY(${(focalY - center).toFixed(1)}px)`;

      let nearest = 0;
      let nearestDist = Infinity;
      blocks.forEach((b, i) => {
        const delta = b.center - center;
        const focus = focusFor(delta, focalRange);
        const { blur, opacity } = blockStyle(delta, focus);
        b.el.style.opacity = opacity.toFixed(3);
        b.el.style.filter = blur > 0.12 ? `blur(${blur.toFixed(1)}px)` : "none";
        for (const w of b.words) {
          const role = (w.dataset.word ?? "ambient") as WordRole;
          w.style.color = mix(dim, role === "ambient" ? accent : ink, focus);
          w.style.fontVariationSettings = `"wght" ${Math.round(wordWeight(role, focus))}`;
        }
        const d = Math.abs(delta);
        if (d < nearestDist) { nearestDist = d; nearest = i; }
      });
      onActiveStatement?.(nearest);
    };

    readTokens();
    measure();

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefreshInit: () => { readTokens(); measure(); },
      onRefresh: (self) => apply(self.progress),
    });

    /* Config Variable and Mae change the blocks' heights, so a pre-font
       measurement puts every center in the wrong place. */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    /* The theme toggle swaps the tokens the words interpolate toward. */
    const themeObserver = new MutationObserver(() => { readTokens(); apply(st.progress); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      st.kill();
      themeObserver.disconnect();
      column.style.transform = "";
      for (const b of blocks) {
        b.el.style.opacity = "";
        b.el.style.filter = "";
        for (const w of b.words) { w.style.color = ""; w.style.fontVariationSettings = ""; }
      }
    };
  }, [active, wrapRef, columnRef, onActiveStatement]);
}

/** Per-channel lerp between two `#rrggbb` strings. */
function mix(from: string, to: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  if (from.length < 7 || to.length < 7) return to;
  const out = [0, 1, 2].map((i) => Math.round(ch(from, i) + (ch(to, i) - ch(from, i)) * t));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}
```

- [ ] **Step 5: Write the component**

Replace `src/components/about/about.tsx`:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { aboutPage } from "@/components/about/about-data";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useTeleprompter } from "@/components/about/use-teleprompter";
import styles from "@/components/about/about.module.css";

/**
 * About, the teleprompter (spec §8). A 640vh wrapper drives a sticky 100vh
 * stage; the statements translate through a fixed focal zone and resolve word
 * by word as they pass it.
 *
 * The copy — and which words land heavy — lives in content/site/about.mdx.
 * Nothing here knows the words.
 */
export function About() {
  const reduced = useReducedMotionPref();
  const wrapRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [activeStatement, setActiveStatement] = useState(0);
  const onActiveStatement = useCallback((i: number) => setActiveStatement(i), []);

  useTeleprompter({ wrapRef, columnRef, active: !reduced, onActiveStatement });

  return (
    <section
      className={styles.about}
      id="about"
      aria-labelledby="about-title"
      /* Under reduced motion the stage is inert: no sticky wrapper, no focal
         zone, every statement legible at once. CSS does the whole job off this
         attribute — never a post-hydration effect, which would flash the
         animated state first (spec §11). */
      data-static={reduced ? "" : undefined}
    >
      <div ref={wrapRef} className={styles.wrap}>
        <div className={styles.stage}>
          <h2 className={styles.title} id="about-title">
            {aboutPage.title}
          </h2>

          <div ref={columnRef} className={styles.column}>
            <p className={styles.lede}>{aboutPage.lede}</p>
            {aboutPage.statements.map((statement, i) => (
              <p key={i} data-statement className={styles.statement}>
                {statement.map((word, j) => (
                  <span key={j} data-word={word.role} className={styles.word}>
                    {word.text}
                  </span>
                ))}
              </p>
            ))}
          </div>

          <ol className={styles.rail} aria-label={siteContent.labels.aboutRail}>
            {aboutPage.statements.map((_, i) => (
              <li
                key={i}
                className={styles.dot}
                data-active={i === activeStatement ? "" : undefined}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

> `data-word={word.role}` carries the role into the DOM so the hook reads it back without a second source of truth. The spans have **no whitespace between them** — the CSS `column-gap` does the spacing (spec §5).

- [ ] **Step 6: Write the styles**

Replace `src/components/about/about.module.css`:

```css
.about {
  position: relative;
}

/* The tall wrapper is the scroll budget: 640vh drives a sticky 100vh stage,
   so 540vh of scroll sweeps the focal center from the first statement to the
   last (spec §8). */
.wrap {
  height: 640vh;
}

.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
  padding: 0 6vw;
}

.title {
  position: absolute;
  top: 13vh;
  left: 6vw;
  z-index: 8;
  font-size: clamp(2.6rem, 7vw, 6.5rem);
  font-variation-settings: "wght" 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--about);
}

.column {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 6vw;
  will-change: transform;
}

.lede {
  max-width: 52ch;
  font-size: clamp(1.15rem, 1.9vw, 1.72rem);
  line-height: 1.34;
  color: var(--ink);
}

/* The statement measure is NOT 30ch — that was the Phase 1 stub borrowing the
   work card's impact measure by mistake. The prototype runs statements near
   full width. */
.statement {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.26em;
  row-gap: 0.02em;
  max-width: 62ch;
  margin-top: 0.9em;
  font-size: clamp(1.4rem, 2.5vw, 2.5rem);
  line-height: 1.18;
}

/* The spans carry no whitespace between them — column-gap above does the
   spacing, so a word never separates from its punctuation. */
.word {
  display: inline-block;
  white-space: pre;
}

.word[data-word="italic"] {
  font-style: italic;
}

.rail {
  position: absolute;
  right: 6vw;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--dim);
  transition: all 0.4s ease;
}

.dot[data-active] {
  width: 9px;
  height: 9px;
  background: var(--about);
}

/* Reduced motion: the whole section at rest and legible at once. No sticky
   stage, no focal zone, no scroll budget. This is CSS so it is correct at
   FIRST PAINT — a post-hydration effect would flash the animated state, which
   is the bug Phase 2 shipped and fixed (spec §11). */
@media (prefers-reduced-motion: reduce) {
  .wrap {
    height: auto;
  }

  .stage {
    position: static;
    height: auto;
    overflow: visible;
    padding: 16vh 0 10vh;
  }

  .title,
  .column,
  .rail {
    position: static;
    transform: none;
  }

  .rail {
    display: none;
  }

  .statement {
    opacity: 1 !important;
    filter: none !important;
  }

  .word {
    color: var(--about) !important;
    font-variation-settings: "wght" 440 !important;
  }

  .word[data-word="emphasis"] {
    color: var(--ink) !important;
    font-variation-settings: "wght" 780 !important;
  }

  .word[data-word="italic"] {
    color: var(--ink) !important;
  }
}
```

> The `!important`s are load-bearing and confined to the reduced-motion block: the hook writes inline styles, and an inline style beats a stylesheet rule. Under reduced motion the hook never runs (`active: false`), so these only fight styles left behind by a live toggle from normal → reduced. Without them, a visitor who flips the OS setting mid-session keeps whatever inline values the last frame wrote.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
pnpm test src/components/about/about.test.tsx
pnpm test
pnpm build
pnpm lint
```
Expected: all clean. Count up from 82.

- [ ] **Step 8: Verify it in a browser — the whole point**

Confirm the dev server's listener postdates your commit (`lsof -ti:3000 -sTCP:LISTEN`, then `ps -p <pid> -o lstart=`). If stale or absent: kill it, `rm -rf .next`, start fresh.

1. **The read.** Scroll `/` slowly through About. Expected: statements rise through a focal zone at 60% viewport height; the focused one is crisp green with its bold words in near-black at weight 780; statements above are blurred but still present; statements below are sharp but faint. The rail's dot tracks the focused statement.
2. **The inverted roles — verify explicitly.** Read back `getComputedStyle` on an `[data-word="ambient"]` and an `[data-word="emphasis"]` span in the *focused* statement. **Expected: ambient ≈ `--about` green, emphasis ≈ `--ink`.** If ambient is ink and emphasis is green, the roles are backwards — that is the README's version and it is wrong.
3. **Dark mode.** Toggle. The words must interpolate toward the DARK tokens — emphasis should go near-**white**, not near-black. If emphasis is invisible on black, the hook hardcoded a hex instead of reading the token layer.
4. **Reduced motion.** Emulate `prefers-reduced-motion: reduce` and **sample the timeline from `waitUntil: 'commit'`**, not the settled state. Expected at EVERY sample including the first: all four statements legible at once, no blur, no sticky stage, rail hidden. A settled-state read cannot see a pre-hydration flash.
5. **The scroll budget.** Confirm the section is ~640vh tall under normal motion and `height: auto` under reduced motion.

Report what you actually observed at each step, with values.

- [ ] **Step 9: Commit**

```bash
git add src/components/about/about.tsx src/components/about/about.module.css src/components/about/use-teleprompter.ts src/components/about/about.test.tsx src/lib/site-content.ts
git commit -m "feat(about): the teleprompter

A 640vh wrapper drives a sticky 100vh stage; statements translate
through a focal zone at 60% viewport height and resolve word by word as
they pass it (spec §8). The rail tracks the focused statement.

The roles are the prototype's, not the README's: ambient words take the
ACCENT, emphasized words go to INK at 780. A field of green with black
bold hits.

Every color is read from the token layer, never hardcoded — the
prototype interpolates toward '#0d0d0d' and '#bcbcbc' as string
literals, which would break dark mode silently (spec §3).

Reduced motion is CSS, not an effect: the stage is inert and every
statement legible at once, correct at first paint.

The statements' copy and title now come from content/site/about.mdx;
site-content.ts sheds beats and about.lede."
```

---

## Phase 3 exit criteria

- [ ] `pnpm test`, `pnpm build`, `pnpm lint` clean; `git status` empty.
- [ ] The statements read as a teleprompter: focal zone at 60% vh, already-read blurred-but-present, unread sharp-but-faint.
- [ ] **Ambient words are green, emphasized words are ink at 780** — verified on computed style, not assumed.
- [ ] Dark mode: emphasized words go near-white, not near-black.
- [ ] Reduced motion: every statement legible at once, at every sample from `commit` — no flash.
- [ ] Editing `content/site/about.mdx` changes the copy AND which words land heavy, with no code change.
- [ ] The title reads "Who I am." (nav still says "About").
- [ ] **Jono has looked at the pixels** in both themes.

## Deliberately out of scope

- Work (Phase 4) and Contact (Phase 5).
- The About CTAs: `about.trayHint`, `about.ctas`, `about.secondary` are dead copy in `site-content.ts`. Whichever phase decides About's footer cuts them. **Do not cut `links.*` — Phase 5's contact footer needs them.**
- `welcome.mdx` and `contact.mdx`: spec §5 lists them in the `site` collection, but Welcome's copy is two micro-strings and Contact is unbuilt. Phase 5 adds them; the collection's `pattern` already accepts them.
