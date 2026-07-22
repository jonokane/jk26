# jk26-v3 Phase 4: Work — the hybrid gallery + index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 30-line Phase 1 Work stub with the hybrid of spec §9 — a pinned horizontal gallery (default) and a filterable vertical index, toggled from the Work section's own header.

**Architecture:** One dataset, two views. `publishedWork` already exists and is already the source for `/work/[slug]`, so numbering can never drift between the two. The gallery is a tall wrapper driving a sticky `100vh` stage whose `#wtrack` is translated in X from vertical scroll progress; **every count and every distance is measured or derived, never written down** — that is the whole point of §9's "prototype gaps to close". The maths goes in a pure engine module (the `teleprompter-engine.ts` house style), the DOM writes go in a hook, and the components stay dumb.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (CSS-first), CSS Modules, Lenis + GSAP (one shared ticker), Velite, Vitest + Testing Library, pnpm.

## Global Constraints

Every task's requirements implicitly include all of these. They are copied from `CLAUDE.md` and the spec; the exact values are binding.

- **pnpm only.** `pnpm test` is ALREADY non-watch (`"test": "vitest run"`). Never `pnpm test run` — `run` becomes a filename filter, matches nothing, exits 1. `pnpm test <path>` for one file.
- **Content never lives in JSX** (spec §14/§15). Every string — including accessible names, button labels, and punctuation-as-separator — lives in `src/lib/site-content.ts` or MDX. Tunables live in a config module. Editing words must never require touching a component.
- **Design decisions live in CSS, not markup.** Tokens are CSS custom properties mapped by the `@theme` block in `globals.css`. Compose semantic classes; do not repeat a 12-utility string. Unlayered rules beat anything in an `@layer`.
- **Nothing is derived, computed, or generated in the palettes: a hex is a hex.** `globals.css.test.ts` fails the build if `color-mix`/`oklch`/`calc` appears in a palette. Do not add a color to the palettes in this phase — every token you need already exists (see Task 1).
- **There is no clock anywhere in this codebase. Do not reintroduce one.**
- **Respect `prefers-reduced-motion`**, and establish it in **CSS** so it is correct at FIRST PAINT. A post-hydration effect flashes the animated state first — that is a bug Phase 2 shipped and fixed (spec §11).
- **Do not add a second RAF loop** or `autoRaf`. Lenis is driven from GSAP's ticker in `src/components/smooth-scroll.tsx`. Build scroll choreography on that.
- **`src/lib/scroll-nav.ts` is the single owner of in-page navigation.** Use `navigateTo` / `takeHashClick`. Do not write a second scroll mechanism.
- **House style: no em-dashes anywhere in visitor-facing copy** (`site-content.ts` line 7).
- **Never `git add -A`.** Stage what you intend. `content/work/collaya.mdx` and `next.config.ts` are the owner's uncommitted work — **never stage, commit, revert, or `git restore` them.** After every commit, assert `git status --porcelain` shows nothing but those two.
- Run `pnpm build` **and** `pnpm test` before every commit.

### The verification bar (read this — it is why this project's bugs were expensive)

`CLAUDE.md`: **mechanism-verification is blind to what a visitor actually sees.** Tests passing, a clean console, and correct DOM state have all been true of shipped code that looked wrong or was unusable. Every serious bug found on this branch had green gates for its entire life.

- **Look at the rendered pixels**, in both themes, before calling visual work done.
- **Reachability is not `element.click()`** — that fires on `visibility: hidden` elements. `document.elementFromPoint(center)` must return the element or a descendant.
- **Check the dev server postdates your commit.** Stale `next-server` processes have served days-old CSS and produced convincing false results. Kill with `lsof -ti:3000 -sTCP:LISTEN` (plain `lsof -ti:3000` returns Chrome clients too).
- **Prove a new test can fail.** Break the thing on purpose, watch it go red, put it back. Report both outputs.
- **Anchor source-text regexes.** This project has twice shipped a regex that matched its own prefix (`/backdrop-filter:/` matches inside `-webkit-backdrop-filter:`). Use a negative lookbehind.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/work/gallery-engine.ts` | **Create.** Pure maths: travel, progress, wrapper height, active index, card opacity. No DOM, no React. Unit-tested. |
| `src/components/work/work-config.ts` | **Create.** Every tunable number in §9's gallery, one file, one line each. |
| `src/components/work/use-gallery.ts` | **Create.** Measures and writes. Owns the scroll subscription, the resize observer, and the horizontal-pan handler. Holds no numbers. |
| `src/components/work/work-gallery.tsx` | **Create.** The pinned stage: track, cards, earlier panel, wayfinding header. |
| `src/components/work/work-card.tsx` | **Create.** One card. Dumb; takes a study + its number. |
| `src/components/work/work-index.tsx` | **Create.** The vertical filterable index (also the reduced-motion / narrow fallback). |
| `src/components/work/work-filters.ts` | **Create.** Pure: derive Sector/Discipline facets from studies, apply a filter. Unit-tested. |
| `src/components/work/work.tsx` | **Replace.** Owns view state (`gallery` \| `index`), renders one or the other. |
| `src/components/work/work.module.css` | **Replace.** Gallery + index + the reduced-motion and narrow collapse. |
| `src/components/work/earlier-work.tsx` | **Rewrite.** Currently a card grid using parked-design classes (`slab`, `heading-display`, `text-ink` — `text-ink` no longer exists). §9 wants a 2-col list. |
| `src/components/work/earlier-work.module.css` | **Replace.** 2-col list. |
| `src/lib/site-content.ts` | **Modify.** Add the gallery's strings; delete the parked `work.shelf` block. |
| `src/components/work/work-lists.ts` | **Reuse unchanged.** Already exports everything the numbering needs. |
| `src/components/work/work-data.ts` | **Reuse unchanged.** `publishedWork`, `sortedEarlierWork`. |

**Reuse, do not rebuild:** `work-lists.ts` already has `selectPublishedWork`, `sortByOrder`, `nextStudy`, `studyNumber`, `formatStudyNumber`. `url-label.ts` has `isViewUrl`/`urlLabel`. `scroll-nav.ts` has `navigateTo`/`takeHashClick`/`isPlainClick`. `mdx-content.tsx` renders MDX bodies.

**Existing data shape (from `velite.config.ts` — do not re-declare):**
```ts
// CaseStudy: title, summary, year, role, client, sector[], discipline[], platform[],
//   timeframe, view, impact, order, draft, cover?, tags[], featured, path, body,
//   sections, slug, url   ("/work/<slug>")
// EarlierProject: title, sector[], discipline[], platform[], role, timeframe, view,
//   order, path, body
```

**Palette tokens that already exist** (light / dark declared adjacently in `globals.css`) — use these, add none:
`--canvas --ink --mute --dim --hairline --row-hover --about --work --contact --nav-glass --nav-edge`

---

## Task 1: The gallery's tunables and pure maths

**Files:**
- Create: `src/components/work/work-config.ts`
- Create: `src/components/work/gallery-engine.ts`
- Test: `src/components/work/gallery-engine.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `WORK` (the config object); `travelFor(trackScrollWidth, viewportWidth): number`; `wrapperHeightFor(travel, viewportHeight): number`; `linearProgress(wrapTop, wrapHeight, viewportHeight): number`; `trackOffsetFor(progress, travel): number`; `activeIndexFor(centers, viewportWidth): number`; `cardOpacityFor(distanceFromCenter, viewportWidth): number`; `scrollDeltaForPan(deltaX, wrapHeight, viewportHeight, travel): number`.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/gallery-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  activeIndexFor,
  cardOpacityFor,
  linearProgress,
  scrollDeltaForPan,
  trackOffsetFor,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";
import { WORK } from "@/components/work/work-config";

describe("travelFor", () => {
  /* Spec §9: travel = max(0, scrollWidth - innerWidth + innerWidth * 0.06).
     The trailing 6vw is the gutter the last card needs so it is not flush. */
  it("is the overhang plus a trailing gutter", () => {
    expect(travelFor(3000, 1000)).toBe(3000 - 1000 + 60);
  });

  /* A track narrower than the viewport must not travel BACKWARDS. Without the
     max(0) the transform would push the cards off to the right. */
  it("never goes negative when the track fits on screen", () => {
    expect(travelFor(500, 1000)).toBe(0);
  });
});

describe("wrapperHeightFor", () => {
  /* Prototype gap 1: 520vh was hardcoded and decoupled from travel, so the
     scroll-to-pixel rate drifted silently as studies were added or removed.
     Deriving it is the fix: the wrapper is one viewport of pin plus however
     much scroll the travel actually needs. */
  it("is one viewport plus the travel, scaled", () => {
    expect(wrapperHeightFor(2000, 800)).toBe(800 + 2000 * WORK.scrollPerPixel);
  });

  it("collapses to a single viewport when there is nothing to travel", () => {
    expect(wrapperHeightFor(0, 800)).toBe(800);
  });
});

describe("linearProgress", () => {
  it("is 0 at the top of the pin and 1 at the bottom", () => {
    expect(linearProgress(0, 2000, 800)).toBe(0);
    expect(linearProgress(-1200, 2000, 800)).toBe(1);
  });

  it("is linear in between, with no easing", () => {
    expect(linearProgress(-600, 2000, 800)).toBeCloseTo(0.5, 5);
  });

  it("clamps outside the pin", () => {
    expect(linearProgress(500, 2000, 800)).toBe(0);
    expect(linearProgress(-9999, 2000, 800)).toBe(1);
  });

  /* wrapHeight === viewportHeight divides by zero. A wrapper with no scroll
     budget means "nothing to travel", so progress is 0 — NOT NaN, which would
     flow into the transform and be silently dropped by the browser. */
  it("returns 0 rather than NaN when the wrapper has no scroll budget", () => {
    expect(linearProgress(0, 800, 800)).toBe(0);
  });
});

describe("trackOffsetFor", () => {
  it("is negative, so progress moves the track left", () => {
    expect(trackOffsetFor(0.5, 2000)).toBe(-1000);
  });
});

