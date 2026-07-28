# Case-study scroll visuals (Pin & Breakout) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two MDX-authored image treatments to case studies — `<Breakout>` (an image wider than the text measure) and `<Pin>` (an image held in view while its paragraphs scroll past) — so studies gain scroll-driven visuals with no per-study code.

**Architecture:** Two small wrapper components registered in `mdx-content.tsx`'s `mdxComponents` map, wrapping ordinary markdown images (so Velite's asset pipeline is untouched). The pin's hold is **pure CSS `position: sticky`** — no ScrollTrigger, no RAF loop — which is why it works identically on the full page and inside the modal's own scroller. An enabling CSS change first moves the 62ch reading measure off the `.body` container onto the text elements, so visuals can finally exceed text width.

**Tech Stack:** Next.js 16 / React 19, TypeScript, Tailwind v4 CSS-modules, MDX via Velite, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-28-case-study-scroll-visuals-design.md`

## Global Constraints

- **pnpm only.** Never npm/yarn. No new dependencies (spec).
- **Verify before committing:** run `pnpm build` AND `pnpm test`. The script is `vitest run` — use `pnpm test` (or `pnpm test <path>`), never `pnpm test run`.
- **Content never in JSX** (spec §14): components carry zero copy; every alt/caption is authored in the `.mdx`. Nothing goes in `site-content.ts`.
- **Markdown image syntax is load-bearing:** Velite rewrites `src` only for `![]()` nodes, not HTML `<img>` or component `src` props. Images inside `<Breakout>`/`<Pin>` stay markdown images.
- **One RAF loop / one scroll owner** (CLAUDE.md): the pin MUST stay pure CSS. Do not add ScrollTrigger, a scroll listener, or `autoRaf` for the dead-still hold.
- **Reduced motion:** the pin's sticky hold is layout, not animation — not gated. Only the existing reveal fade (and a future, unbuilt parallax) is reduce-gated.
- **Never `git add -A`** — stage only the files each task names (root `*.png` is git-ignored; screenshots must not be swept in).
- **Verify pixels, not JSX** (CLAUDE.md): eyeball the rendered result in **both themes** and **both surfaces** (full page + modal), desktop + mobile. Confirm the dev server process postdates your latest commit.

---

## File Structure

- `src/components/work/case-study-article.module.css` — **modify.** Move the 62ch measure from the `.body` container onto its text elements (enabling change).
- `src/components/mdx/breakout.tsx` — **create.** The `<Breakout>` wrapper.
- `src/components/mdx/breakout.module.css` — **create.** Wide-band width/centering.
- `src/components/mdx/breakout.test.tsx` — **create.** Unit test.
- `src/components/mdx/pin.tsx` — **create.** The `<Pin>` wrapper (child split + sticky columns).
- `src/components/mdx/pin.module.css` — **create.** Flex stage, sticky media, mobile stack.
- `src/components/mdx/pin.test.tsx` — **create.** Unit test.
- `src/components/mdx-content.tsx` — **modify.** Register `Breakout` and `Pin` in `mdxComponents`.
- `content/work/collaya.mdx` — **modify.** Author one real `<Breakout>` and one `<Pin>` (using the existing cover as a stand-in image; Jono swaps in real screenshots after).

---

## Task 1: Enabling change — move the reading measure onto the text

**Files:**
- Modify: `src/components/work/case-study-article.module.css`

**Interfaces:**
- Consumes: nothing.
- Produces: a `.body` that is full-article-width, with prose still capped at `62ch`. Later tasks rely on `.body` no longer clipping wide children.

This change is CSS-only (not unit-testable); its gate is a clean build, the unchanged existing test suite, and a visual check that prose reads identically.

- [ ] **Step 1: Read the current file** to confirm the three blocks you'll touch (`.body`, `.body :where(h2…)`, `.body :where(p, li)`, `.body :where(ul, ol)`).

- [ ] **Step 2: Remove the container cap on `.body`.**

Change:
```css
.body {
  margin-top: 7vh;
  max-width: 62ch;
}
```
to:
```css
.body {
  margin-top: 7vh;
}
```

- [ ] **Step 3: Put the measure on the heading block.** In the `.body :where(h2, h3, h4, h5, h6)` rule, add `max-width: 62ch;` as the last declaration:
```css
.body :where(h2, h3, h4, h5, h6) {
  margin: 5vh 0 14px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--work);
  max-width: 62ch;
}
```

- [ ] **Step 4: Put the measure on the prose blocks.** Add `max-width: 62ch;` to the `.body :where(p, li)` rule and to the `.body :where(ul, ol)` rule:
```css
.body :where(p, li) {
  font-size: clamp(1.05rem, 1.5vw, 1.28rem);
  line-height: 1.6;
  color: var(--ink);
  max-width: 62ch;
}
```
```css
.body :where(ul, ol) {
  margin: 14px 0 14px 1.2em;
  max-width: 62ch;
}
```

- [ ] **Step 5: Build and run the existing suite.**

Run: `pnpm build && pnpm test`
Expected: build succeeds; all existing tests pass (this change touches no component logic).

- [ ] **Step 6: Visual check — prose is unchanged.** Start a fresh dev server (`pnpm dev`), open `http://localhost:3000/work/collaya` in **both themes**. The reading column must look identical to before (same measure, same left position). Nothing should now stretch full-width — there are no wide children yet; you're confirming you didn't regress the baseline.

