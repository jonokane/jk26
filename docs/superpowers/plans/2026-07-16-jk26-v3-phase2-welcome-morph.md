# jk26-v3 Phase 2: Welcome + nav morph — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Welcome stub into the designed hero — a living-gradient wordmark that assembles on load and then flies into the nav as you scroll — and give the nav its glass.

**Architecture:** Four self-contained tasks, each independently visible. The nav gets its glass by consuming two palette tokens that already exist but are orphaned. The wordmark's gradient and build-in are CSS + a small mount effect on the letters the Phase 1 stub already renders. The morph reuses the kept `use-wordmark-morph.ts`, mounted against an in-flow anchor and a fixed fly copy, and takes `header-on` back from Phase 1's temporary stand-in.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS-first) · GSAP ScrollTrigger on the shared Lenis ticker · Vitest + Testing Library · pnpm.

**Spec:** `docs/superpowers/specs/2026-07-16-stark-visual-language-design.md` — §6 (Welcome), §7 (Nav + morph).
**Ground truth for values:** `docs/notes/jk26-v3-handoff/prototypes/Portfolio v2.dc.html`. Where it and the README disagree, the prototype's code wins (spec's conflict register).
**Base:** branch `jk26-v3` at `54e6e27` (Phase 1 complete: 56 tests, build + lint clean).

## Global Constraints

- **pnpm only.** Never npm/yarn. **No new dependencies** — everything needed is installed.
- **`pnpm test`** — package.json declares `"test": "vitest run"`, already non-watch. Never `pnpm test run` (passes `run` as a filename filter, matches nothing, exits 1). One file: `pnpm test <path>`.
- `pnpm build`, `pnpm test`, `pnpm lint` must all be clean before every commit. Baseline: **56 tests / 9 files**.
- **Never `git add -A`** — stage only intended files. Root `*.png` is gitignored; a stray `add -A` once swept 26 MiB of screenshots into a docs commit.
- **After every commit `git status --porcelain` must be EMPTY.** A Phase 1 implementer reported "build ✅" measured against its own dirty tree while the commit itself failed with 10 "Module not found" errors. Evidence must reflect what was COMMITTED.
- **Content never lives in JSX.** Every visitor-facing string, including accessible names, comes from `src/lib/site-content.ts` or MDX.
- **Design decisions live in CSS**, as custom properties mapped by `@theme` in `globals.css`. Note: unlayered rules beat anything in an `@layer`.
- **No second RAF loop.** Lenis is driven from GSAP's ticker as one loop (`smooth-scroll.tsx`). Use `ScrollTrigger` from `@/lib/gsap`. A competing loop has silently locked scrolling on this site before.
- **Do not change any palette hex.** Both palettes are locked and hand-edited by Jono.
- **Do not touch:** `content/**`, `smooth-scroll.tsx`, `gsap.ts`, `mdx-content.tsx`, `hash-scroll.tsx`, `use-reduced-motion.ts`, `fonts-ready.tsx`, `api/contact/route.ts`, `velite.config.ts`, `theme-engine.ts`, `pre-hydration-theme.ts`.
- **Reduced motion is a first-class path, not an afterthought.** The prototypes gate almost nothing; this phase fixes three of their bugs rather than porting them.

## Verifying visual work (this phase is nearly all visual)

- **Look at the rendered pixels**, in light and dark, before calling anything done.
- **Reachability is never `element.click()`** — it fires on hidden elements. Ask `document.elementFromPoint(rect centre)`. A whole nav was invisible on `/` in Phase 1 while a scripted click "passed".
- **Check the dev server postdates your commit.** Stale `next-server` processes have served days-old CSS twice on this project. If one is running, confirm its start time; otherwise `rm -rf .next` and restart.
- Verify reduced motion by emulating it, not by reading the code.

---

### Task 1: Nav glass

The nav's semi-transparent blur (spec §7). `--nav-glass` and `--nav-edge` are already declared in **both** palettes but consumed nowhere — the header currently sets `background: var(--scrim)`, a **deleted** scene token that resolves to nothing, so it renders fully transparent. Jono called this out explicitly.

**Files:**
- Modify: `src/components/site-header.module.css`
- Test: `src/app/globals.css.test.ts` (extend)