describe("activeIndexFor", () => {
  /* Spec §9: the active card is the one nearest the viewport's horizontal
     center — deliberately NOT derived from progress, which would drift from
     what the eye reports as cards enter and leave. */
  it("is the card whose center is nearest the viewport center", () => {
    expect(activeIndexFor([100, 480, 900], 1000)).toBe(1);
  });

  it("is 0 when there are no cards", () => {
    expect(activeIndexFor([], 1000)).toBe(0);
  });

  it("takes the first of two equidistant cards, never a tie", () => {
    expect(activeIndexFor([400, 600], 1000)).toBe(0);
  });
});

describe("cardOpacityFor", () => {
  it("is full inside the focal band and dim outside it", () => {
    expect(cardOpacityFor(0, 1000)).toBe(1);
    expect(cardOpacityFor(549, 1000)).toBe(1);
    expect(cardOpacityFor(551, 1000)).toBe(WORK.cardDimOpacity);
  });

  /* Distance is unsigned: a card the same way off to the left reads the same. */
  it("does not care which side of center the card is on", () => {
    expect(cardOpacityFor(-800, 1000)).toBe(cardOpacityFor(800, 1000));
  });
});

describe("scrollDeltaForPan", () => {
  /* Spec §9: horizontal input pans by driving VERTICAL scroll, because
     translateX is derived from scrollY. This is the exact inverse of
     trackOffsetFor, so one pixel of finger is one pixel of card. */
  it("is the inverse of the translate, so a pixel of gesture is a pixel of card", () => {
    const wrapHeight = 2000, vh = 800, travel = 1200;
    const delta = scrollDeltaForPan(120, wrapHeight, vh, travel);
    const before = linearProgress(0, wrapHeight, vh);
    const after = linearProgress(-delta, wrapHeight, vh);
    const moved = trackOffsetFor(before, travel) - trackOffsetFor(after, travel);
    expect(moved).toBeCloseTo(120, 5);
  });

  it("is 0 when there is no travel, so a pan cannot scroll the page sideways-by-proxy", () => {
    expect(scrollDeltaForPan(120, 2000, 800, 0)).toBe(0);
  });

  it("keeps the sign, so panning left goes back", () => {
    expect(scrollDeltaForPan(-120, 2000, 800, 1200)).toBeCloseTo(
      -scrollDeltaForPan(120, 2000, 800, 1200),
      5,
    );
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/gallery-engine.test.ts`
Expected: FAIL — `Failed to resolve import "@/components/work/gallery-engine"`.

- [ ] **Step 3: Write the config**

Create `src/components/work/work-config.ts`:

```ts
/**
 * Every tunable in the Work gallery (spec §9), one file, one line each.
 *
 * Jono adjusts these by feel. That must stay a one-line edit in one file, so
 * nothing here may be duplicated as a literal in a component or a stylesheet.
 * Numbers the CSS owns are NOT listed here — a config entry that tunes nothing
 * is worse than no entry (Phase 3 shipped three of those). Card geometry lives
 * in work.module.css because CSS is the only thing that reads it.
 */
export const WORK = {
  /** Trailing gutter past the last card, as a fraction of viewport width, so it
   *  does not sit flush to the edge. Spec §9: `innerWidth * 0.06` = the 6vw inset. */
  trailingGutter: 0.06,

  /** Vertical scroll spent per pixel of horizontal travel. 1 means a pixel of
   *  scroll moves a card a pixel; higher makes the gallery feel heavier and the
   *  section taller. The prototype hardcoded 520vh and let this drift. */
  scrollPerPixel: 1,

  /** A card at full opacity sits within this fraction of viewport width of the
   *  center. Spec §9: `0.55 × innerWidth`. */
  focalBand: 0.55,

  /** What a card outside the focal band fades to. Spec §9: 0.42. */
  cardDimOpacity: 0.42,
} as const;
```

- [ ] **Step 4: Write the engine**

Create `src/components/work/gallery-engine.ts`:

```ts
/**
 * The Work gallery's maths (spec §9) — pure, so it is unit-testable and has no
 * idea React or the DOM exist (the `teleprompter-engine.ts` house style, spec
 * §14). The hook measures and writes; it holds no numbers.
 *
 * Everything here is DERIVED. §9's "prototype gaps to close" are almost all one
 * fault: the prototype wrote down numbers it should have measured — a 520vh
 * wrapper decoupled from travel, card numbers 01-08 in markup beside a live
 * counter. Nothing in this module may be given a count.
 */
import { WORK } from "@/components/work/work-config";

/**
 * How far the track must move for its last card to arrive, plus the trailing
 * gutter. Clamped at 0: a track narrower than the viewport has nowhere to go,
 * and a negative travel would push the cards off to the RIGHT.
 */
export function travelFor(trackScrollWidth: number, viewportWidth: number): number {
  return Math.max(0, trackScrollWidth - viewportWidth + viewportWidth * WORK.trailingGutter);
}

/**
 * The wrapper's height IS the scroll budget: one viewport to pin against, plus
 * whatever the travel costs. Derived, never authored — this is prototype gap 1,
 * where 520vh was hardcoded and the scroll-to-pixel rate therefore drifted every
 * time a study was added or drafted.
 */
export function wrapperHeightFor(travel: number, viewportHeight: number): number {
  return viewportHeight + travel * WORK.scrollPerPixel;
}

/**
 * 0 as the pin begins, 1 as it ends. Linear on purpose (spec §9: "linear, no
 * easing") — the scroll itself is already smoothed by Lenis, and easing this too
 * would compound into a lag the hand can feel.
 *
 * The zero-budget guard is not academic: `wrapHeight === viewportHeight` gives
 * 0/0, and NaN flows into `translateX(NaNpx)`, which the browser silently drops
 * rather than complaining. A wrapper with no budget means "nothing to travel".
 */
export function linearProgress(
  wrapTop: number,
  wrapHeight: number,
  viewportHeight: number,
): number {
  const budget = wrapHeight - viewportHeight;
  if (budget <= 0) return 0;
  return Math.min(1, Math.max(0, -wrapTop / budget));
}

/** Negative: progress carries the track left. */
export function trackOffsetFor(progress: number, travel: number): number {
  return -progress * travel;
}

/**
 * The card nearest the viewport's horizontal center.
 *
 * Deliberately NOT derived from progress (spec §9). Progress is a property of
 * the scroll; the active card is a property of what is actually on screen, and
 * the two drift apart at the ends of the track where the first and last cards
 * sit against their gutters. The counter has to agree with the eye.
 *
 * `centers` are viewport-relative card centers, in order.
 */
export function activeIndexFor(centers: readonly number[], viewportWidth: number): number {
  const middle = viewportWidth * 0.5;
  let best = 0;
  let bestDistance = Infinity;
  centers.forEach((center, i) => {
    const distance = Math.abs(center - middle);
    /* Strictly less-than, so a tie keeps the earlier card and the counter cannot
       flicker between two equidistant neighbors. */
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}

/** Full inside the focal band, dim outside it. `distance` may be signed. */
export function cardOpacityFor(distanceFromCenter: number, viewportWidth: number): number {
  return Math.abs(distanceFromCenter) < viewportWidth * WORK.focalBand ? 1 : WORK.cardDimOpacity;
}

/**
 * The vertical scroll a horizontal gesture is worth (spec §9).
 *
 * Horizontal input pans by driving vertical scroll, NOT by writing the track's
 * transform: `translateX` is derived from `scrollY`, so a handler that wrote it
 * would be a second source of truth for the same pixel and the next vertical
 * frame would snap the track back out from under the gesture.
 *
 * This is the exact inverse of `trackOffsetFor ∘ linearProgress`, so one pixel
 * of finger stays one pixel of card at any travel or viewport.
 */
export function scrollDeltaForPan(
  deltaX: number,
  wrapHeight: number,
  viewportHeight: number,
  travel: number,
): number {
  if (travel <= 0) return 0;
  return (deltaX * (wrapHeight - viewportHeight)) / travel;
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/gallery-engine.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 6: Prove the tests can fail**

Do all three, one at a time, and report the actual output of each:
1. In `travelFor`, drop the `Math.max(0, …)`. Expected: *"never goes negative when the track fits on screen"* fails. Restore.
2. In `linearProgress`, remove the `budget <= 0` guard. Expected: *"returns 0 rather than NaN"* fails. Restore.
3. In `scrollDeltaForPan`, change `(wrapHeight - viewportHeight)` to `wrapHeight`. Expected: *"is the inverse of the translate"* fails. Restore.

If any of these still passes, the test is not testing what it claims — fix the test, not the code.

- [ ] **Step 7: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work-config.ts src/components/work/gallery-engine.ts src/components/work/gallery-engine.test.ts
git commit
```
Message: why the maths is pure and separate, and that every value is derived because §9's prototype gaps are all one fault (numbers written down that should have been measured). Then assert `git status --porcelain` shows only `content/work/collaya.mdx` and `next.config.ts`.

---

## Task 2: The index's facets and filtering

**Files:**
- Create: `src/components/work/work-filters.ts`
- Test: `src/components/work/work-filters.test.ts`

**Interfaces:**
- Consumes: `CaseStudy` from `#site/content` (type only).
- Produces: `type Facet = "sector" | "discipline"`; `type WorkFilter = { sector: string | null; discipline: string | null }`; `NO_FILTER: WorkFilter`; `facetValues(studies, facet): string[]`; `applyFilter(studies, filter): CaseStudy[]`; `isFilterActive(filter): boolean`.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/work-filters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CaseStudy } from "#site/content";
import {
  NO_FILTER,
  applyFilter,
  facetValues,
  isFilterActive,
} from "@/components/work/work-filters";

/* Only the fields the filter reads. The cast keeps the fixture honest about
   that: a filter that needs more than this is doing too much. */
const study = (title: string, sector: string[], discipline: string[]) =>
  ({ title, sector, discipline }) as unknown as CaseStudy;

const STUDIES = [
  study("A", ["Music", "AI"], ["Product Design"]),
  study("B", ["Music"], ["Design Systems", "Product Design"]),
  study("C", ["Automotive"], ["Front-end"]),
];

describe("facetValues", () => {
  it("is every distinct value across the studies, sorted", () => {
    expect(facetValues(STUDIES, "sector")).toEqual(["AI", "Automotive", "Music"]);
  });

  it("does not repeat a value two studies share", () => {
    expect(facetValues(STUDIES, "discipline")).toEqual([
      "Design Systems",
      "Front-end",
      "Product Design",
    ]);
  });

  /* Facets are derived from frontmatter (spec §9: "no new content"), so a study
     drafted or added changes the filter bar with no code edit. */
  it("is empty when there are no studies", () => {
    expect(facetValues([], "sector")).toEqual([]);
  });
});

describe("applyFilter", () => {
  it("returns every study when nothing is selected", () => {
    expect(applyFilter(STUDIES, NO_FILTER)).toHaveLength(3);
  });

  it("keeps a study holding the value anywhere in its array", () => {
    expect(applyFilter(STUDIES, { sector: "Music", discipline: null }).map((s) => s.title)).toEqual([
      "A",
      "B",
    ]);
  });

  /* Two facets are AND, not OR: picking Music and Front-end asks for a study
     that is both, and there is none. An OR here would look like the filter was
     ignored. */
  it("ANDs the two facets", () => {
    expect(applyFilter(STUDIES, { sector: "Music", discipline: "Front-end" })).toEqual([]);
    expect(
      applyFilter(STUDIES, { sector: "Music", discipline: "Product Design" }).map((s) => s.title),
    ).toEqual(["A", "B"]);
  });

  it("preserves the incoming order, which is the study numbering", () => {
    expect(applyFilter(STUDIES, { sector: null, discipline: "Product Design" }).map((s) => s.title))
      .toEqual(["A", "B"]);
  });

  it("does not mutate the input", () => {
    const copy = [...STUDIES];
    applyFilter(STUDIES, { sector: "Music", discipline: null });
    expect(STUDIES).toEqual(copy);
  });
});

describe("isFilterActive", () => {
  it("is false only when neither facet is chosen", () => {
    expect(isFilterActive(NO_FILTER)).toBe(false);
    expect(isFilterActive({ sector: "Music", discipline: null })).toBe(true);
    expect(isFilterActive({ sector: null, discipline: "Front-end" })).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/work-filters.test.ts`
Expected: FAIL — cannot resolve `@/components/work/work-filters`.

- [ ] **Step 3: Write the module**

Create `src/components/work/work-filters.ts`:

```ts
import type { CaseStudy } from "#site/content";

/**
 * The index's filtering (spec §9) — pure, and with no `#site/content` value
 * import, so it stays unit-testable without the generated content module (the
 * `work-lists.ts` house style, spec §15).
 *
 * Both facets are derived from frontmatter, so adding a study or drafting one
 * changes the filter bar with no code edit and no new content.
 */

/** The frontmatter arrays the index filters on. Spec §9 names exactly these two. */
export type Facet = "sector" | "discipline";

/** `null` means "not filtered by this facet". */
export interface WorkFilter {
  sector: string | null;
  discipline: string | null;
}

export const NO_FILTER: WorkFilter = { sector: null, discipline: null };

/** Every distinct value of `facet` across `studies`, sorted for a stable bar. */
export function facetValues(studies: readonly CaseStudy[], facet: Facet): string[] {
  const values = new Set<string>();
  for (const study of studies) {
    for (const value of study[facet]) values.add(value);
  }
  return [...values].sort();
}

/**
 * The studies matching every chosen facet.
 *
 * The two facets AND rather than OR: choosing Music and Front-end asks for a
 * study that is both. An OR would return studies matching neither choice fully,
 * which reads as the filter being ignored.
 *
 * Order is preserved — it is `publishedWork`'s order, which is the study
 * numbering, and a filtered row must keep the number it has everywhere else.
 */
export function applyFilter(studies: readonly CaseStudy[], filter: WorkFilter): CaseStudy[] {
  return studies.filter(
    (study) =>
      (filter.sector === null || study.sector.includes(filter.sector)) &&
      (filter.discipline === null || study.discipline.includes(filter.discipline)),
  );
}

/** True once either facet is chosen — the "clear" control's visibility. */
export function isFilterActive(filter: WorkFilter): boolean {
  return filter.sector !== null || filter.discipline !== null;
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm test src/components/work/work-filters.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Prove a test can fail**

Change `applyFilter`'s `&&` to `||`. Expected: *"ANDs the two facets"* fails. Restore. Report both outputs.

- [ ] **Step 6: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work-filters.ts src/components/work/work-filters.test.ts
git commit
```
Message: why facets derive from frontmatter, and why the two facets AND.

---

## Task 3: The copy

**Files:**
- Modify: `src/lib/site-content.ts` (the `work` block, currently lines 61-89)

**Interfaces:**
- Produces: `siteContent.work.{ intro, earlierTitle, nextLabel, galleryLabel, indexLabel, viewLabel, shotPending, counterSeparator, filters: { sector, discipline, all, clear, region }, region, progressLabel }` and `siteContent.work.metaLabels` (unchanged).

- [ ] **Step 1: Read what is there and delete what is dead**

The `work.shelf` block (lines 67-79) belongs to the parked Cold Noon shelf: `introPanel`, `headingJoin`, `captionSeparator`, `region`, `studyPills`. Confirm nothing reads it:

```bash
grep -rn "work\.shelf\|shelf\." src --include=*.tsx --include=*.ts | grep -v site-content.ts
```
Expected: no output. If anything DOES read it, stop and report — do not delete a live string.

- [ ] **Step 2: Replace the `work` block**

In `src/lib/site-content.ts`, replace the whole `work: { … }` block with:

```ts
  /** Work section (spec §9). Two views over one dataset. */
  work: {
    intro:
      "Each study is the whole story: what it was, what made it hard, what I did, and what happened.",
    earlierTitle: "Selected earlier work.",
    nextLabel: "Next",
    /** The view toggle. Each names the view it switches TO, like the theme
     *  control — never the view you are already in. */
    galleryLabel: "Gallery",
    indexLabel: "Index",
    /** The card's call to action. The arrow is CSS content, not copy. */
    viewLabel: "View case study",
    /** Prefixes a filter pill's accessible name, so a screen reader hears
     *  "Sector: Music" rather than a bare "Music" with no idea what it filters.
     *  The visible pill shows the value alone. */
    filterPillPrefix: ": ",
    /** Sits in a card's image slot until a real `cover` is set in frontmatter. */
    shotPending: "Case study imagery in progress",
    /** Between the active card's number and the total: "01 / 05". */
    counterSeparator: " / ",
    /** The gallery's own landmark name. */
    region: "Selected work gallery",
    /** The progress bar's accessible name. */
    progressLabel: "Gallery progress",
    filters: {
      sector: "Sector",
      discipline: "Discipline",
      /** The unfiltered option in each facet. */
      all: "All",
      clear: "Clear filters",
      /** The filter bar's landmark name. */
      region: "Filter the work",
    },
    metaLabels: {
      client: "Client",
      sector: "Sector",
      discipline: "Discipline",
      platform: "Platform",
      role: "Role",
      timeframe: "Timeframe",
      view: "View the work",
    },
  },
```

- [ ] **Step 3: Verify nothing broke**

Run: `pnpm test && pnpm build && pnpm lint`
Expected: all pass. `site-content.ts` is `as const`, so a deleted key that something still reads is a TypeScript error at build — that is the check.

- [ ] **Step 4: Commit**

```bash
git add src/lib/site-content.ts
git commit
```
Message: the gallery's strings land; the parked shelf's strings go, naming what proved they were dead.

---

## Task 4: The card

**Files:**
- Create: `src/components/work/work-card.tsx`
- Create: `src/components/work/work-card.module.css`
- Test: `src/components/work/work-card.test.tsx`

**Interfaces:**
- Consumes: `formatStudyNumber` from `work-lists`; `siteContent`; `CaseStudy`.
- Produces: `<WorkCard study={study} number={n} />` rendering an element carrying `data-work-card` and `data-slug={study.slug}`.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/work-card.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { WorkCard } from "@/components/work/work-card";
import { siteContent } from "@/lib/site-content";

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);

const study = (over: Partial<CaseStudy> = {}) =>
  ({
    title: "Collaya",
    year: 2025,
    impact: "Shipped a professional audio plugin.",
    tags: ["Audio", "Plugin"],
    slug: "collaya",
    url: "/work/collaya",
    ...over,
  }) as unknown as CaseStudy;

describe("WorkCard", () => {
  it("renders the study's number, year, title and impact", () => {
    render(<WorkCard study={study()} number={3} />);
    expect(screen.getByText("03")).toBeTruthy();
    expect(screen.getByText("2025")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Collaya" })).toBeTruthy();
    expect(screen.getByText("Shipped a professional audio plugin.")).toBeTruthy();
  });

  /* The whole card is the link. A card with a link INSIDE it would give the
     visitor a small target inside a large clickable-looking area.
     next/link renders an <a>, so this assertion holds either way — what it
     pins is that there is exactly ONE, and where it points. */
  it("is one link to the study, not a card containing a link", () => {
    const { container } = render(<WorkCard study={study()} number={1} />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/work/collaya");
  });

  it("renders every tag", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText("Audio")).toBeTruthy();
    expect(screen.getByText("Plugin")).toBeTruthy();
  });

  it("renders no tag list at all when the study has no tags", () => {
    const { container } = render(<WorkCard study={study({ tags: [] })} number={1} />);
    expect(container.querySelector("[data-tags]")).toBeNull();
  });

  /* The image slot is a hatched placeholder until `cover` is set. Spec §9: a
     real screen drops in with no code change. */
  it("shows the pending caption when there is no cover", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText(siteContent.work.shotPending)).toBeTruthy();
  });

  it("renders the cover image, and drops the caption, when one is set", () => {
    const { container } = render(
      <WorkCard study={study({ cover: "/covers/collaya.png" })} number={1} />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/covers/collaya.png");
    expect(screen.queryByText(siteContent.work.shotPending)).toBeNull();
  });

  /* An <img> with no alt is announced by its filename. The title is what the
     image is OF. */
  it("names the cover image", () => {
    const { container } = render(
      <WorkCard study={study({ cover: "/covers/collaya.png" })} number={1} />,
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("Collaya");
  });

  it("carries its slug, so the hook can find it without an index", () => {
    const { container } = render(<WorkCard study={study()} number={1} />);
    expect(container.querySelector("[data-work-card]")?.getAttribute("data-slug")).toBe("collaya");
  });

  /* Copy never lives in JSX (spec §15). */
  it("takes its call to action from site-content", () => {
    render(<WorkCard study={study()} number={1} />);
    expect(screen.getByText(siteContent.work.viewLabel)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/work-card.test.tsx`
Expected: FAIL — cannot resolve `@/components/work/work-card`.

- [ ] **Step 3: Write the CSS**

Create `src/components/work/work-card.module.css`. Values are §9's, verbatim:

```css
/* One card. Geometry lives here and NOT in work-config.ts, because CSS is the
   only thing that reads it — a config entry nothing consumes is a lie that
   passes its tests (Phase 3 shipped three of them). */
.card {
  flex: 0 0 auto;
  width: min(66vw, 820px);
  height: 56vh;
  margin-right: 5vw;
  display: grid;
  grid-template-columns: 1.05fr 0.85fr;
  gap: 3vw;
  color: inherit;
  text-decoration: none;
  /* The hook writes opacity per frame; this only sets how it gets there. */
  transition: opacity 0.5s ease;
}

.card:first-child {
  margin-left: 6vw;
}

.text {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.num {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.05em;
  color: var(--work);
}

.year {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--mute);
}

/* `margin-top: auto` is what pins the title to the bottom of the text column
   and lets the number sit at the top, whatever the impact's length. */
.title {
  margin-top: auto;
  font-size: clamp(1.8rem, 3.2vw, 3rem);
  font-variation-settings: "wght" 600;
  letter-spacing: -0.015em;
  line-height: 1.05;
  transition: color 0.4s ease;
}

.impact {
  margin-top: 20px;
  max-width: 30ch;
  font-size: clamp(1rem, 1.35vw, 1.22rem);
  line-height: 1.42;
  color: var(--ink);
}

.tags {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  list-style: none;
}

.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--work);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 4px 11px;
}

.view {
  margin-top: 26px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--work);
  display: inline-flex;
  gap: 8px;
  align-items: center;
  transition: gap 0.3s ease;
}

/* The arrow is a decoration, not copy — it must never reach the clipboard or a
   screen reader (spec §15). */
.view::after {
  content: "→";
}

.card:hover .title {
  color: var(--work);
}

.card:hover .view {
  gap: 14px;
}

/* The image slot. Hatched until `cover` is set in frontmatter, at which point a
   real screen drops in with no code change (spec §9). */
.shot {
  position: relative;
  height: 100%;
  border: 1px solid var(--hairline);
  background-image: repeating-linear-gradient(
    135deg,
    var(--row-hover) 0 10px,
    var(--canvas) 10px 20px
  );
  display: flex;
  align-items: flex-end;
  padding: 16px;
  overflow: hidden;
}

.shotCaption {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--mute);
}

.cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 4: Write the component**

Create `src/components/work/work-card.tsx`:

```tsx
import Link from "next/link";
import type { CaseStudy } from "#site/content";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work-card.module.css";

/**
 * One study, as a gallery card (spec §9).
 *
 * Dumb on purpose: it is handed its number rather than deriving one, because
 * the number is a property of the whole published list and must be identical
 * here, in the index, and on /work/[slug]. `work-lists.ts` owns that.
 *
 * The card IS the link — a link nested inside a card would give a small target
 * inside a large clickable-looking area.
 */
export function WorkCard({ study, number }: { study: CaseStudy; number: number }) {
  return (
    /* next/link, not <a href>: §10's slide-up modal is an intercepting route,
       and Next only intercepts a client-side Link navigation — a raw anchor does
       a full page load and forecloses it. The codebase already uses Link in
       site-header, case-study-next and /work/[slug]. */
    <Link
      href={study.url}
      className={styles.card}
      data-work-card
      data-slug={study.slug}
      style={{ opacity: 1 }}
    >
      <div className={styles.text}>
        <div className={styles.top}>
          <span className={styles.num}>{formatStudyNumber(number)}</span>
          <span className={styles.year}>{study.year}</span>
        </div>
        <h3 className={styles.title}>{study.title}</h3>
        <p className={styles.impact}>{study.impact}</p>
        {study.tags.length > 0 && (
          <ul className={styles.tags} data-tags>
            {study.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <span className={styles.view}>{siteContent.work.viewLabel}</span>
      </div>
      <div className={styles.shot}>
        {study.cover ? (
          <img src={study.cover} alt={study.title} className={styles.cover} />
        ) : (
          <span className={styles.shotCaption}>{siteContent.work.shotPending}</span>
        )}
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/work-card.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Prove a test can fail**

Delete the `data-slug` attribute. Expected: *"carries its slug"* fails. Restore. Report both outputs.

- [ ] **Step 7: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work-card.tsx src/components/work/work-card.module.css src/components/work/work-card.test.tsx
git commit
```
Message: why the card is the link, why it is handed its number, and why the geometry is in CSS rather than the config.

---

## Task 5: The earlier-work panel

**Files:**
- Rewrite: `src/components/work/earlier-work.tsx`
- Replace: `src/components/work/earlier-work.module.css`
- Test: `src/components/work/earlier-work.test.tsx`

**Interfaces:**
- Consumes: `sortedEarlierWork` from `work-data`; `isViewUrl`/`urlLabel` from `url-label`; `siteContent`.
- Produces: `<EarlierWork />`, the gallery's final panel.

**Why a rewrite, not an edit:** the current file is a card grid carrying `slab`, `heading-display` and `text-ink` — classes from the parked Cold Noon design (`text-ink` no longer exists in `globals.css` at all). It renders each entry's full MDX body. §9 wants a **2-col list**: title plus a one-line attribute row, no body. It is also currently mounted nowhere, so nothing depends on its markup.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/earlier-work.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { EarlierProject } from "#site/content";
import { siteContent } from "@/lib/site-content";

const entry = (over: Partial<EarlierProject> = {}) =>
  ({
    title: "Yahoo! Pattern Library",
    sector: ["Design Systems"],
    discipline: ["Front-end"],
    platform: [],
    role: "Design Lead",
    timeframe: "2007-13",
    view: "Archived",
    order: 1,
  }) as unknown as EarlierProject;

vi.mock("@/components/work/work-data", () => ({
  sortedEarlierWork: [entry(), entry({ title: "Shift", view: "https://shift.com" })],
}));

const { EarlierWork } = await import("@/components/work/earlier-work");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);


describe("EarlierWork", () => {
  it("renders the locked heading from site-content", () => {
    render(<EarlierWork />);
    expect(screen.getByRole("heading", { name: siteContent.work.earlierTitle })).toBeTruthy();
  });

  it("renders every entry", () => {
    render(<EarlierWork />);
    expect(screen.getByText("Yahoo! Pattern Library")).toBeTruthy();
    expect(screen.getByText("Shift")).toBeTruthy();
  });

  /* A link only when `view` is a real URL. "Archived" is a plain-text value the
     full meta slab shows, and linking it would be a link to nowhere. */
  it("links only the entries whose view is a URL", () => {
    const { container } = render(<EarlierWork />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://shift.com");
  });

  /* Spec §9: this panel is a LIST, not the card grid it used to be — no MDX
     body. The body still renders on /work/[slug]; here it would not fit the
     panel and would make the track immeasurably wide. */
  it("renders no MDX body", () => {
    const { container } = render(<EarlierWork />);
    expect(container.querySelector("[data-mdx]")).toBeNull();
  });

  it("renders each entry's attributes as one line", () => {
    render(<EarlierWork />);
    expect(screen.getByText(/Design Lead/)).toBeTruthy();
    expect(screen.getByText(/Design Systems/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/earlier-work.test.tsx`
Expected: FAIL — the current component renders `MDXContent` and its heading uses the old classes.

- [ ] **Step 3: Write the CSS**

Replace `src/components/work/earlier-work.module.css` entirely:

```css
/* The gallery's last panel (spec §9): a 2-col list, wider than a study card
   because it holds every earlier entry at once. */
.panel {
  flex: 0 0 auto;
  width: min(80vw, 1040px);
  height: 56vh;
  margin-right: 6vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.heading {
  font-size: clamp(1.6rem, 3vw, 2.6rem);
  font-variation-settings: "wght" 640;
  letter-spacing: -0.015em;
  margin-bottom: 4vh;
  color: var(--ink);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 40px;
  list-style: none;
}

.item {
  border-top: 1px solid var(--hairline);
  padding-top: 12px;
}

.title {
  font-size: 1.15rem;
  font-variation-settings: "wght" 560;
  color: var(--ink);
  transition: color 0.4s ease;
}

.item:hover .title {
  color: var(--work);
}

.attributes {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.03em;
  color: var(--work);
  margin-top: 4px;
}

/* The separator is a design decision, not copy: it must never reach the
   clipboard or a screen reader (spec §15). */
.attributes span + span::before {
  content: " · ";
  color: var(--mute);
}

.link {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--work);
}

/* One column when there is not room for two. */
@media (max-width: 900px) {
  .panel {
    width: 88vw;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Write the component**

Replace `src/components/work/earlier-work.tsx` entirely:

```tsx
import type { EarlierProject } from "#site/content";
import { isViewUrl, urlLabel } from "@/components/work/url-label";
import { sortedEarlierWork } from "@/components/work/work-data";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-work.module.css";

/**
 * Compact attribute line: role, sector, discipline, platform (when set),
 * timeframe. Separators are CSS-only (spec §15: no punctuation-as-copy in JSX).
 */
function attributeParts(entry: EarlierProject): string[] {
  const parts = [entry.role, entry.sector.join(", "), entry.discipline.join(", ")];
  if (entry.platform.length > 0) parts.push(entry.platform.join(", "));
  parts.push(entry.timeframe);
  return parts;
}

/**
 * The gallery's final panel (spec §9): every earlier project as a 2-col list.
 *
 * A list, not the card grid this used to be, and no MDX body: the body is what
 * /work/[slug] is for, and rendering it here would make the panel unbounded and
 * the track immeasurable. Title plus one attribute line is what a poster wall
 * can carry.
 */
export function EarlierWork() {
  return (
    <section aria-labelledby="earlier-work-title" className={styles.panel}>
      <h3 id="earlier-work-title" className={styles.heading}>
        {siteContent.work.earlierTitle}
      </h3>
      <ul className={styles.grid}>
        {sortedEarlierWork.map((entry) => (
          <li key={entry.title} className={styles.item} data-earlier-work-entry={entry.title}>
            <h4 className={styles.title}>{entry.title}</h4>
            <p className={styles.attributes}>
              {attributeParts(entry).map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </p>
            {isViewUrl(entry.view) && (
              <a href={entry.view} target="_blank" rel="noreferrer" className={styles.link}>
                {urlLabel(entry.view)}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/earlier-work.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Confirm the parked classes are gone**

```bash
grep -rn "slab\|heading-display\|text-ink" src/components/work/
```
Expected: no output.

- [ ] **Step 7: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/earlier-work.tsx src/components/work/earlier-work.module.css src/components/work/earlier-work.test.tsx
git commit
```
Message: why the card grid became a list, and that it was carrying classes from the parked design (one of which no longer exists).

---

## Task 6: The gallery hook

**Files:**
- Create: `src/components/work/use-gallery.ts`
- Test: none (jsdom has no layout — `getBoundingClientRect` returns zeroes, so a unit test here would assert on fiction). The maths is tested in Task 1; this hook is verified in the browser in Task 7.

**Interfaces:**
- Consumes: everything from `gallery-engine`; `WORK` from `work-config`; `getLenis` from `@/components/smooth-scroll`.
- Produces: `useGallery({ wrapRef, stickyRef, trackRef, progressRef, active, onActiveIndex })`.

- [ ] **Step 1: Write the hook**

Create `src/components/work/use-gallery.ts`:

```ts
"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { getLenis } from "@/components/smooth-scroll";
import {
  activeIndexFor,
  cardOpacityFor,
  linearProgress,
  scrollDeltaForPan,
  trackOffsetFor,
  travelFor,
  wrapperHeightFor,
} from "@/components/work/gallery-engine";

/**
 * Drives the Work gallery (spec §9): measures the track, sizes the wrapper from
 * what it measured, and translates the track in X from vertical scroll.
 *
 * It writes; it holds no numbers. Every value comes from `gallery-engine`.
 *
 * No RAF loop of its own — CLAUDE.md's standing rule, and it has silently locked
 * scrolling site-wide before. Lenis already emits on every frame of the shared
 * GSAP ticker, so subscribing to it IS the frame loop.
 */
export function useGallery({
  wrapRef,
  trackRef,
  progressRef,
  active,
  onActiveIndex,
}: {
  wrapRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLElement | null>;
  progressRef: RefObject<HTMLElement | null>;
  active: boolean;
  onActiveIndex: (index: number) => void;
}) {
  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!active || !wrap || !track) return;

    let travel = 0;
    let lastIndex = -1;

    const measure = () => {
      /* scrollWidth, not getBoundingClientRect: the track is translated, and a
         rect would report where it currently IS rather than how wide it is. */
      travel = travelFor(track.scrollWidth, window.innerWidth);
      /* The wrapper's height IS the scroll budget, derived from what we just
         measured. The prototype hardcoded 520vh and let the two drift apart
         every time a study was added or drafted (spec §9, gap 1). */
      wrap.style.height = `${Math.round(wrapperHeightFor(travel, window.innerHeight))}px`;
      update();
    };

    const update = () => {
      const progress = linearProgress(
        wrap.getBoundingClientRect().top,
        wrap.offsetHeight,
        window.innerHeight,
      );
      track.style.transform = `translateX(${trackOffsetFor(progress, travel).toFixed(1)}px)`;

      const bar = progressRef.current;
      if (bar) bar.style.width = `${(progress * 100).toFixed(2)}%`;

      const cards = [...track.querySelectorAll<HTMLElement>("[data-work-card], [data-work-panel]")];
      const centers = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return rect.left + rect.width / 2;
      });

      cards.forEach((card, i) => {
        card.style.opacity = String(
          cardOpacityFor(centers[i] - window.innerWidth * 0.5, window.innerWidth),
        );
      });

      /* Only on change: this runs every frame and a setState per frame would
         re-render the section 60 times a second. */
      const index = activeIndexFor(centers, window.innerWidth);
      if (index !== lastIndex) {
        lastIndex = index;
        onActiveIndex(index);
      }
    };

    /**
     * Horizontal input pans the gallery (spec §9).
     *
     * It drives VERTICAL scroll rather than the track, because `translateX` is
     * derived from `scrollY`: writing the transform here would make this a
     * second source of truth for the same pixel, and the next `update()` would
     * snap the track back out from under the gesture.
     *
     * preventDefault is load-bearing, not tidiness: macOS reads a two-finger
     * horizontal swipe as the browser's Back gesture, so without this, panning
     * the gallery navigates the visitor off the site.
     */
    const onWheel = (event: WheelEvent) => {
      if (travel <= 0) return;
      /* Only a gesture that is meaningfully horizontal. A diagonal trackpad
         swipe carries both deltas, and claiming those would fight the vertical
         scroll the visitor actually asked for. */
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

      const rect = wrap.getBoundingClientRect();
      /* Only while pinned. Outside the stage, a horizontal gesture is not ours. */
      if (rect.top > 0 || rect.bottom < window.innerHeight) return;

      event.preventDefault();
      const delta = scrollDeltaForPan(
        event.deltaX,
        wrap.offsetHeight,
        window.innerHeight,
        travel,
      );
      const lenis = getLenis();
      /* targetScroll, NOT scroll. `scroll` is the ANIMATED position, which lags
         the target while Lenis eases — so during a fast pan each event would add
         its delta to a value that has not caught up yet, and the gesture would
         silently lose distance. `targetScroll` is where the scroll is already
         headed, so deltas accumulate exactly like Lenis's own wheel handling.
         Left smooth (no `immediate`) so a pan feels like every other scroll on
         the site, and so this stays Lenis's scroll rather than a second
         mechanism beside it. */
      if (lenis) lenis.scrollTo(lenis.targetScroll + delta);
      else window.scrollBy(0, delta);
    };

    const lenis = getLenis();
    lenis?.on("scroll", update);
    /* A fallback for the window before Lenis mounts, and for a scroll it did not
       originate. Cheap: update() is the same work either way. */
    window.addEventListener("scroll", update, { passive: true });
    /* passive: false — a passive listener cannot preventDefault, and without
       preventDefault this feature navigates people off the site. */
    window.addEventListener("wheel", onWheel, { passive: false });

    /* The track's width changes with the viewport (the card is `min(66vw,
       820px)`), and with the fonts, which land after first paint. Observing the
       track catches both without guessing at either. */
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);

    measure();

    return () => {
      lenis?.off("scroll", update);
      window.removeEventListener("scroll", update);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", measure);
      observer.disconnect();
      /* Leave nothing behind: the index view and the reduced-motion path both
         render into this same DOM, and a stale inline height or transform would
         silently govern them. */
      wrap.style.height = "";
      track.style.transform = "";
      for (const card of track.querySelectorAll<HTMLElement>("[data-work-card], [data-work-panel]")) {
        card.style.opacity = "";
      }
    };
  }, [wrapRef, trackRef, progressRef, active, onActiveIndex]);
}
```

- [ ] **Step 2: Confirm it compiles and nothing regressed**

Run: `pnpm test && pnpm build && pnpm lint`
Expected: all pass. The hook has no test — it is verified in the browser in Task 7.

- [ ] **Step 3: Commit**

```bash
git add src/components/work/use-gallery.ts
git commit
```
Message: why there is no RAF loop, why the wrapper's height is written from a measurement, and why `preventDefault` on the wheel is the difference between the pan and a trap.

---

## Task 7: The gallery, assembled and seen

**Files:**
- Create: `src/components/work/work-gallery.tsx`
- Modify: `src/components/work/work.module.css` (add the gallery's styles; the index's arrive in Task 8)
- Test: `src/components/work/work-gallery.test.tsx`

**Interfaces:**
- Consumes: `WorkCard`, `EarlierWork`, `useGallery`, `publishedWork`, `formatStudyNumber`, `siteContent`.
- Produces: `<WorkGallery />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/work-gallery.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string, order: number) =>
  ({
    title,
    order,
    year: 2024,
    impact: `${title} impact.`,
    tags: [],
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [study("Alpha", 1), study("Beta", 2)],
  sortedEarlierWork: [],
}));

const { WorkGallery } = await import("@/components/work/work-gallery");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);


describe("WorkGallery", () => {
  it("renders one card per published study", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelectorAll("[data-work-card]")).toHaveLength(2);
  });

  /* Prototype gap 4: card numbers 01-08 were hardcoded in markup while the
     counter was live off cards.length, so they could disagree. Both derive from
     the same list now. */
  it("numbers the cards from the data, not from markup", () => {
    render(<WorkGallery />);
    expect(screen.getByText("01")).toBeTruthy();
    expect(screen.getByText("02")).toBeTruthy();
  });

  /* The panel count is studies + the earlier panel, and is never written down:
     2 studies + 1 panel = 03. When Tappa and the Meta studies come off draft
     this becomes 08 with no code change. */
  it("counts the earlier panel in the total", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelector("[data-total]")?.textContent).toBe("03");
    expect(container.querySelectorAll("[data-work-panel]")).toHaveLength(1);
  });

  it("names the gallery landmark from site-content", () => {
    render(<WorkGallery />);
    expect(screen.getByRole("region", { name: siteContent.work.region })).toBeTruthy();
  });

  /* The progress bar reports the same thing the counter does, so it is noise to
     a screen reader. */
  it("hides the progress bar from assistive tech", () => {
    const { container } = render(<WorkGallery />);
    expect(container.querySelector("[data-progress]")?.getAttribute("aria-hidden")).toBe("true");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/work-gallery.test.tsx`
Expected: FAIL — cannot resolve `@/components/work/work-gallery`.

- [ ] **Step 3: Add the gallery CSS**

Append to `src/components/work/work.module.css`:

```css
/* The gallery (spec §9). The wrapper's height is written by use-gallery from
   the measured track width — there is deliberately NO height here. The
   prototype's 520vh was hardcoded and decoupled from travel, so its
   scroll-to-pixel rate drifted every time a study was added (gap 1). A height
   in this file would reintroduce exactly that. */
.galleryWrap {
  position: relative;
}

.stage {
  position: sticky;
  top: 0;
  height: 100vh;
  /* `clip`, NOT `hidden`. They clip identically; `hidden` makes this a scroll
     container, and the track is translated by more than a screen inside it — so
     focusing a card would scroll the stage and drag every child with it. This is
     the bug Phase 3 shipped in About and fixed there for the same reason. */
  overflow: clip;
}

.track {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 15vh;
  will-change: transform;
  /* macOS reads a two-finger horizontal swipe as Back. use-gallery calls
     preventDefault on the gestures it claims; this stops the ones it does not
     from navigating the visitor off the site. */
  overscroll-behavior-x: contain;
}

.wayfinding {
  position: absolute;
  left: 6vw;
  right: 6vw;
  bottom: 6vh;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 20px;
}

.counter {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--mute);
  white-space: nowrap;
}

.counter b {
  color: var(--work);
  font-variation-settings: "wght" 500;
}

.progress {
  position: relative;
  flex: 1;
  height: 1px;
  background: var(--hairline);
}

.progressFill {
  position: absolute;
  left: 0;
  top: 0;
  height: 1px;
  width: 0;
  background: var(--work);
}
```

- [ ] **Step 4: Write the component**

Create `src/components/work/work-gallery.tsx`:

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { EarlierWork } from "@/components/work/earlier-work";
import { useGallery } from "@/components/work/use-gallery";
import { WorkCard } from "@/components/work/work-card";
import { publishedWork } from "@/components/work/work-data";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * The pinned horizontal gallery (spec §9): vertical scroll translates the track
 * in X, one card per published study, and the earlier-work panel last.
 *
 * Every count is derived. The prototype numbered its cards 01-08 in markup while
 * its counter read `cards.length`, so the two could disagree; here both come off
 * `publishedWork`, and drafting a study changes them together.
 */
export function WorkGallery() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const onActiveIndex = useCallback((i: number) => setActiveIndex(i), []);

  useGallery({ wrapRef, trackRef, progressRef, active: true, onActiveIndex });

  /* Studies plus the earlier panel. Never written down. */
  const panelCount = publishedWork.length + 1;

  return (
    <div ref={wrapRef} className={styles.galleryWrap}>
      <div className={styles.stage}>
        <div ref={trackRef} className={styles.track}>
          {publishedWork.map((study, i) => (
            <WorkCard key={study.slug} study={study} number={i + 1} />
          ))}
          <div data-work-panel style={{ opacity: 1 }}>
            <EarlierWork />
          </div>
        </div>

        <div className={styles.wayfinding}>
          <p className={styles.counter}>
            <b>{formatStudyNumber(activeIndex + 1)}</b>
            {siteContent.work.counterSeparator}
            <span data-total>{formatStudyNumber(panelCount)}</span>
          </p>
          {/* Decorative: it reports what the counter already says, so naming it
              for a screen reader would announce the same fact twice. */}
          <div className={styles.progress} data-progress aria-hidden="true">
            <i ref={progressRef} className={styles.progressFill} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

Then wrap it in the named region — in `work.tsx` (Task 9). For now the test's `getByRole("region")` needs it here, so add `role="region"` and `aria-label={siteContent.work.region}` to the outer `<div ref={wrapRef}>`.

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/work-gallery.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Mount it and LOOK at it**

Temporarily render `<WorkGallery />` from `work.tsx` in place of the stub's body. Then, in a browser:

1. Kill any stale server: `lsof -ti:3000 -sTCP:LISTEN | xargs kill -9`, then `pnpm dev`.
2. Load `/`, scroll to `#work`.
3. **Take a screenshot in BOTH themes and look at them.** The cards must be legible, the hatch visible, the counter and progress bar readable.

Then measure — report the actual numbers:

```js
// the wrapper height must be DERIVED, not 520vh
const wrap = document.querySelector('[class*="galleryWrap"]');
const track = document.querySelector('[class*="track"]');
({ wrapHeight: wrap.style.height, trackScrollWidth: track.scrollWidth, vw: innerWidth });

// the stage must not be a scrollport (the Phase 3 About bug)
const stage = document.querySelector('[class*="stage"]');
({ scrollHeight: stage.scrollHeight, clientHeight: stage.clientHeight }); // must be equal

// a card must be REACHABLE, not merely present
const card = document.querySelector('[data-work-card]');
const r = card.getBoundingClientRect();
document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-work-card]') === card;
```

- [ ] **Step 7: Verify the horizontal pan, and that it cannot navigate away**

With the stage pinned, dispatch a horizontal wheel event and confirm the track moved AND the page did not navigate:

```js
const before = document.querySelector('[class*="track"]').style.transform;
window.dispatchEvent(new WheelEvent('wheel', { deltaX: 240, deltaY: 0, cancelable: true, bubbles: true }));
await new Promise((r) => setTimeout(r, 400));
({ before, after: document.querySelector('[class*="track"]').style.transform, url: location.href });
```
Expected: the transform moved left; `url` unchanged.

Then prove the guard works: dispatch `{ deltaX: 0, deltaY: 240 }` and confirm the wheel handler did NOT claim it (the page scrolls normally). And dispatch a horizontal wheel while scrolled ABOVE the gallery and confirm the track does not move.

- [ ] **Step 8: Verify the counter agrees with the eye**

Scroll to three positions across the gallery. At each, read the counter and confirm the highlighted card really is the one nearest the horizontal center. Report the three readings.

- [ ] **Step 9: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work-gallery.tsx src/components/work/work.module.css src/components/work/work-gallery.test.tsx src/components/work/work.tsx
git commit
```
Message: the gallery lands; say what you measured, not that it "works".

---

## Task 8: The index

**Files:**
- Create: `src/components/work/work-index.tsx`
- Modify: `src/components/work/work.module.css` (append the index's styles)
- Test: `src/components/work/work-index.test.tsx`

**Interfaces:**
- Consumes: `work-filters`; `publishedWork`; `formatStudyNumber`; `siteContent`.
- Produces: `<WorkIndex />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/work-index.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string, sector: string[], discipline: string[]) =>
  ({
    title,
    sector,
    discipline,
    year: 2024,
    order: 1,
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [
    study("Alpha", ["Music"], ["Product Design"]),
    study("Beta", ["Automotive"], ["Front-end"]),
  ],
}));

const { WorkIndex } = await import("@/components/work/work-index");

/* afterEach(cleanup) is not boilerplate here. vitest.config.ts does not set
   `test.globals: true`, so Testing Library never finds a global afterEach to
   register its automatic cleanup with — renders from earlier tests stay in the
   DOM and getByText starts finding three of everything. Every render-based test
   in this repo does this explicitly; match them. */
afterEach(cleanup);


describe("WorkIndex", () => {
  it("renders one row per study, each linking to its page", () => {
    const { container } = render(<WorkIndex />);
    const links = container.querySelectorAll("[data-work-row] a");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/work/alpha");
  });

  /* Facets are derived from frontmatter (spec §9), so a new study changes the
     bar with no code edit. */
  it("offers a filter pill for every distinct facet value in the data", () => {
    render(<WorkIndex />);
    expect(screen.getByRole("button", { name: "Sector: Music" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sector: Automotive" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Discipline: Front-end" })).toBeTruthy();
  });

  /* The pill is a toggle, so it must SAY it is one. aria-pressed is the whole
     difference between "a button called Music" and "a filter that is on". */
  it("reports each pill's pressed state", () => {
    render(<WorkIndex />);
    const music = screen.getByRole("button", { name: "Sector: Music" });
    expect(music.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(music);
    expect(music.getAttribute("aria-pressed")).toBe("true");
  });

  it("filters the rows when a sector pill is pressed", () => {
    const { container } = render(<WorkIndex />);
    fireEvent.click(screen.getByRole("button", { name: "Sector: Music" }));
    const rows = container.querySelectorAll("[data-work-row]");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Alpha");
  });

  /* Clicking the pressed pill again clears it — the same gesture that set it.
     Without this the only way out is the clear button, which is a dead end for
     anyone who does not notice it. */
  it("clears a facet when its pressed pill is clicked again", () => {
    const { container } = render(<WorkIndex />);
    const music = screen.getByRole("button", { name: "Sector: Music" });
    fireEvent.click(music);
    fireEvent.click(music);
    expect(container.querySelectorAll("[data-work-row]")).toHaveLength(2);
    expect(music.getAttribute("aria-pressed")).toBe("false");
  });

  it("restores every row when the filter is cleared", () => {
    const { container } = render(<WorkIndex />);
    fireEvent.click(screen.getByRole("button", { name: "Sector: Music" }));
    fireEvent.click(screen.getByRole("button", { name: siteContent.work.filters.clear }));
    expect(container.querySelectorAll("[data-work-row]")).toHaveLength(2);
  });

  /* The clear control is meaningless with nothing to clear. */
  it("offers no clear control until a filter is active", () => {
    render(<WorkIndex />);
    expect(screen.queryByRole("button", { name: siteContent.work.filters.clear })).toBeNull();
  });

  /* A filtered row must keep the number it has in the gallery and on its own
     page — the number is the study's identity, not its position in a view. */
  it("keeps a study's number when a filter hides the studies before it", () => {
    render(<WorkIndex />);
    fireEvent.change(screen.getByLabelText(siteContent.work.filters.sector), {
      target: { value: "Automotive" },
    });
    expect(screen.getByText("02")).toBeTruthy();
    expect(screen.queryByText("01")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/work-index.test.tsx`
Expected: FAIL — cannot resolve `@/components/work/work-index`.

- [ ] **Step 3: Add the index CSS**

Append to `src/components/work/work.module.css`. Values are §9's, verbatim:

```css
.index {
  padding: 0 6vw 10vh;
}

.filters {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0 24px;
}

/* One facet: its label, then its pills. */
.facet {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filterLabel {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--mute);
  margin-right: 4px;
}

/* Deliberately the card's tag pill, at the same radius and weight. The filter
   bar is speced in §9 but appears in NO prototype, so it has no design of its
   own to follow — borrowing the one pill already on screen is what keeps it from
   becoming a fifth invented thing. Jono chose this over native <select>s. */
.pill {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--mute);
  background: transparent;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 4px 11px;
  cursor: pointer;
  transition:
    color 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

.pill:hover {
  color: var(--work);
  border-color: var(--work);
}

/* The pressed state has to survive a color-blind read and a grayscale print,
   so it is not carried by hue alone: the fill inverts. */
.pill[aria-pressed="true"] {
  color: var(--canvas);
  background: var(--work);
  border-color: var(--work);
}

.clear {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--work);
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 0;
}

.rows {
  border-top: 1px solid var(--hairline);
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid var(--hairline);
  transition:
    padding-left 0.4s cubic-bezier(0.2, 0.7, 0.2, 1),
    background 0.4s ease;
}

.row:hover {
  padding-left: 24px;
  background: var(--row-hover);
}

/* The whole row is the link, so the hit target is the row and not the words. */
.rowLink {
  display: contents;
  color: inherit;
  text-decoration: none;
}

.rowNum {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--mute);
  padding: 30px 0 30px 8px;
  transition: color 0.4s ease;
}

.row:hover .rowNum {
  color: var(--work);
}

.rowTitle {
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  font-variation-settings: "wght" 480;
  letter-spacing: -0.01em;
  padding: 30px 0;
  transition:
    font-variation-settings 0.4s ease,
    color 0.4s ease;
}

.row:hover .rowTitle {
  font-variation-settings: "wght" 620;
  color: var(--work);
}

.rowMeta {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--mute);
  text-align: right;
  line-height: 1.5;
  padding: 30px 8px 30px 0;
}

.rowArrow {
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
  color: var(--work);
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  padding-right: 8px;
}

.row:hover .rowArrow {
  opacity: 1;
  transform: translateX(0);
}

.empty {
  padding: 40px 8px;
  color: var(--mute);
}
```

- [ ] **Step 4: Write the component**

Create `src/components/work/work-index.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { publishedWork } from "@/components/work/work-data";
import {
  NO_FILTER,
  applyFilter,
  facetValues,
  isFilterActive,
} from "@/components/work/work-filters";
import type { Facet, WorkFilter } from "@/components/work/work-filters";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * One facet's row of pills. Jono chose these over native <select>s; the filter
 * bar is speced in §9 but exists in no prototype, so it borrows the card's tag
 * pill rather than inventing a fifth thing.
 *
 * Buttons with `aria-pressed`, not links and not a listbox: each pill is an
 * independent on/off, which is exactly what aria-pressed describes. Clicking a
 * pressed pill clears it — the same gesture that set it, so the clear button is
 * a convenience and never the only way out.
 */
function FacetRow({
  facet,
  label,
  values,
  chosen,
  onChoose,
}: {
  facet: Facet;
  label: string;
  values: string[];
  chosen: string | null;
  onChoose: (value: string | null) => void;
}) {
  return (
    <div className={styles.facet}>
      <span className={styles.filterLabel}>{label}</span>
      {values.map((value) => {
        const pressed = chosen === value;
        return (
          <button
            key={`${facet}-${value}`}
            type="button"
            className={styles.pill}
            aria-pressed={pressed}
            /* The pill shows the bare value; the accessible name carries the
               facet too, or a screen reader hears "Music" with no idea what it
               filters. */
            aria-label={`${label}${siteContent.work.filterPillPrefix}${value}`}
            onClick={() => onChoose(pressed ? null : value)}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The vertical index (spec §9): every study as a row, filterable by Sector and
 * Discipline, both derived from frontmatter.
 *
 * Also the automatic fallback — under ~900px and under reduced motion the
 * gallery collapses to this, which is why it must stand on its own.
 *
 * A row's number is its position in `publishedWork`, NOT its position in the
 * filtered list: the number is the study's identity and it must read the same
 * here, on a card, and on /work/[slug].
 */
export function WorkIndex() {
  const [filter, setFilter] = useState<WorkFilter>(NO_FILTER);

  const sectors = useMemo(() => facetValues(publishedWork, "sector"), []);
  const disciplines = useMemo(() => facetValues(publishedWork, "discipline"), []);
  const shown = useMemo(() => applyFilter(publishedWork, filter), [filter]);

  return (
    <div className={styles.index}>
      <div className={styles.filters} role="group" aria-label={siteContent.work.filters.region}>
        <FacetRow
          facet="sector"
          label={siteContent.work.filters.sector}
          values={sectors}
          chosen={filter.sector}
          onChoose={(value) => setFilter((f) => ({ ...f, sector: value }))}
        />
        <FacetRow
          facet="discipline"
          label={siteContent.work.filters.discipline}
          values={disciplines}
          chosen={filter.discipline}
          onChoose={(value) => setFilter((f) => ({ ...f, discipline: value }))}
        />
        {isFilterActive(filter) && (
          <button type="button" className={styles.clear} onClick={() => setFilter(NO_FILTER)}>
            {siteContent.work.filters.clear}
          </button>
        )}
      </div>

      <ol className={styles.rows}>
        {shown.map((study) => (
          <li key={study.slug} className={styles.row} data-work-row>
            <Link href={study.url} className={styles.rowLink}>
              <span className={styles.rowNum}>
                {formatStudyNumber(publishedWork.indexOf(study) + 1)}
              </span>
              <span className={styles.rowTitle}>{study.title}</span>
              <span className={styles.rowMeta}>{study.year}</span>
            </Link>
            {/* Decoration, not copy: it must never reach the clipboard or a
                screen reader (spec §15). */}
            <span className={styles.rowArrow} aria-hidden="true">
              →
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/work-index.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 6: Prove the numbering test can fail**

Change `formatStudyNumber(publishedWork.indexOf(study) + 1)` to use the filtered list's index instead. Expected: *"keeps a study's number when a filter hides the studies before it"* fails. Restore. Report both outputs.

- [ ] **Step 7: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work-index.tsx src/components/work/work.module.css src/components/work/work-index.test.tsx
git commit
```
Message: why a row's number comes from the published list and not the filtered one.

---

## Task 9: The hybrid — view state, the toggle, and the collapse

**Files:**
- Replace: `src/components/work/work.tsx`
- Modify: `src/components/work/work.module.css` (the header, and the reduced-motion / narrow collapse)
- Test: `src/components/work/work.test.tsx`

**Interfaces:**
- Consumes: `WorkGallery`, `WorkIndex`, `useReducedMotionPref` from `@/lib/use-reduced-motion`, `siteContent`.
- Produces: `<Work />` — the `#work` landmark.

- [ ] **Step 1: Write the failing test**

Create `src/components/work/work.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";

const study = (title: string) =>
  ({
    title,
    sector: ["Music"],
    discipline: ["Product Design"],
    year: 2024,
    order: 1,
    impact: "Impact.",
    tags: [],
    slug: title.toLowerCase(),
    url: `/work/${title.toLowerCase()}`,
  }) as unknown as CaseStudy;

vi.mock("@/components/work/work-data", () => ({
  publishedWork: [study("Alpha")],
  sortedEarlierWork: [],
}));

function matchMediaReduced(reduced: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduced && q.includes("reduced-motion"),
    media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

matchMediaReduced(false);
const { Work } = await import("@/components/work/work");

afterEach(() => { cleanup(); matchMediaReduced(false); });

describe("Work", () => {
  it("renders the locked section title from site-content", () => {
    render(<Work />);
    expect(screen.getByRole("heading", { name: siteContent.titles.work })).toBeTruthy();
  });

  it("names the landmark", () => {
    const { container } = render(<Work />);
    expect(container.querySelector("section")?.getAttribute("id")).toBe("work");
    expect(container.querySelector("section")?.getAttribute("aria-labelledby")).toBe("work-title");
  });

  it("shows the gallery by default", () => {
    const { container } = render(<Work />);
    expect(container.querySelector("[data-work-card]")).toBeTruthy();
    expect(container.querySelector("[data-work-row]")).toBeNull();
  });

  /* The toggle names the view it switches TO, like the theme control. */
  it("switches to the index and back", () => {
    const { container } = render(<Work />);
    fireEvent.click(screen.getByRole("button", { name: siteContent.work.indexLabel }));
    expect(container.querySelector("[data-work-row]")).toBeTruthy();
    expect(container.querySelector("[data-work-card]")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: siteContent.work.galleryLabel }));
    expect(container.querySelector("[data-work-card]")).toBeTruthy();
  });

  /* Spec §9, gap 3: under reduce the gallery collapses to the index — and there
     must be no toggle back into it, or the control would offer motion to
     someone who asked for none. */
  it("collapses to the index under reduced motion, with no way back to the gallery", async () => {
    matchMediaReduced(true);
    vi.resetModules();
    const { Work: Reduced } = await import("@/components/work/work");
    const { container } = render(<Reduced />);
    expect(container.querySelector("[data-work-row]")).toBeTruthy();
    expect(container.querySelector("[data-work-card]")).toBeNull();
    expect(screen.queryByRole("button", { name: siteContent.work.galleryLabel })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/work/work.test.tsx`
Expected: FAIL — the stub renders neither a card nor a toggle.

- [ ] **Step 3: Add the header and collapse CSS**

Append to `src/components/work/work.module.css`:

```css
/* The section's own locked header. The view toggle lives HERE and not in the
   nav (spec §9): global chrome stays global, view state stays local — and it is
   what keeps the theme toggle from crowding the nav. */
/* `--header-h` is the header's LIVE measured height, published on <html> by
   use-header-height. Not a viewport unit and not a literal: the header is not
   one height (it grows a second row), and a guessed value tucks this title under
   the pill on a short window. Do not invent a new variable name — this one is
   real and `--header-height` is not. */
.head {
  position: sticky;
  top: var(--header-h, 84px);
  z-index: 20;
  background: var(--canvas);
  display: flex;
  align-items: baseline;
  gap: 20px;
  padding: 8px 6vw 16px;
  margin-bottom: 4vh;
}

.toggle {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--work);
  background: none;
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 6px 14px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.toggle:hover {
  background: var(--row-hover);
}

/* Narrow screens get the index, full stop (spec §9, gap 2: the prototype had
   zero media queries). A 66vw card on a phone is not a poster wall, and a track
   wider than the device is a scroll trap. */
@media (max-width: 900px) {
  .toggle {
    display: none;
  }
}
```

- [ ] **Step 4: Write the component**

Replace `src/components/work/work.tsx` entirely:

```tsx
"use client";

import { useState } from "react";
import { WorkGallery } from "@/components/work/work-gallery";
import { WorkIndex } from "@/components/work/work-index";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

type View = "gallery" | "index";

/**
 * Work (spec §9): two views over one dataset.
 *
 * The gallery is the default and the index is the escape hatch the parked Cold
 * Noon shelf never had. If the gallery ever stops earning its place on the
 * pixels, the index is already built and this default is a one-word change.
 *
 * Under reduced motion the index is not a choice, it is the only view: the
 * gallery IS the motion, so offering a toggle into it would offer motion to
 * someone who asked for none.
 */
export function Work() {
  const reduced = useReducedMotionPref();
  const [view, setView] = useState<View>("gallery");
  const showing: View = reduced ? "index" : view;

  return (
    <section className={styles.work} id="work" aria-labelledby="work-title">
      <div className={styles.head}>
        <h2 className={styles.title} id="work-title">
          {siteContent.titles.work}
        </h2>
        {!reduced && (
          /* Names the view it switches TO, never the one you are in — the same
             rule the theme control follows. */
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setView(showing === "gallery" ? "index" : "gallery")}
          >
            {showing === "gallery" ? siteContent.work.indexLabel : siteContent.work.galleryLabel}
          </button>
        )}
      </div>

      {showing === "gallery" ? <WorkGallery /> : <WorkIndex />}
    </section>
  );
}
```

Remove `.intro`, `.index`, `.row`, `.num`, `.rowTitle`, `.meta` from `work.module.css` if they are the stub's and now unused — check with `grep -rn "styles\.<name>" src/`.

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/work/work.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Verify the narrow collapse and reduced motion in a BROWSER**

The media query is CSS and the reduced-motion branch is JS; only one of them is visible to jsdom. With Playwright, on the real path:

1. `emulateMedia({ reducedMotion: 'reduce' })`, reload, scroll to `#work`. Assert `[data-work-row]` exists, `[data-work-card]` does not, and **screenshot it**.
2. Resize to 480px wide, reload. Screenshot. The layout must be usable — no horizontal page scroll: assert `document.documentElement.scrollWidth <= innerWidth`.
3. Back at 1440px with motion allowed, click the toggle both ways and screenshot each view **in both themes**.

Report the assertions and say you looked at the screenshots.

- [ ] **Step 7: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/work/work.tsx src/components/work/work.module.css src/components/work/work.test.tsx
git commit
```
Message: why the toggle is local to the section, and why reduced motion gets no toggle at all.

---

## Task 10: Close the loop — the whole section, seen

**Files:**
- Modify: whatever the findings require.
- Test: `src/components/work/work-gallery.test.tsx` (add the counter-total regression below)

- [ ] **Step 1: Pin the count that must never be written down**

Add to `src/components/work/work-gallery.test.tsx`:

```tsx
/* The single most likely regression in this section: someone "simplifies" the
   panel count to a literal. Then a study comes off draft and the counter lies.
   This is prototype gap 4, which §9 exists partly to prevent. */
it("re-counts when the published list changes, with no code change", async () => {
  vi.resetModules();
  vi.doMock("@/components/work/work-data", () => ({
    publishedWork: [study("A", 1), study("B", 2), study("C", 3), study("D", 4)],
    sortedEarlierWork: [],
  }));
  const { WorkGallery: Four } = await import("@/components/work/work-gallery");
  const { container } = render(<Four />);
  expect(container.querySelector("[data-total]")?.textContent).toBe("05");
  expect(container.querySelectorAll("[data-work-card]")).toHaveLength(4);
});
```

Run: `pnpm test src/components/work/work-gallery.test.tsx` — expected PASS. Then hardcode `const panelCount = 5` in `work-gallery.tsx` and confirm the FIRST gallery test (`"counts the earlier panel in the total"`, which expects `03`) goes red. Restore. Report both outputs.

- [ ] **Step 2: Full-section browser pass**

Fresh `pnpm dev` (kill the old server first — check its start time postdates your last commit). Then, at 1440px:

1. Scroll the whole gallery start to finish in **both themes**. Screenshot at least three positions each. **Look at them.** The cards must be legible, the hatch must read as a placeholder and not as an error, the counter must agree with the center card.
2. `document.documentElement.scrollWidth <= window.innerWidth` — the page must never scroll horizontally, whatever the track does.
3. Tab through the section from the header. Every card and every row must take focus, and **the focus ring must be visible** — this is the Phase 3 About bug, where a focusable link sat at 14% opacity inside a scroll-driven zone. If a card is at `cardDimOpacity` when focused, that is the same defect; report it.
4. `document.elementFromPoint` on a card's center must return the card or a descendant.
5. Click a card and confirm it lands on `/work/<slug>`.
6. Console must be clean.

- [ ] **Step 3: Confirm nothing was left dead**

```bash
grep -rn "work\.shelf" src/          # the parked shelf strings
grep -rn "slab\|heading-display\|text-ink" src/components/work/
grep -rn "520vh\|'01'\|\"01\"" src/components/work/    # any hardcoded count or height
```
Expected: no output from any. If the last one matches `formatStudyNumber`'s padding, that is fine — it is derived; say so.

- [ ] **Step 4: Commit any fixes, then report**

Report to the controller: what you measured, what you saw in the screenshots, and anything you could not verify. Do NOT report "works" without a number or an image behind it.

---

## Self-Review

**Spec coverage:**

| §9 requirement | Task |
|---|---|
| Two views over one dataset, toggled from the section's own header | 9 |
| Sticky 100vh stage, vertical scroll translates `#wtrack` in X | 6, 7 |
| `travel = max(0, scrollWidth - innerWidth + innerWidth*0.06)` | 1 |
| `lp = clamp(-wrapRect.top / (wrapH - vh), 0, 1)`, linear | 1 |
| Active index = nearest viewport center, NOT from `lp` | 1, 7 |
| Focal band `0.55 × innerWidth`, else `0.42`, `transition: opacity 0.5s ease` | 1, 4 |
| Wayfinding: locked title, live counter, progress bar bottom | 7, 9 |
| Card geometry, number/year/title/impact/tags/view | 4 |
| `.wshot` hatched placeholder wired to `cover` | 4 |
| Earlier-work panel, 2-col list | 5 |
| **Horizontal input pans, by driving vertical scroll** | 1, 6, 7 |
| **macOS Back-gesture hazard** | 6 (preventDefault), 7 (`overscroll-behavior-x`), 7 step 7 |
| **Lenis cooperation, no second scroll mechanism** | 6 |
| Gap 1: wrapper height derived from measured travel | 1, 6 |
| Gap 2: media queries; index is the layout under ~900px | 5, 9 |
| Gap 3: reduced motion collapses to the index | 9 |
| Gap 4: card numbers derived from data | 4, 7, 10 |
| Gap 5: card copy from MDX only, no duplication | 4 (reads `study.*` only) |
| Index: rows, Sector + Discipline filters from frontmatter | 2, 8 |
| Filter bar has NO prototype — pills chosen by Jono over native selects | 8 |
| Cards and rows are `next/link`, so §10 can intercept them later | 4, 8 |
| Index: grid `64px 1fr auto`, hover choreography | 8 |

**Gap found and closed during review:** §9 says "Draft impact renders italic." Draft studies are excluded from `publishedWork` by `selectPublishedWork`, so **no draft study can ever reach a card** — the rule is unreachable and `.wimpact.draft` would be dead CSS. Task 4 therefore omits it deliberately. This is recorded here rather than silently dropped; if Jono wants drafts visible-but-marked, that is a change to `selectPublishedWork` and a separate decision.

**Type consistency:** `WorkFilter`/`Facet`/`NO_FILTER` (Task 2) are used with those exact names in Task 8. `WORK` (Task 1) is consumed in Tasks 1 and 6 only. `formatStudyNumber` matches `work-lists.ts`'s existing signature. `data-work-card` / `data-work-panel` / `data-work-row` / `data-total` / `data-tags` / `data-progress` are used consistently across Tasks 4, 6, 7, 8, 9, 10.

**Placeholder scan:** clean — every code step carries its code, every verification step names the command and the expected result.