- [ ] **Step 7: Commit.**
```bash
git add src/components/work/case-study-article.module.css
git commit -m "refactor(work): move case-study reading measure off the body container

Cap prose at 62ch on the text elements, not on .body, so body images and
the coming Breakout/Pin treatments can exceed text width. Prose reads
identically; .body is now the full article column."
```

---

## Task 2: `<Breakout>` — an image wider than the text

**Files:**
- Create: `src/components/mdx/breakout.tsx`
- Create: `src/components/mdx/breakout.module.css`
- Test: `src/components/mdx/breakout.test.tsx`
- Modify: `src/components/mdx-content.tsx`
- Modify: `content/work/collaya.mdx`

**Interfaces:**
- Consumes: Task 1's uncapped `.body`.
- Produces: `Breakout({ children }: { children: ReactNode })` — a default export-free named export. Renders `<div data-mdx-breakout>` around its children. Registered as `Breakout` in `mdxComponents`.

- [ ] **Step 1: Write the failing test.** Create `src/components/mdx/breakout.test.tsx`:
```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Breakout } from "@/components/mdx/breakout";

afterEach(cleanup);

describe("Breakout", () => {
  it("wraps its children in a breakout band", () => {
    const { container } = render(
      <Breakout>
        <figure data-testid="fig" />
      </Breakout>,
    );
    const band = container.querySelector("[data-mdx-breakout]");
    expect(band).toBeTruthy();
    expect(band?.querySelector('[data-testid="fig"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm test src/components/mdx/breakout.test.tsx`
Expected: FAIL — cannot resolve `@/components/mdx/breakout`.

- [ ] **Step 3: Create the stylesheet.** Create `src/components/mdx/breakout.module.css`:
```css
/* Wider-than-text image band (spec 2026-07-28). Escapes the centred article
   toward the viewport edges and re-centres on the page: margin-left:50% moves
   to the column's centre (== page centre, the article is centred), then
   translateX(-50%) pulls back half our own width. Capped so it stays a band;
   `100vw - 12vw` keeps a 6vw gutter each side, so it never causes h-scroll.
   On narrow screens the min() resolves to ~full width and it reads as inline. */
.breakout {
  width: min(1280px, 100vw - 12vw);
  margin-left: 50%;
  transform: translateX(-50%);
}

/* The inner figure (MdxImage) fills the band; give the band its own rhythm. */
.breakout :global(figure) {
  margin: 8vh 0;
}
```