**Interfaces:**
- Consumes: `--nav-glass`, `--nav-edge` from `globals.css` (light: `rgba(255,255,255,0.6)` / `rgba(15,15,15,0.06)`; dark: `rgba(0,0,0,0.6)` / `rgba(255,255,255,0.08)`).
- Produces: nothing later tasks import.

- [ ] **Step 1: Write the failing test**

The palettes declare these tokens; nothing proved they were ever *used*. That is exactly how they sat orphaned through all of Phase 1. Add to `src/app/globals.css.test.ts`:

```ts
import { readFileSync as readFile } from "node:fs";
import path2 from "node:path";

const headerCss = readFile(
  path2.resolve(__dirname, "../components/site-header.module.css"),
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/app/globals.css.test.ts`
Expected: FAIL — the header contains no `var(--nav-glass)` and still contains `--scrim`.

- [ ] **Step 3: Apply the glass**

In `src/components/site-header.module.css`, find the `.site-header` rule (it currently has `background: transparent`) and the rule setting `background: var(--scrim)`. Replace the background treatment so `.site-header` carries:

```css
  background: var(--nav-glass);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--nav-edge);
```

Delete the `background: var(--scrim)` rule entirely (`--scrim` no longer exists). Keep the existing `position: fixed`, `z-index`, padding, and the `header-on` opacity/transform transition untouched — those already match spec §7.

Values are the prototype's verbatim (`Portfolio v2.dc.html`, `#nav`). Both themes work automatically: the tokens already flip on `[data-theme="dark"]`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/app/globals.css.test.ts`
Expected: PASS.

- [ ] **Step 5: Look at it, in both themes**

Start (or confirm) the dev server, load `/`, scroll past 0.85×vh so the nav appears. Expected: the nav reads as frosted glass — page content visibly blurred behind it, with a hairline bottom edge. Toggle to dark and confirm the glass inverts (dark translucent, light hairline) rather than staying white.

Report what you actually see. If the blur is imperceptible because nothing is scrolling under the nav yet, scroll to a section with text beneath it.

- [ ] **Step 6: Commit**

```bash
git add src/components/site-header.module.css src/app/globals.css.test.ts
git commit -m "feat(nav): the glass — consume the orphaned nav tokens

--nav-glass and --nav-edge shipped in both palettes in Phase 1 but
nothing consumed them; .site-header set background: var(--scrim), a
scene token deleted in the same phase, so the nav rendered fully
transparent.

blur(20px) saturate(1.4) + a --nav-edge hairline, verbatim from the
Portfolio v2 prototype (spec §7). The test asserts the tokens are
CONSUMED, not merely declared — the gap that let them sit orphaned."
```

---

### Task 2: The living gradient

Each letter filled with a drifting three-accent gradient (spec §6). This is Welcome's identity: it owns no single accent, so the gradient previews all three.

**Files:**
- Modify: `src/components/hero/hero.module.css`
- Test: `src/components/hero/hero.test.tsx` (create)

**Interfaces:**
- Consumes: `--about`, `--work`, `--contact` from `globals.css`; the `.letter` spans already rendered by `hero.tsx`.
- Produces: a `.letter` class that Task 3's build-in and Task 4's fly copy both rely on.

- [ ] **Step 1: Write the failing test**

Create `src/components/hero/hero.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/components/hero/hero.test.tsx`
Expected: FAIL — `hero.module.css` has no `.letter` rule at all (Phase 1 left `styles.letter` resolving to `undefined`).

- [ ] **Step 3: Add the gradient**

Append to `src/components/hero/hero.module.css`. Values verbatim from the prototype's `.wm .l`:

```css
/* Each letter carries its own gradient — never the container. The letters are
   transformed during the build-in (Task 3), and a container-level
   background-clip: text makes them invisible while transformed (spec §6). */
.letter {
  background: linear-gradient(
    92deg,
    var(--about) 0%,
    var(--work) 40%,
    var(--contact) 74%,
    var(--about) 100%
  );
  background-size: 280% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: drift 9s ease-in-out infinite;
}

/* Negative delays offset each letter into the SAME 9s loop, so colour travels
   through the word instead of eight letters pulsing in unison. */
.letter:nth-child(1) { animation-delay: 0s; }
.letter:nth-child(2) { animation-delay: -0.6s; }
.letter:nth-child(3) { animation-delay: -1.2s; }
.letter:nth-child(4) { animation-delay: -1.8s; }
.letter:nth-child(5) { animation-delay: -2.4s; }
.letter:nth-child(6) { animation-delay: -3s; }
.letter:nth-child(7) { animation-delay: -3.6s; }
.letter:nth-child(8) { animation-delay: -4.2s; }

/* The gradient returns to --about at 100% so the 280% pan is seamless. */
@keyframes drift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .letter {
    animation: none;
    /* Rest at a mid-phase fill rather than the 0% edge, so the word still
       reads as multi-hue rather than flat green. */
    background-position: 50% 50%;
  }
}
```