- [ ] **Step 4: Create the component.** Create `src/components/mdx/breakout.tsx`:
```tsx
import type { ReactNode } from "react";
import styles from "@/components/mdx/breakout.module.css";

/**
 * A case-study body image that escapes the reading measure (spec:
 * 2026-07-28 scroll visuals). Wraps a single markdown image — rendered by
 * MdxImage — in a centred band wider than the 62ch text column, using the
 * side whitespace. Collapses to inline width on narrow screens.
 *
 * Authored in MDX as:
 *   <Breakout>
 *
 *   ![alt](./media/…/shot.png "Caption")
 *
 *   </Breakout>
 * The blank lines are required — they let MDX parse the inside as Markdown,
 * which keeps Velite's src rewriting and the caption convention working.
 */
export function Breakout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.breakout} data-mdx-breakout>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes.**

Run: `pnpm test src/components/mdx/breakout.test.tsx`
Expected: PASS.

- [ ] **Step 6: Register the component.** In `src/components/mdx-content.tsx`, add the import and extend the map. Change:
```tsx
import { MdxImage } from "@/components/mdx/figure";
```
to add below it:
```tsx
import { Breakout } from "@/components/mdx/breakout";
```
and change:
```tsx
const mdxComponents: Record<string, ComponentType> = { img: MdxImage };
```
to:
```tsx
const mdxComponents: Record<string, ComponentType> = { img: MdxImage, Breakout };
```

- [ ] **Step 7: Author a real breakout into the case study.** In `content/work/collaya.mdx`, immediately after the `## Overview` section's two paragraphs (before `## Where it belongs`), insert:
```mdx
<Breakout>

{/* Placeholder image — swap ./media/collaya/cover.jpg for a real wide screenshot. */}
![Collaya loaded in the rack, beside FabFilter, NI and U-He](./media/collaya/cover.jpg "In the same rack as tools from companies many times its size.")

</Breakout>
```

- [ ] **Step 8: Build and verify the pipeline end-to-end.**

Run: `pnpm build`
Expected: Velite copies/rewrites the image; `next build` succeeds.

- [ ] **Step 9: Visual check — both themes, both surfaces.** Fresh `pnpm dev`. On `http://localhost:3000/work/collaya` confirm the breakout image is **visibly wider than the text column** and centred, using the side whitespace, in **light and dark**. Open the same study as the **modal** (from `/#work`, click the gallery card) and confirm the breakout also reads correctly inside the sheet. Shrink to a phone width and confirm it collapses to ~full width (reads as inline), with **no horizontal scrollbar**.

- [ ] **Step 10: Commit.**
```bash
git add src/components/mdx/breakout.tsx src/components/mdx/breakout.module.css src/components/mdx/breakout.test.tsx src/components/mdx-content.tsx content/work/collaya.mdx
git commit -m "feat(work): <Breakout> — case-study image wider than the text

MDX wrapper that lets a body image escape the reading measure into a
centred band, using the side whitespace; collapses to inline on mobile.
Wraps an ordinary markdown image so Velite's asset pipeline is untouched.
Authored one into collaya.mdx (cover as stand-in, to be swapped)."
```

---

## Task 3: `<Pin>` — an image held while text scrolls past

**Files:**
- Create: `src/components/mdx/pin.tsx`
- Create: `src/components/mdx/pin.module.css`
- Test: `src/components/mdx/pin.test.tsx`
- Modify: `src/components/mdx-content.tsx`
- Modify: `content/work/collaya.mdx`

**Interfaces:**
- Consumes: Task 1's uncapped `.body`; the `mdxComponents` map from Task 2.
- Produces: `Pin({ children }: { children: ReactNode })`. With ≥2 children: renders `<div>` containing `[data-pin-panel="media"]` (first child, sticky) and `[data-pin-panel="text"]` (rest). With <2 children: renders the children plainly (no panels). Registered as `Pin` in `mdxComponents`.

- [ ] **Step 1: Write the failing test.** Create `src/components/mdx/pin.test.tsx`:
```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Pin } from "@/components/mdx/pin";

afterEach(cleanup);

describe("Pin", () => {
  it("puts the first child in the media panel and the rest in the text panel", () => {
    const { container } = render(
      <Pin>
        <figure data-testid="media" />
        <p>first</p>
        <p>second</p>
      </Pin>,
    );
    const media = container.querySelector('[data-pin-panel="media"]');
    const text = container.querySelector('[data-pin-panel="text"]');
    expect(media?.querySelector('[data-testid="media"]')).toBeTruthy();
    expect(text?.textContent).toBe("firstsecond");
    // the held media must not leak into the scrolling text column
    expect(text?.querySelector('[data-testid="media"]')).toBeNull();
  });

  it("renders a lone child plainly — no empty sticky column", () => {
    const { container } = render(
      <Pin>
        <figure data-testid="only" />
      </Pin>,
    );
    expect(container.querySelector("[data-pin-panel]")).toBeNull();
    expect(container.querySelector('[data-testid="only"]')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm test src/components/mdx/pin.test.tsx`