The `.wordmark` rule keeps `color: var(--ink)` — it is the fallback if `background-clip: text` is unsupported, and it is what the letters inherit before the gradient paints.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/components/hero/hero.test.tsx`
Expected: PASS, all seven cases.

- [ ] **Step 5: Look at it, in both themes**

Load `/`. Expected: JONOKANE filled with a green→violet→teal sweep that visibly travels through the word on a 9s loop, not eight letters pulsing together. Confirm in dark that the lifted accents read (they are `#57c46a` / `#9d86f0` / `#5ab6cb` there).

Then emulate `prefers-reduced-motion: reduce` and reload. Expected: the gradient is static and multi-hue — not animating, not flat.

- [ ] **Step 6: Commit**

```bash
git add src/components/hero/hero.module.css src/components/hero/hero.test.tsx
git commit -m "feat(hero): the living gradient

Each letter carries its own three-accent gradient on a 9s drift, with
negative per-letter delays so colour travels through the word. Welcome
owns no single accent; the gradient previews all three (spec §6).

The gradient is per-letter by necessity, not preference: the letters are
transformed during the build-in and a container-level background-clip
makes them vanish mid-flight. A test pins that.

Gates drift behind prefers-reduced-motion, which the prototype never
does (spec §6, bug 3). Also gives .letter a real rule — Phase 1 left
hero.tsx referencing a class that did not exist."
```

---

### Task 3: The build-in

The wordmark assembles on load: letters resolve from oversized and blurred, eyebrow leads, tagline and scroll cue follow (spec §6).

**Files:**
- Modify: `src/components/hero/hero.tsx`, `src/components/hero/hero.module.css`
- Create: `src/components/hero/hero-config.ts`
- Test: `src/components/hero/hero.test.tsx` (extend)

**Interfaces:**
- Consumes: `useReducedMotionPref()` from `@/lib/use-reduced-motion`.
- Produces: `HERO_BUILD` from `src/components/hero/hero-config.ts`:
  ```ts
  export const HERO_BUILD: {
    letterStaggerMs: number;   // 80
    letterLeadMs: number;      // 300
    settleMs: number;          // 600
    totalMs: (letters: number) => number;
  }
  ```
  Task 4 does not depend on this.

- [ ] **Step 1: Write the failing test**

The choreography constants are tunables, not literals — the same treatment `teleprompter-config.ts` gets in Phase 3. Add to `src/components/hero/hero.test.tsx`:

```tsx
import { HERO_BUILD } from "@/components/hero/hero-config";

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
```

Add these imports and helper at the top of the file:

```tsx
import { waitFor } from "@testing-library/react";

function matchMediaReduced(reduced: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes("reduced-motion"),
    media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

and reset it in the existing `afterEach`: `afterEach(() => { cleanup(); matchMediaReduced(false); });`

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test src/components/hero/hero.test.tsx`
Expected: FAIL — `Cannot find module '@/components/hero/hero-config'`.

- [ ] **Step 3: Write the config**

Create `src/components/hero/hero-config.ts`:

```ts
/**
 * The Welcome build-in's choreography (spec §6). Tunables, not literals —
 * Jono adjusts these by feel, and that must stay a one-line edit in one file.
 * Values are the Portfolio v2 prototype's verbatim.
 */
export const HERO_BUILD = {
  /** Delay before the first letter starts. */
  letterLeadMs: 300,
  /** Added per letter index. */
  letterStaggerMs: 80,
  /** Slack after the last letter starts, before the tagline follows. */
  settleMs: 600,
  /** When the tagline and scroll cue may appear: 0.3 + n*0.08 + 0.6. */
  totalMs(letters: number): number {
    return this.letterLeadMs + letters * this.letterStaggerMs + this.settleMs;
  },
} as const;
```