Expected: FAIL — cannot resolve `@/components/mdx/pin`.

- [ ] **Step 3: Create the stylesheet.** Create `src/components/mdx/pin.module.css`:
```css
/* Pinned media stage (spec 2026-07-28). The media holds via position: sticky
   while the prose column scrolls past it. Pure CSS — no ScrollTrigger, no
   second RAF loop (CLAUDE.md), and sticky resolves against the modal's own
   scroller for free, so nothing is surface-specific. */
.pin {
  display: flex;
  gap: 6vw;
  align-items: flex-start;
  margin: 8vh 0;
}

.media {
  flex: 0 0 46%;
  position: sticky;
  top: 16vh;
  align-self: flex-start;
}

/* The held figure owns the stage's rhythm; drop MdxImage's default margin. */
.media :global(figure) {
  margin: 0;
}

.text {
  flex: 1;
  /* room so the last paragraph can clear the held image before it releases */
  padding-bottom: 30vh;
}

.text > :last-child {
  padding-bottom: 0;
}

/* Narrow screens: stack. Media on top, static; prose full width beneath. */
@media (max-width: 820px) {
  .pin {
    flex-direction: column;
    gap: 0;
  }
  .media {
    position: static;
    flex-basis: auto;
    width: 100%;
  }
  .text {
    padding-bottom: 0;
  }
}
```

- [ ] **Step 4: Create the component.** Create `src/components/mdx/pin.tsx`:
```tsx
import { Children, type ReactNode } from "react";
import styles from "@/components/mdx/pin.module.css";

/**
 * A held case-study image (spec: 2026-07-28 scroll visuals). The FIRST block
 * child is the media; it holds in view (CSS position: sticky) while the
 * remaining children — the prose — scroll past it in a side column.
 *
 * Dead-still by design: no ScrollTrigger, no RAF, no scroll listener. The hold
 * is pure CSS, so it behaves identically on the full page and inside the
 * modal's own scroller.
 *
 * Authored as:
 *   <Pin>
 *
 *   ![alt](./media/…/shot.png "Caption")
 *
 *   Paragraph that scrolls past…
 *
 *   Another paragraph…
 *
 *   </Pin>
 *
 * Fail-safe: a Pin with only one child (no prose to scroll past) is just a
 * figure — render it plainly rather than stranding it in an empty sticky slot.
 */
export function Pin({ children }: { children: ReactNode }) {
  const [media, ...rest] = Children.toArray(children);

  if (rest.length === 0) return <>{media}</>;

  return (
    <div className={styles.pin}>
      <div className={styles.media} data-pin-panel="media">
        {media}
      </div>
      <div className={styles.text} data-pin-panel="text">
        {rest}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes.**

Run: `pnpm test src/components/mdx/pin.test.tsx`
Expected: PASS (both cases).

- [ ] **Step 6: Register the component.** In `src/components/mdx-content.tsx`, add the import:
```tsx
import { Pin } from "@/components/mdx/pin";
```
and extend the map from:
```tsx
const mdxComponents: Record<string, ComponentType> = { img: MdxImage, Breakout };
```
to:
```tsx
const mdxComponents: Record<string, ComponentType> = { img: MdxImage, Breakout, Pin };
```

- [ ] **Step 7: Author a real pin into the case study.** In `content/work/collaya.mdx`, replace the `## Where it belongs` section's first three paragraphs (the "The web app worked…", "The core concept…", and "The plugin was always the intention…" paragraphs) by wrapping them and a stand-in image in a `<Pin>`. Insert directly under the `## Where it belongs` heading:
```mdx
<Pin>

{/* Placeholder image — swap ./media/collaya/cover.jpg for the real DAW screenshot. */}
![Collaya, loaded in the DAW](./media/collaya/cover.jpg "Collaya, loaded in the DAW")

The web app worked. You uploaded your sounds, Collaya listened and thought about them, and then you could have a real conversation about the material you were working on. That part was good, and it is still the heart of the product today.

The core concept was the innovation. The workflow around it was the problem. Stop the session, switch apps, bounce a reference out of the DAW, upload it, wait, then talk. Every step is trivial, and together they cost more than most ideas are worth.

A plugin closes both gaps at once. Inside the session, Collaya reads tempo, key and transport state directly from the host. It auditions sounds through the DAW's own output, time-stretched and pitch-shifted to the project, against the track already playing.

</Pin>
```
(Leave the rest of the section's paragraphs as full-width prose after the closing `</Pin>`. Preserve the exact wording of any paragraph you move.)

- [ ] **Step 8: Build.**

Run: `pnpm build`
Expected: succeeds; the pinned image resolves through Velite.

- [ ] **Step 9: Visual check — the hold, both surfaces, both themes, mobile.** Fresh `pnpm dev`, `http://localhost:3000/work/collaya`:
  - The pinned image **holds in place** while its three paragraphs scroll up beside it, then releases — in **light and dark**.
  - Open the study as the **modal** (from `/#work`) and confirm the pin holds against the **sheet's** scroll, not the window (this is the pure-CSS payoff — verify it, don't assume).
  - At phone width, the pin **stacks**: image on top (not stuck), prose full width below.
  - Set the OS to reduced motion and confirm nothing breaks (the hold remains; it is layout, not animation).