- [ ] **Step 4: Add the from/to states to CSS**

Append to `src/components/hero/hero.module.css`. The whole build-in keys off a single `data-built` attribute on the section, so no copy can be left stranded in the from-state:

```css
/* From-state. Scoped to [data-built="false"] so the resolved state is the
   DEFAULT — the prototype's bug was an unreset from-state surviving forever
   on whichever copy motion left visible (spec §6, bug 1). */
.hero[data-built="false"] .letter {
  opacity: 0;
  transform: scale(2.5) translateY(-0.06em);
  filter: blur(9px);
}

.letter {
  display: inline-block;
  transform-origin: 50% 62%;
  transition:
    opacity 0.55s ease,
    transform 0.9s cubic-bezier(0.2, 0.85, 0.24, 1),
    filter 0.55s ease;
}

.hero[data-built="false"] .kicker,
.hero[data-built="false"] .tagline,
.hero[data-built="false"] .scrollCue {
  opacity: 0;
  transform: translateY(12px);
}

.kicker,
.tagline,
.scrollCue {
  transition:
    opacity 0.9s ease,
    transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
}

/* The eyebrow leads: it resolves the moment the run starts, with no delay. */
.hero[data-built="true"] .tagline,
.hero[data-built="true"] .scrollCue {
  transition-delay: 0s;
}

@media (prefers-reduced-motion: reduce) {
  .letter,
  .kicker,
  .tagline,
  .scrollCue {
    transition: none;
  }
}
```

> `.letter` already carries the gradient from Task 2 — add these properties to the existing rule rather than declaring `.letter` twice.

- [ ] **Step 5: Wire the choreography**

Replace `src/components/hero/hero.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { HERO_BUILD } from "@/components/hero/hero-config";
import styles from "@/components/hero/hero.module.css";

const LETTERS = siteContent.wordmark.split("");

/**
 * Welcome (spec §6). Letters resolve from oversized + blurred on a stagger;
 * the eyebrow leads; the tagline and scroll cue follow once the run completes.
 *
 * Two deliberate departures from the prototype, both fixing its bugs:
 *  - The whole build keys off ONE `data-built` attribute, so the from-state
 *    is scoped and the resolved state is the default. The prototype resets
 *    the fly copy, which is display:none under reduced motion, leaving the
 *    visible wordmark permanently scale(2.5) + blur(9px) (§6, bug 1).
 *  - The accessible name lives on the <h1> itself, never on a copy motion can
 *    hide (§6, bug 2).
 */
export function Hero() {
  const reduced = useReducedMotionPref();
  const [built, setBuilt] = useState(false);
  const [runDone, setRunDone] = useState(false);

  useEffect(() => {
    if (reduced) {
      setBuilt(true);
      setRunDone(true);
      return;
    }
    /* Next frame, so the from-state paints once before the transition runs. */
    const raf = requestAnimationFrame(() => setBuilt(true));
    const t = setTimeout(() => setRunDone(true), HERO_BUILD.totalMs(LETTERS.length));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [reduced]);

  return (
    <section
      className={styles.hero}
      id="welcome"
      data-built={built ? "true" : "false"}
      data-run-done={runDone ? "true" : "false"}
    >
      <p className={styles.kicker}>{siteContent.kicker}</p>
      <h1 className={styles.wordmark} aria-label={siteContent.wordmark}>
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className={styles.letter}
            aria-hidden="true"
            style={{
              transitionDelay: reduced
                ? "0s"
                : `${(HERO_BUILD.letterLeadMs + i * HERO_BUILD.letterStaggerMs) / 1000}s`,
            }}
          >
            {letter}
          </span>
        ))}
      </h1>
      <p className={styles.tagline}>{siteContent.tagline}</p>
      <p className={styles.scrollCue}>{siteContent.labels.scrollCue}</p>
    </section>
  );
}
```

> `transitionDelay` is per-letter derived state, not a design decision, so it is the one legitimate inline style here — the same call `site-header.tsx` makes for the brand slot's live opacity.

- [ ] **Step 6: Hold the tagline until the run completes**

The tagline and cue must wait for the letters. Add to `hero.module.css`:

```css
/* The tagline and cue hold until the letter run completes (data-run-done),
   even though the section is already data-built. */
.hero[data-run-done="false"] .tagline,
.hero[data-run-done="false"] .scrollCue {
  opacity: 0;
  transform: translateY(12px);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm test src/components/hero/hero.test.tsx`
Expected: PASS, all cases including both reduced-motion assertions.

- [ ] **Step 8: Look at it — this is the check that matters**

Load `/` with a hard reload. Expected: eyebrow appears, then letters resolve left-to-right from big+blurred over ~1s, then the tagline and "scroll" fade up at ~1.54s.

Then **emulate `prefers-reduced-motion: reduce` and hard reload.** Expected: everything is immediately at rest — full-size, sharp, opaque. **Specifically confirm the wordmark is NOT scaled up or blurred.** That is the prototype's exact bug; if you see a giant blurred wordmark, this task has failed. Report what you observe in both modes.

- [ ] **Step 9: Commit**

```bash
git add src/components/hero/hero.tsx src/components/hero/hero.module.css src/components/hero/hero-config.ts src/components/hero/hero.test.tsx
git commit -m "feat(hero): the build-in

Letters resolve from scale(2.5) + blur(9px) on a 0.3 + i*0.08s stagger;
the eyebrow leads; the tagline and scroll cue follow at 1.54s (spec §6).
Constants live in hero-config.ts as tunables, not literals.

Fixes the prototype's reduced-motion bug structurally: the whole build
keys off one data-built attribute, so the RESOLVED state is the default
and the from-state is scoped to [data-built='false']. The prototype
resets the fly copy — which is display:none under reduced motion —
leaving the visible wordmark permanently 2.5x scaled and 9px blurred."
```

---

### Task 4: The morph

The wordmark flies from the hero into the nav as you scroll, and takes `header-on` back from Phase 1's temporary stand-in (spec §7).

**Files:**
- Modify: `src/components/hero/hero.tsx`, `src/components/hero/hero.module.css`, `src/components/hero/use-wordmark-morph.ts`, `src/components/site-header.tsx`
- Test: `src/components/hero/hero.test.tsx` (extend)

**Interfaces:**
- Consumes: `useWordmarkMorph({ liveRef, flowRef, active, onProgress })` from `@/components/hero/use-wordmark-morph`; `NAV_WORDMARK_SLOT_ID` from `@/components/site-header`; `useReducedMotionPref()`.
- Produces: nothing later phases import. Removes `useHomeHeaderOnFallback` from `site-header.tsx`.

- [ ] **Step 1: Read the existing hook before changing it**

```bash
cat src/components/hero/use-wordmark-morph.ts
```

It already implements this mechanic with this math — anchor + fly, `0.85 × vh`, smoothstep, ScrollTrigger on the shared ticker. **It also already fixes a bug the prototype has**: measuring the nav slot while the header still sits under its hidden `translateY(-16px)` sends the wordmark 16px off, so it reads and undoes that transform (`headerTranslation()`). Keep that. Do not rewrite the hook wholesale.

**Three changes it needs. Make these first, in one pass:**

1. **Widen the ref types.** It declares `liveRef`/`flowRef` as `RefObject<HTMLDivElement | null>`, but the anchor must be the page's `<h1>` (it carries the accessible name), which is an `HTMLHeadingElement`. That will not compile. Widen both to `RefObject<HTMLElement | null>`:
   ```ts
   interface MorphOpts {
     /** The fixed live wordmark layer (what actually flies). */
     liveRef: RefObject<HTMLElement | null>;
     /** The in-flow wordmark (layout + measurement source). */
     flowRef: RefObject<HTMLElement | null>;
     active: boolean;
     onProgress?: (p: number) => void;
   }
   ```

2. **Fix the `header-on` threshold.** The hook has `const HEADER_ON_AT = 0.85`, inherited from the old design. Spec §7 and the prototype both say **`p > 0.98`** — the nav glass fades in only in the last 2% of the morph, i.e. effectively on arrival. At 0.85 the pill appears while the wordmark is still visibly in flight, and lands into a nav that is already there. Change it to `0.98`.
   ```ts
   /** The pill arrives only as the wordmark lands — the last 2% of the
    *  morph (spec §7). Not 0.85: at that point the mark is still in flight. */
   const HEADER_ON_AT = 0.98;
   ```

3. Leave `headerTranslation()` exactly as it is.

- [ ] **Step 2: Write the failing test**

Add to `src/components/hero/hero.test.tsx`:

```tsx
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
```

Note `getAllByLabelText(...)` must find exactly **one** — two copies of the same name would make a screen reader announce the wordmark twice.

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm test src/components/hero/hero.test.tsx`
Expected: FAIL — no `[data-wordmark]` elements exist.

- [ ] **Step 4: Add the two copies**

In `hero.tsx`, extract the letters into a local so both copies share one source, and render the anchor + fly. Replace the `<h1>` with:

```tsx
      {/* The anchor owns layout and the accessible name. opacity:0 — NOT
          visibility:hidden — so it stays in the accessibility tree; the
          prototype's anchor is aria-hidden and its fly carries the name,
          which loses the name entirely under reduced motion (§6, bug 2). */}
      <h1
        ref={flowRef}
        data-wordmark="anchor"
        className={styles.wordmark}
        aria-label={siteContent.wordmark}
      >
        {letters}
      </h1>

      {/* The fly is the copy you actually see, and it BECOMES the nav brand —
          it never fades out, so the living gradient rides along at nav scale
          (spec §7). Purely decorative: the anchor owns the name. */}
      {!reduced && (
        <div
          ref={liveRef}
          data-wordmark="fly"
          aria-hidden="true"
          className={`${styles.wordmark} ${styles.fly}`}
        >
          {letters}
        </div>
      )}
```

with, above the return:

```tsx
  const flowRef = useRef<HTMLHeadingElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  const letters = LETTERS.map((letter, i) => (
    <span
      key={i}
      className={styles.letter}
      aria-hidden="true"
      style={{
        transitionDelay: reduced
          ? "0s"
          : `${(HERO_BUILD.letterLeadMs + i * HERO_BUILD.letterStaggerMs) / 1000}s`,
      }}
    >
      {letter}
    </span>
  ));

  useWordmarkMorph({ liveRef, flowRef, active: !reduced && runDone });
```

Add the imports: `useRef` from react, and `useWordmarkMorph` from `@/components/hero/use-wordmark-morph`.

> `active: !reduced && runDone` — the morph must not fight the build-in. It arms once the letters have settled.

- [ ] **Step 5: Style the two copies**

Append to `hero.module.css`:

```css
/* The anchor is invisible but still owns layout AND the accessibility tree.
   opacity, not visibility:hidden — the latter would remove the wordmark's
   only accessible name. */
.hero:has([data-wordmark="fly"]) .wordmark[data-wordmark="anchor"] {
  opacity: 0;
  pointer-events: none;
}

.fly {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 45;
  margin: 0;
  transform-origin: 0 0;
  pointer-events: none;
  will-change: transform;
}
```

> `:has()` means the anchor only hides when a fly copy exists — under reduced motion the fly is not rendered, so the anchor stays fully visible with no extra branch.

- [ ] **Step 6: Give the fly the anchor's font-size**

The fly is `position: fixed`, so it inherits nothing from the hero's layout. In `use-wordmark-morph.ts`'s `measure()`, before reading rects, add:

```ts
      /* The fly is fixed and out of flow, so it does not inherit the hero's
         fluid clamp() font-size. Copy it from the anchor before measuring. */
      live.style.fontSize = getComputedStyle(flow).fontSize;
```

- [ ] **Step 7: Measure every frame**

Spec §7 requires measuring live rather than caching at mount — that is what keeps the morph correct before fonts load. In `use-wordmark-morph.ts`, move the `measure()` call to the top of `apply()` so it runs on every scrub frame, and keep the existing `onRefreshInit: measure`. Also re-refresh once fonts land, since Config Variable changes the wordmark's width:

```ts
    /* Re-measure once the wordmark's real face lands: Config Variable is
       materially wider than the fallback, so a pre-font measurement sends the
       fly to the wrong place and only self-corrects on a refresh. */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