- [ ] **Step 10: Commit.**
```bash
git add src/components/mdx/pin.tsx src/components/mdx/pin.module.css src/components/mdx/pin.test.tsx src/components/mdx-content.tsx content/work/collaya.mdx
git commit -m "feat(work): <Pin> — case-study image held while text scrolls

MDX wrapper whose first child holds via CSS position: sticky while the rest
scroll past in a side column. Pure CSS, so it works on the full page and in
the modal scroller with no per-surface wiring; stacks on mobile. Authored
one into collaya.mdx (cover as stand-in, to be swapped)."
```

---

## Task 4: Final verification pass

**Files:** none (verification only; commit only if a fix is needed).

- [ ] **Step 1: Full suite + build from clean.**

Run: `pnpm build && pnpm test`
Expected: both green.

- [ ] **Step 2: Confirm the dev server is fresh.** Stop any running `next-server`, start `pnpm dev`, and confirm the process postdates your last commit (CLAUDE.md: stale servers have produced false results here).

- [ ] **Step 3: Full visual sweep.** On `http://localhost:3000/work/collaya`, in **both themes**, on **both surfaces** (page + modal), at desktop and phone widths, confirm together in one pass: inline prose reads at the old measure; the `<Breakout>` exceeds it and uses the whitespace; the `<Pin>` holds then releases; mobile collapses both to inline/stacked; captions are mono under each image; no horizontal scrollbar anywhere.

- [ ] **Step 4: If any fix was needed,** commit it with a focused message and re-run Step 1. Otherwise the feature is complete.

---

## Self-Review

**Spec coverage:**
- Breakout treatment → Task 2. ✓
- Pin treatment (dead-still, CSS sticky, first-child-media contract) → Task 3. ✓
- Body width-model flip (enabling change) → Task 1. ✓
- Both surfaces (page + modal scroller) → verified in Task 2 Step 9, Task 3 Step 9, Task 4 Step 3. ✓
- Mobile collapse/stack → Task 2 Step 9, Task 3 Step 9. ✓
- Reduced motion (hold not gated) → Task 3 Step 9. ✓
- No new dependency; markdown-image syntax preserved → components wrap markdown images; `velite.config.ts` untouched. ✓
- Content-never-in-JSX → all copy authored in `collaya.mdx`; components have no strings. ✓
- Registration alongside `img` → Task 2 Step 6, Task 3 Step 6. ✓
- Deferred (D2/D3/margin/full-bleed) → not planned, as intended. ✓

**Placeholder scan:** No TBD/TODO; every code and CSS step shows complete content; the only "placeholder" is the deliberate stand-in *image file* (cover.jpg), flagged in an MDX comment for Jono to swap. ✓

**Type consistency:** `Breakout`/`Pin` names, `data-mdx-breakout` and `data-pin-panel="media"|"text"` hooks, and the `{ children: ReactNode }` signature are used identically in the components, tests, and registration. ✓