```

- [ ] **Step 8: Remove Phase 1's temporary header-on writer**

In `src/components/site-header.tsx`, delete the entire `useHomeHeaderOnFallback` function and its call. Its own comment says to delete it the moment the morph drives `header-on`. The morph now does, at the same threshold (`0.85 × vh`) with the same class.

**But reduced motion still needs it**: with `active: false` the morph never runs, so nothing sets `header-on`. Spec §7 says under reduced motion there is no flight and the header is simply present. Keep exactly that much:

```tsx
  /* No morph under reduced motion (spec §7), so nothing would drive
     `header-on` — show the pill from first paint instead of never. */
  useEffect(() => {
    if (!isHome || !reducedMotion) return;
    const root = document.documentElement;
    root.classList.add("header-on");
    return () => root.classList.remove("header-on");
  }, [isHome, reducedMotion]);
```

Then check whether `import { ScrollTrigger } from "@/lib/gsap";` (`site-header.tsx:6`) still has a consumer. The deleted fallback was almost certainly its only one — if so, remove the import, or `pnpm lint` will fail on an unused binding. Run `pnpm lint` to confirm either way rather than guessing.

**Do not remove the `useReducedMotionPref` import** — the replacement effect above still uses it.

- [ ] **Step 9: Run the full suite and build**

```bash
pnpm test
pnpm build
pnpm lint
```
Expected: all clean. Test count up from 56.

- [ ] **Step 10: Verify the morph in a browser — hit-test, do not assume**

With the dev server confirmed fresh:

1. Load `/`. At scrollY 0: no nav (spec §6), wordmark large in the hero.
2. Scroll slowly to ~0.85×vh. Expected: the wordmark flies up and left, shrinking, and **lands centred on the nav links** — becoming the header mark. The nav glass fades in as it arrives.
3. At the landed state, confirm **the gradient is still drifting on the nav mark** (spec §7 — the fly *becomes* the brand and never fades out). A flat-ink brand means the fly was faded and the wrong copy is showing.
4. `document.elementFromPoint()` over the theme toggle must return the toggle button — the nav must still be usable after the morph.
5. Scroll back to 0: the morph reverses cleanly and the nav leaves.
6. **Reduced motion:** emulate and reload. Expected: no flight at all, the nav present from first paint, the hero wordmark static and at rest (not scaled or blurred), and the wordmark still has its accessible name.
7. Check both themes.

Report what you actually observed at each step, especially 3 and 6.

- [ ] **Step 11: Commit**

```bash
git add src/components/hero/hero.tsx src/components/hero/hero.module.css src/components/hero/use-wordmark-morph.ts src/components/site-header.tsx src/components/hero/hero.test.tsx
git commit -m "feat(hero): the wordmark morph, reclaiming header-on

A scroll-scrubbed FLIP over the first 0.85vh: an in-flow anchor owns
layout and the accessible name, a fixed fly copy flies into the nav and
BECOMES the brand — so the living gradient rides along at nav scale
(spec §7).

Removes Phase 1's temporary header-on ScrollTrigger from site-header;
the morph drives it now, same class, same threshold. Reduced motion
keeps a minimal writer, since with no morph nothing would show the pill.

The anchor is opacity:0, not visibility:hidden, so it stays in the
accessibility tree — the prototype's name lives on the fly copy and
vanishes with it under reduced motion (spec §6, bug 2)."
```

---

## Phase 2 exit criteria

- [ ] `pnpm test`, `pnpm build`, `pnpm lint` all clean; `git status` empty.
- [ ] The nav reads as frosted glass in **both** themes, with content visibly blurred behind it.
- [ ] The wordmark's gradient drifts, and still drifts once landed in the nav.
- [ ] The build-in runs on load; the tagline follows the letters.
- [ ] The morph flies and reverses; the nav stays usable (hit-tested, not `.click()`ed).
- [ ] **Reduced motion:** no flight, nav present from first paint, wordmark at rest and NOT blurred, gradient static, accessible name intact.
- [ ] `useHomeHeaderOnFallback` is gone from `site-header.tsx`.
- [ ] **Jono has looked at the pixels** in both themes.

## Deliberately out of scope

- The About teleprompter (Phase 3), Work (Phase 4), Contact restyle (Phase 5).
- The About stub's `30ch` measure and its "About" vs "Who I am." title — Phase 3 owns both.
- Dead copy in `site-content.ts` — cut when a phase next edits that file. **Do not** cut `links.linkedin`/`collaya`/`resume`; Phase 5's footer needs them.
