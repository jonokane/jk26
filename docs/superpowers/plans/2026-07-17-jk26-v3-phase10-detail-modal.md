# jk26-v3 Phase 10 — Detail modal (intercepting routes) + stark detail surface

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build spec §10 — a slide-up case-study modal over the one-pager via Next's parallel + intercepting routes, and restyle the shared case-study surface (used by the modal *and* `/work/[slug]`) from dead Cold Noon tokens to the stark palette, reshaped to the handoff prototype's single-column detail design.

**Architecture:** One `CaseStudyArticle` renders a study on both surfaces (single source of truth). Part 1 reshapes that article and its children (`CaseStudyIntro`, `CaseStudyMeta`, `CaseStudyCover`, `CaseStudyNext`) to the prototype's layout on stark tokens — this alone fixes `/work/[slug]`, which today styles against removed tokens. Part 2 adds a `@modal` parallel-route slot in the root layout and a `(.)work/[slug]` interceptor that wraps the same article in a `CaseStudyModal` client shell: an opaque canvas sheet that slides up `translateY(100%→0)`, locks Lenis while open, and closes on Escape / close-pill / back button. `/work/[slug]` stays the hard-load / refresh / share surface. URL is the source of truth for what's open.

**Tech Stack:** Next.js 16 (App Router, Turbopack, React 19), TypeScript, CSS Modules, Tailwind v4 (stark tokens in `globals.css`), Lenis + GSAP shared ticker, Velite MDX, Vitest + Testing Library, pnpm.

## Global Constraints

Every task's requirements implicitly include these. Copied from CLAUDE.md and the spec:

- **pnpm only.** Never `npm`/`yarn`. Test command is `pnpm test` (already non-watch); **never** `pnpm test run` (passes `run` as a filename filter → matches nothing → exits 1). Single file: `pnpm test <path>`.
- **Run `pnpm build` AND `pnpm test` before every commit.** Both must pass. Lint clean too (`pnpm lint`).
- **Never `git add -A`.** Stage only the files the task names.
- **Never touch** `content/work/collaya.mdx` or `next.config.ts` (Jono's uncommitted work).
- **Content never lives in JSX (§14).** Every user-facing string — including accessible names and captions — lives in `src/lib/site-content.ts`. Editing words must not require touching a component.
- **Stark tokens only.** The live palette tokens are `--canvas --ink --mute --dim --hairline --row-hover --about --work --contact --nav-glass --nav-edge --shadow-color`, the elevation composites `--shadow-elevation-low|-medium|-high|-lift`, and the fonts `--font-mono --font-display --font-body --font-wordmark`. The dead Cold Noon tokens `--scrim --sub --card-bg --card-border --elev --text-glow --sky-top --sky-mid --sky-hor --scrim-runway` are undefined and must not appear in any new/edited CSS. Natural swaps: `--sub`→`--mute`, `--card-border`→`--hairline`, `--elev` box-shadow→`--shadow-elevation-*`, `--card-bg`→`--canvas`, `--text-glow` text-shadow→drop it, `--sky-*` gradient→stark grays (`--row-hover`/`--canvas`).
- **Motion curves (spec §11):** overlay slide is `0.6s cubic-bezier(0.2, 0.8, 0.2, 1)`, transform only. Standard curve elsewhere is `cubic-bezier(0.2, 0.7, 0.2, 1)`.
- **Reduced motion is first-class (spec §11).** Under `prefers-reduced-motion: reduce`, the sheet does not animate (no slide) and closing navigates immediately.
- **No second RAF loop (CLAUDE.md).** The one Lenis+GSAP ticker owns scrolling. Lock the background with `getLenis()?.stop()` / `getLenis()?.start()`; let the modal scroll natively with `data-lenis-prevent` on its scroll container. Never add `autoRaf` or a `requestAnimationFrame` scroll loop.
- **Verify visual work in the rendered pixels, both themes** (CLAUDE.md). Confirm first-paint / load-order claims against the served HTML (`curl`), not the JSX. Confirm the dev server postdates your edits.
- **Commit trailers** (every commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_011b64DrxdY9bE8xYAnAbWM7
  ```

## Files

**Part 1 — reshape the shared detail surface (stark palette, prototype layout):**
- Modify: `src/lib/site-content.ts` — add `work.detailShotCaption`, `work.detailCloseLabel`.
- Modify: `src/components/work/case-study-meta.tsx` + rewrite `case-study-meta.module.css` — bordered `dt`/`dd` grid, drop global `.slab`/`.pill`/`.text-kicker`.
- Modify: `src/components/work/case-study-intro.tsx` + rewrite `case-study-intro.module.css` — single column, eyebrow = `client`, big `h1`, impact; drop the cover column, the `number` prop, and global `heading-display`/`text-kicker`.
- Modify: `src/components/work/case-study-cover.tsx` + rewrite `case-study-cover.module.css` — wide `.dshot` bottom slot (stark hatched placeholder + mono caption).
- Modify: `src/components/work/case-study-article.tsx` + `case-study-article.module.css` — drop the `number` prop, reposition the cover to *after* the body, restyle `.article` measure + `.body` prose to the prototype's `.dbody`.
- Modify: `src/components/work/case-study-next.tsx` (no change) + `case-study-next.module.css` — `--sub`→`--mute`.
- Modify: `src/app/work/[slug]/page.tsx` — drop `number` threading, center the article, keep the back link.
- Create: `src/components/work/case-study-tokens.test.ts` — regression guard: no dead tokens in the case-study module CSS.
- Test: `src/components/work/case-study-intro.test.tsx`, `case-study-meta.test.tsx`.

**Part 2 — the intercepting-route modal:**
- Modify: `src/app/layout.tsx` — accept and render the `modal` parallel-route slot.
- Create: `src/app/@modal/default.tsx` — returns `null`.
- Create: `src/app/@modal/(.)work/[slug]/page.tsx` — the interceptor; wraps the article in `CaseStudyModal`.
- Create: `src/components/work/case-study-modal.tsx` (client) + `case-study-modal.module.css` — the slide-up sheet.
- Test: `src/components/work/case-study-modal.test.tsx`.

---

## Task 1: Detail content strings

**Files:**
- Modify: `src/lib/site-content.ts` (the `work` block)

**Interfaces:**
- Produces: `siteContent.work.detailShotCaption: string` and `siteContent.work.detailCloseLabel: string`, consumed by `CaseStudyCover` (Task 4) and `CaseStudyModal` (Task 8).

- [ ] **Step 1: Read the current `work` block** in `src/lib/site-content.ts` to find the exact object and existing keys (`viewLabel`, `shotPending`, `nextLabel`, `metaLabels`, `earlierTitle`, etc.). Match the surrounding style and comma/quote conventions.

- [ ] **Step 2: Add the two keys** to the `work` object. Place them near `shotPending`. Use straight apostrophes (codebase convention). Values:

```ts
    // The detail surface's wide image slot caption (spec §10, the prototype's
    // ".dshot" — "selected screens / artifacts").
    detailShotCaption: "Selected screens / artifacts",
    // The modal's close pill. The "✕" is decoration, added in CSS, so the
    // accessible name stays the plain word (spec §15).
    detailCloseLabel: "Close",
```

- [ ] **Step 3: Typecheck.** Run: `pnpm build`
  Expected: PASS (no type error; the keys are picked up by `siteContent`'s inferred type).

- [ ] **Step 4: Commit**

```bash
git add src/lib/site-content.ts
git commit -m "feat(work): add detail-surface content strings (§10)"
# + trailers
```

---

## Task 2: CaseStudyMeta → bordered dt/dd attribute grid

Reshape the attributes from parked pills-in-a-slab to the prototype's bordered `dl` (§10), styled entirely in the module with stark tokens — no global `.slab`/`.pill`/`.text-kicker`.

**Files:**
- Modify: `src/components/work/case-study-meta.tsx`
- Rewrite: `src/components/work/case-study-meta.module.css`
- Create: `src/components/work/case-study-meta.test.tsx`

**Interfaces:**
- Consumes: `CaseStudy` (frontmatter fields `client, sector[], discipline[], platform[], role, timeframe, view`), `siteContent.work.metaLabels`, `isViewUrl` from `@/components/work/url-label`.
- Produces: `<CaseStudyMeta study={study} />` — a `<dl>` with one `<div>` per attribute, each `<dt>` label + `<dd>` value; the "View" value is an external `<a>` when `isViewUrl(study.view)`.

- [ ] **Step 1: Write the failing test** at `src/components/work/case-study-meta.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { CaseStudyMeta } from "@/components/work/case-study-meta";

const study = (over: Partial<CaseStudy> = {}) =>
  ({
    title: "Alpha",
    client: "Acme",
    role: "Lead",
    sector: ["Music"],
    discipline: ["Product Design"],
    platform: ["Web"],
    timeframe: "2024",
    view: "https://example.com",
    ...over,
  }) as unknown as CaseStudy;

/* No global afterEach is registered (vitest.config.ts has no test.globals),
   so Testing Library never auto-cleans — every render-based test in this repo
   does this explicitly. */
afterEach(cleanup);

describe("CaseStudyMeta", () => {
  it("renders a term/description pair for every attribute", () => {
    const { container } = render(<CaseStudyMeta study={study()} />);
    const terms = container.querySelectorAll("dl dt");
    const values = container.querySelectorAll("dl dd");
    expect(terms.length).toBe(7);
    expect(values.length).toBe(7);
    expect(screen.getByText("Acme")).toBeTruthy();
  });

  it("makes the View value a link when it is a URL", () => {
    const { container } = render(<CaseStudyMeta study={study()} />);
    const link = container.querySelector("dd a");
    expect(link?.getAttribute("href")).toBe("https://example.com");
  });

  it("renders the View value as plain text when it is not a URL", () => {
    const { container } = render(<CaseStudyMeta study={study({ view: "Archived" })} />);
    expect(container.querySelector("dd a")).toBeNull();
    expect(screen.getByText("Archived")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails** against the current component (which uses global `.slab`/`.pill`). Run: `pnpm test src/components/work/case-study-meta.test.tsx`
  Expected: likely PASS for structure but this locks behavior before the CSS/class rewrite. If the current component already satisfies the assertions, that is fine — proceed; the change is stylistic and the test guards it.

- [ ] **Step 3: Edit `case-study-meta.tsx`** — replace the global classes with module classes. Keep the `rows` array and label logic exactly as-is. The container/rows/label/value/link become module classes:

```tsx
  return (
    <dl className={styles.meta} data-case-study-panel="meta">
      {rows.map(({ key, label, value }) => (
        <div key={key} className={styles.row}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
```

Where a row's `value` is the View link, keep the existing `isViewUrl` branch but point its `className` at `styles.link` (it currently uses `styles.link` already — verify and keep). Remove every `"slab"`, `"pill"`, `"text-kicker"`, `"text-xs"` string from this file.

- [ ] **Step 4: Rewrite `case-study-meta.module.css`** entirely:

```css
/* The attribute grid (spec §10): a bordered dt/dd table — the prototype's
   `.dattr` — not the parked Cold Noon pills-in-a-slab, whose `.slab`/`.pill`
   carried removed tokens. Stark tokens throughout. */
.meta {
  margin-top: 6vh;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 22px 30px;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  padding: 28px 0;
}

.label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
}

.value {
  margin-top: 6px;
  font-size: 0.98rem;
  line-height: 1.4;
  color: var(--ink);
}

/* The "View the work" value is an external link when `view` is a URL. */
.link {
  color: var(--work);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.3s ease;
}

.link:hover {
  border-color: var(--work);
}
```

- [ ] **Step 5: Run the test and typecheck.** Run: `pnpm test src/components/work/case-study-meta.test.tsx`
  Expected: 3 passed. Then `pnpm lint` clean (no unused imports left in the tsx).

- [ ] **Step 6: Commit**

```bash
git add src/components/work/case-study-meta.tsx src/components/work/case-study-meta.module.css src/components/work/case-study-meta.test.tsx
git commit -m "feat(work): case-study attributes as a stark dt/dd grid (§10)"
# + trailers
```

---

## Task 3: CaseStudyIntro → single-column, client eyebrow, big title

Reshape the intro to the prototype's single column: eyebrow = `client` (not the study number), large `h1`, impact lead, then the attribute grid. Drop the cover column (Task 4 moves the image to a bottom slot), the `number` prop, and the global `heading-display`/`text-kicker` classes.

**Files:**
- Modify: `src/components/work/case-study-intro.tsx`
- Rewrite: `src/components/work/case-study-intro.module.css`
- Create: `src/components/work/case-study-intro.test.tsx`

**Interfaces:**
- Consumes: `CaseStudy` (`client`, `title`, `impact`), `HeadingLevel` + `HEADING_TAGS` from `@/components/work/heading-tags`, `CaseStudyMeta`.
- Produces: `<CaseStudyIntro study={study} headingLevel={1} />` — **no `number` prop** (this is the interface change consumed by Task 5). Renders eyebrow (`client`), `TitleTag` (the title), impact `<p>`, `<CaseStudyMeta>`. No cover.

- [ ] **Step 1: Write the failing test** at `src/components/work/case-study-intro.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { CaseStudy } from "#site/content";
import { CaseStudyIntro } from "@/components/work/case-study-intro";

const study = () =>
  ({
    title: "Alpha Study",
    client: "Acme Corp",
    role: "Lead",
    sector: ["Music"],
    discipline: ["Product Design"],
    platform: ["Web"],
    timeframe: "2024",
    view: "Archived",
    impact: "Shipped the thing.",
  }) as unknown as CaseStudy;

afterEach(cleanup);

describe("CaseStudyIntro", () => {
  it("uses the client as the eyebrow, not a number", () => {
    render(<CaseStudyIntro study={study()} headingLevel={1} />);
    expect(screen.getByText("Acme Corp")).toBeTruthy();
    // The parked design led with a two-digit study number; the detail eyebrow
    // is the client now (spec §10).
    expect(screen.queryByText("01")).toBeNull();
  });

  it("renders the title at the requested heading level", () => {
    render(<CaseStudyIntro study={study()} headingLevel={1} />);
    const h1 = screen.getByRole("heading", { level: 1, name: "Alpha Study" });
    expect(h1).toBeTruthy();
  });

  it("renders the impact lead", () => {
    render(<CaseStudyIntro study={study()} headingLevel={1} />);
    expect(screen.getByText("Shipped the thing.")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails.** Run: `pnpm test src/components/work/case-study-intro.test.tsx`
  Expected: FAIL — the current intro renders the number as the eyebrow and takes a `number` prop.

- [ ] **Step 3: Rewrite `case-study-intro.tsx`.** Remove the `number` prop, the `formatStudyNumber` import, the `CaseStudyCover` import, and the `variant` prop (the single column has no proportions to switch). New body:

```tsx
import type { CaseStudy } from "#site/content";
import { CaseStudyMeta } from "@/components/work/case-study-meta";
import { HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import styles from "@/components/work/case-study-intro.module.css";

/**
 * The head of a case study (spec §10): a single column — eyebrow (the client),
 * the title, the impact lead, then the attribute grid. The prototype's detail
 * view, not the parked two-column intro-with-cover; the image now sits in a wide
 * slot at the foot of the article (CaseStudyCover), where the prototype's
 * `.dshot` is.
 *
 * `headingLevel` sets only the title *tag* — h1 when the study is a page or
 * modal's subject — never the markup or content.
 */
export function CaseStudyIntro({
  study,
  headingLevel = 3,
}: {
  study: CaseStudy;
  headingLevel?: HeadingLevel;
}) {
  const TitleTag = HEADING_TAGS[headingLevel];

  return (
    <div className={styles.intro} data-case-study-panel="intro">
      <span className={styles.eyebrow}>{study.client}</span>
      <TitleTag className={styles.title}>{study.title}</TitleTag>
      <p className={styles.impact}>{study.impact}</p>
      <CaseStudyMeta study={study} />
    </div>
  );
}
```

- [ ] **Step 4: Rewrite `case-study-intro.module.css`** entirely:

```css
/* The case-study head (spec §10), stark tokens. Single column — the prototype's
   `.dwrap` head — replacing the parked two-column grid that styled its eyebrow
   and impact against removed `--sub` and its title against `--text-glow`. */
.intro {
  display: block;
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--work);
}

.title {
  margin-top: 14px;
  font-size: clamp(2.4rem, 5.5vw, 5rem);
  font-variation-settings: "wght" 700;
  letter-spacing: -0.02em;
  line-height: 1.02;
  color: var(--ink);
}

.impact {
  margin-top: 22px;
  max-width: 46ch;
  font-size: clamp(1.2rem, 1.8vw, 1.55rem);
  line-height: 1.4;
  color: var(--ink);
}
```

- [ ] **Step 5: Run the test.** Run: `pnpm test src/components/work/case-study-intro.test.tsx`
  Expected: 3 passed. (`pnpm lint` will still flag the now-broken caller in `case-study-article.tsx` — that is Task 4/5. Do NOT fix it here beyond what compiles; the article still passes `number`, which is now an unknown prop. TypeScript will error at build. That is expected and Task 4 resolves it. If the reviewer needs a green build at each task boundary, fold Task 4 into this commit — see note.)

> **Task-boundary note for the controller:** Tasks 3 and 4 both edit `case-study-article.tsx` and together remove the `number` prop end-to-end. Removing it from `CaseStudyIntro` (Task 3) leaves `CaseStudyArticle` passing an unknown prop until Task 4. If your process requires `pnpm build` green at every commit, run Tasks 3 and 4 as a single dispatch and one commit. Otherwise, commit Task 3 with the test passing and let Task 4 restore the build.

- [ ] **Step 6: Commit** (if committing separately)

```bash
git add src/components/work/case-study-intro.tsx src/components/work/case-study-intro.module.css src/components/work/case-study-intro.test.tsx
git commit -m "feat(work): single-column case-study head, client eyebrow (§10)"
# + trailers
```

---

## Task 4: CaseStudyCover → wide bottom image slot, and article body restyle

Turn the cover from a 4:3 gradient card (dead sky tokens) into the prototype's wide `.dshot` slot, move it to *after* the prose body in the article, drop the `number` prop from the article, and restyle `.article` (the reading measure) and `.body` (the prose) to the prototype's `.dbody` on stark tokens.

**Files:**
- Rewrite: `src/components/work/case-study-cover.tsx`
- Rewrite: `src/components/work/case-study-cover.module.css`
- Modify: `src/components/work/case-study-article.tsx`
- Rewrite: `src/components/work/case-study-article.module.css`

**Interfaces:**
- Consumes: `CaseStudy` (`cover?`, `title`), `siteContent.work.detailShotCaption` (Task 1).
- Produces: `<CaseStudyCover study={study} />` — a wide slot; renders `study.cover` as an `<img>` when present, else a mono caption over a hatched placeholder. `<CaseStudyArticle study next headingLevel>` — **`number` prop removed** (consumed by Task 5).

- [ ] **Step 1: Rewrite `case-study-cover.tsx`:**

```tsx
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-cover.module.css";

/**
 * The case study's wide image slot (spec §10, the prototype's `.dshot`): a full-
 * width band at the foot of the article. Hatched placeholder + a mono caption
 * until `cover` is set in frontmatter, at which point a real screen drops in with
 * no code change — the same treatment the gallery card's shot uses.
 */
export function CaseStudyCover({ study }: { study: CaseStudy }) {
  return (
    <div className={styles.shot} data-case-study-panel="cover">
      {study.cover ? (
        <img src={study.cover} alt={study.title} className={styles.cover} />
      ) : (
        <span className={styles.caption}>{siteContent.work.detailShotCaption}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `case-study-cover.module.css`:**

```css
/* The detail image slot (spec §10, prototype `.dshot`): a wide band, hatched in
   stark grays until a real cover lands. Replaces the parked 4:3 card, which drew
   on removed `--card-border`, `--elev`, and the Cold Noon `--sky-*` gradient. */
.shot {
  position: relative;
  margin-top: 6vh;
  height: 46vh;
  border: 1px solid var(--hairline);
  background-image: repeating-linear-gradient(
    135deg,
    var(--row-hover) 0 12px,
    var(--canvas) 12px 24px
  );
  display: flex;
  align-items: flex-end;
  padding: 18px;
  overflow: hidden;
}

.caption {
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

- [ ] **Step 3: Edit `case-study-article.tsx`** — remove `number` from the props and the `CaseStudyIntro` call, import `CaseStudyCover`, and render it after the body, before `CaseStudyNext`:

```tsx
import type { CaseStudy } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyIntro } from "@/components/work/case-study-intro";
import { CaseStudyCover } from "@/components/work/case-study-cover";
import { CaseStudyNext } from "@/components/work/case-study-next";
import { BODY_HEADING_LEVEL, HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import styles from "@/components/work/case-study-article.module.css";

/**
 * One case study as a vertical document (spec §10) — the whole body, in order.
 * Rendered by both surfaces: `/work/[slug]` (canonical share / SEO / long read)
 * and the slide-up modal (the intercepting route). One definition of what a case
 * study is; the surfaces differ only in their chrome.
 *
 * `headingLevel` adapts only the heading *tag* — h1 when the study is the
 * subject — never the markup, classes, or content. The body's own `##` headings
 * remap one level below the title so the outline stays sane.
 */
export function CaseStudyArticle({
  study,
  headingLevel = 3,
  next,
}: {
  study: CaseStudy;
  headingLevel?: HeadingLevel;
  next?: { title: string; url: string };
}) {
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];

  return (
    <article className={styles.article} id={study.slug} data-case-study={study.slug}>
      <CaseStudyIntro study={study} headingLevel={headingLevel} />

      <div className={styles.body} data-case-study-panel="body">
        <MDXContent code={study.body} components={{ h2: BodyHeadingTag }} />
      </div>

      <CaseStudyCover study={study} />

      {next && <CaseStudyNext title={next.title} url={next.url} />}
    </article>
  );
}
```

- [ ] **Step 4: Rewrite `case-study-article.module.css`:**

```css
/* The case study as a centered reading column (spec §10, prototype `.dwrap`).
   `--card-border` (border-top) and `--text-glow` (heading shadow) were removed
   with the Cold Noon palette; the prose is restyled to the prototype's `.dbody`
   on stark tokens. */
.article {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 10vh 6vw 16vh;
}

.body {
  margin-top: 7vh;
  max-width: 62ch;
}

/* The MDX `##` headings compile to a tag one level below the title (see
   CaseStudyArticle) and are wrapped in autolink anchors (rehypeAutolinkHeadings).
   Style them as the prototype's section labels: mono, uppercase, accent. */
.body :where(h2, h3, h4, h5, h6) {
  margin: 5vh 0 14px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--work);
}

.body :where(h2, h3, h4, h5, h6) a {
  color: inherit;
  text-decoration: none;
}

.body :where(p, li) {
  font-size: clamp(1.05rem, 1.5vw, 1.28rem);
  line-height: 1.6;
  color: var(--ink);
}

.body :where(p) {
  margin-top: 14px;
}

.body :where(ul, ol) {
  margin: 14px 0 14px 1.2em;
}

.body :where(a) {
  color: var(--work);
  text-underline-offset: 3px;
}
```

- [ ] **Step 5: Build + full test.** Run: `pnpm build && pnpm test`
  Expected: build clean (the `number` prop is now gone end-to-end except `page.tsx`, which Task 5 fixes — **if building before Task 5, the page still passes `number` and build fails at `page.tsx`; run Task 5 in the same dispatch, or temporarily remove the `number={...}` line in `page.tsx` now and complete its restyle in Task 5**). Tests: all green.

> **Controller note:** Tasks 4 and 5 both must land for a green build (the `number` removal spans the article and the page). Prefer dispatching Tasks 3–5 together, or ensure `page.tsx` stops passing `number` within this task.

- [ ] **Step 6: Commit** (with Task 5, or standalone if `page.tsx` is already updated)

```bash
git add src/components/work/case-study-cover.tsx src/components/work/case-study-cover.module.css src/components/work/case-study-article.tsx src/components/work/case-study-article.module.css
git commit -m "feat(work): wide detail image slot + stark prose body (§10)"
# + trailers
```

---

## Task 5: Restyle `/work/[slug]`, and the `--sub` remnant in Next

Center the article on the full page, drop the `number` threading, and fix the last dead token on this surface (`case-study-next.module.css` `--sub`).

**Files:**
- Modify: `src/app/work/[slug]/page.tsx`
- Modify: `src/components/work/case-study-next.module.css`

**Interfaces:**
- Consumes: `CaseStudyArticle` (Task 4 signature — no `number`), `siteContent.labels.allWork`.

- [ ] **Step 1: Edit `page.tsx`** — remove the `studyNumber` import and call, remove the `number` prop, and wrap the back link in a centered bar that matches the article's measure. Body of the returned JSX:

```tsx
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Straight to the section, not via the /work redirect: a client-side
            <Link> to "/work" drops the fragment the redirect adds, landing the
            visitor at the top of the home page instead of #work. */}
        <div className="mx-auto w-full max-w-[1000px] px-[6vw] pt-24">
          <Link href="/#work" className="font-mono text-sm text-mute transition-colors hover:text-ink">
            {siteContent.labels.allWork}
          </Link>
        </div>

        <CaseStudyArticle
          study={study}
          headingLevel={1}
          next={next ? { title: next.title, url: next.url } : undefined}
        />
      </main>
    </>
  );
```

Remove the now-unused `studyNumber` import (keep `nextStudy`).

- [ ] **Step 2: Fix `case-study-next.module.css`** — swap the one dead token:

```css
.next {
  margin-top: 8vh;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  color: var(--mute);
}
```

(Keep the existing `.next a` / `.next a::after` rules; ensure they use `--ink`/`--work`, not dead tokens.)

- [ ] **Step 3: Build, test, lint.** Run: `pnpm build && pnpm test && pnpm lint`
  Expected: all clean. No `studyNumber` / `number` references remain on the detail surface.

- [ ] **Step 4: Browser-verify `/work/[slug]` in BOTH themes.** Start/confirm a fresh dev server (postdating these edits). Load `http://localhost:3000/work/collaya` (a published slug). Confirm: client eyebrow, big title, impact, bordered dt/dd grid, uppercase mono section headings, readable prose, the wide image slot, the "Next" teaser, and the back link — all on stark canvas, legible in light and dark. Tune the `.article` top padding / back-link `pt-24` if the title crowds the header. **Look at the pixels; do not infer from the DOM.**

- [ ] **Step 5: Commit**

```bash
git add "src/app/work/[slug]/page.tsx" src/components/work/case-study-next.module.css
git commit -m "feat(work): stark /work/[slug] page — centered article, back link (§10)"
# + trailers
```

---

## Task 6: Dead-token regression guard for the detail surface

A cheap unit test that fails the build if a Cold Noon token ever returns to the case-study module CSS — the same discipline `globals.css.test.ts` applies to the palettes.

**Files:**
- Create: `src/components/work/case-study-tokens.test.ts`

- [ ] **Step 1: Write the test:**

```ts
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
```

- [ ] **Step 2: Run it.** Run: `pnpm test src/components/work/case-study-tokens.test.ts`
  Expected: 5 passed (all files clean after Tasks 2–5). If any fails, a dead token slipped through — fix that CSS file, do not weaken the test.

- [ ] **Step 3: Commit**

```bash
git add src/components/work/case-study-tokens.test.ts
git commit -m "test(work): guard the detail surface against dead Cold Noon tokens"
# + trailers
```

---

## Task 7: Scaffold the parallel + intercepting routes

Wire the `@modal` slot into the root layout, add its `default.tsx`, and add the interceptor page rendering the article directly (no shell yet) so the routing is provable before the animation goes on top.

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/@modal/default.tsx`
- Create: `src/app/@modal/(.)work/[slug]/page.tsx`

**Interfaces:**
- Produces: a `modal` slot rendered in the root layout; a `(.)work/[slug]` interceptor that soft-nav renders over the home page while a hard load falls through to `/work/[slug]`.

- [ ] **Step 1: Add `src/app/@modal/default.tsx`:**

```tsx
/* The @modal slot renders nothing when no case study is intercepted. Next 16
   requires an explicit default for every parallel-route slot or the build
   fails; null is the "closed" state (Next docs, Parallel Routes → Modals). */
export default function Default() {
  return null;
}
```

- [ ] **Step 2: Wire the slot into `src/app/layout.tsx`.** Accept `modal` alongside `children` and render it after `SmoothScroll` (a top-level fixed overlay lives outside the smooth-scroll wrapper; `getLenis()` is a module singleton, so the modal reaches Lenis regardless of tree position):

```tsx
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
```

and in the `<body>`:

```tsx
      <body className="min-h-full flex flex-col">
        <FontsReady />
        <SmoothScroll>{children}</SmoothScroll>
        {modal}
      </body>
```

- [ ] **Step 3: Add the interceptor** `src/app/@modal/(.)work/[slug]/page.tsx` — for now render the article inside a plain wrapper (the shell arrives in Task 8), so routing is verifiable in isolation:

```tsx
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/work/case-study-article";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";

/**
 * Intercepts a client-side navigation to /work/[slug] from the one-pager and
 * renders the study over it (spec §10). `(.)` is the same-level matcher: the
 * @modal slot is not a path segment, so /work/[slug] sits one level up from it,
 * which is level-adjacent — the canonical Next "photo modal" shape. A hard load
 * or refresh is not intercepted and falls through to /work/[slug].
 */
export default async function InterceptedCaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = publishedWork.find((s) => s.slug === slug);
  if (!study) notFound();

  const next = nextStudy(publishedWork, slug);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, overflowY: "auto", background: "var(--canvas)" }}>
      <CaseStudyArticle
        study={study}
        headingLevel={1}
        next={next ? { title: next.title, url: next.url } : undefined}
      />
    </div>
  );
}
```

- [ ] **Step 4: Build.** Run: `pnpm build`
  Expected: PASS. **If the build errors that the root/`children` slot needs a default** (a Next 16 parallel-routes requirement), add `src/app/default.tsx`:
  ```tsx
  /* Fallback for the children slot when it cannot be matched. In this app the
     children slot always matches a real page (page.tsx for /, work/[slug] for
     /work/*), so this renders only to satisfy Next 16's "every slot needs a
     default" rule. */
  export default function Default() {
    return null;
  }
  ```
  Re-run `pnpm build` until clean. Record in the commit which defaults were needed.

- [ ] **Step 5: Browser-verify the routing (no animation yet).** Fresh dev server. From `http://localhost:3000/`, scroll to #work and click a gallery card (or an index row). Confirm: the URL becomes `/work/<slug>`, the study renders as a fixed overlay over the (still-mounted, frozen behind it) home page, and the **browser back button** returns to `/` with the home page intact. Then hard-load `http://localhost:3000/work/collaya` directly and confirm the full `/work/[slug]` page renders (SiteHeader + back link + article), NOT the overlay. Confirm `curl -s http://localhost:3000/work/collaya | grep -c site-header` shows the served full page, not an empty modal.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx "src/app/@modal/default.tsx" "src/app/@modal/(.)work/[slug]/page.tsx"
# include src/app/default.tsx if Step 4 required it
git commit -m "feat(work): intercepting @modal route for case studies (§10)"
# + trailers
```

---

## Task 8: The CaseStudyModal shell — slide-up, Lenis lock, Escape/back

The client shell: an opaque canvas sheet that slides up on mount, locks Lenis while open, scrolls internally, and closes (slide-down → `router.back()`) on the close pill, Escape, or back button. Reduced motion closes immediately with no slide.

**Files:**
- Create: `src/components/work/case-study-modal.tsx`
- Create: `src/components/work/case-study-modal.module.css`
- Create: `src/components/work/case-study-modal.test.tsx`
- Modify: `src/app/@modal/(.)work/[slug]/page.tsx` (swap the plain wrapper for the shell)

**Interfaces:**
- Consumes: `useRouter` (`next/navigation`), `getLenis` (`@/components/smooth-scroll`), `useReducedMotionPref` (`@/lib/use-reduced-motion`), `siteContent.work.detailCloseLabel`.
- Produces: `<CaseStudyModal label={study.title}>{article}</CaseStudyModal>`.

- [ ] **Step 1: Write the failing test** at `src/components/work/case-study-modal.test.tsx`. Mock the router, Lenis, and the reduced-motion hook:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ back }) }));

const stop = vi.fn();
const start = vi.fn();
vi.mock("@/components/smooth-scroll", () => ({ getLenis: () => ({ stop, start }) }));

let reduced = false;
vi.mock("@/lib/use-reduced-motion", () => ({ useReducedMotionPref: () => reduced }));

const { CaseStudyModal } = await import("@/components/work/case-study-modal");

afterEach(() => {
  cleanup();
  back.mockClear();
  stop.mockClear();
  start.mockClear();
  reduced = false;
});

describe("CaseStudyModal", () => {
  it("locks Lenis on open and releases it on close/unmount", () => {
    const { unmount } = render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    expect(stop).toHaveBeenCalledOnce();
    unmount();
    expect(start).toHaveBeenCalledOnce();
  });

  it("is a labeled modal dialog", () => {
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Alpha");
  });

  it("navigates back after the close slide finishes", () => {
    const { container } = render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.click(screen.getByRole("button"));
    // The slide-down runs first; back() waits for the transform transition end.
    expect(back).not.toHaveBeenCalled();
    const sheet = container.querySelector('[role="dialog"]') as HTMLElement;
    fireEvent.transitionEnd(sheet, { propertyName: "transform" });
    expect(back).toHaveBeenCalledOnce();
  });

  it("closes immediately under reduced motion (no slide to wait on)", () => {
    reduced = true;
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.click(screen.getByRole("button"));
    expect(back).toHaveBeenCalledOnce();
  });

  it("closes on Escape", () => {
    reduced = true; // immediate path keeps the assertion synchronous
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(back).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails.** Run: `pnpm test src/components/work/case-study-modal.test.tsx`
  Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write `case-study-modal.tsx`:**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, TransitionEvent } from "react";
import { useRouter } from "next/navigation";
import { getLenis } from "@/components/smooth-scroll";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-modal.module.css";

/**
 * The slide-up case-study sheet (spec §10): an opaque canvas sheet that covers
 * the one-pager, slides `translateY(100%→0)`, and closes on the pill, Escape, or
 * the back button. The URL is the source of truth — closing is `router.back()`,
 * which pops the intercepted entry and restores the page and its scroll beneath.
 *
 * Lenis is stopped while open so the frozen page cannot scroll behind the sheet;
 * `data-lenis-prevent` lets the sheet itself scroll natively past the stopped
 * instance (CLAUDE.md: one ticker, no second RAF loop). Under reduced motion the
 * sheet does not slide (CSS drops the transition) and closing navigates at once.
 */
export function CaseStudyModal({ label, children }: { label: string; children: ReactNode }) {
  const router = useRouter();
  const reduced = useReducedMotionPref();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  /* Slide up on mount, and lock the page behind it. The rAF lets the initial
     translateY(100%) paint before flipping to 0 so the transition actually runs
     (setting both in one paint would show no animation). */
  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => {
      cancelAnimationFrame(raf);
      lenis?.start();
    };
  }, []);

  /* Close: slide down, then pop history when the transform settles. Reduced
     motion has no slide to wait on, so it navigates straight away. */
  const close = () => {
    if (reduced) {
      router.back();
      return;
    }
    setOpen(false);
  };

  const onTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target === sheetRef.current && event.propertyName === "transform" && !open) {
      router.back();
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `close` reads `reduced`; re-bind when it changes so the branch is current.
  }, [reduced]);

  return (
    <div
      ref={sheetRef}
      className={styles.sheet}
      data-open={open}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onTransitionEnd={onTransitionEnd}
    >
      <button type="button" className={styles.close} onClick={close}>
        {siteContent.work.detailCloseLabel}
      </button>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Write `case-study-modal.module.css`:**

```css
/* The slide-up sheet (spec §10, prototype `#detail`). Opaque canvas — it covers
   the page, no scrim. `data-lenis-prevent` (on the JSX) lets it scroll while
   Lenis is stopped; overscroll-behavior stops any chain to the frozen page. */
.sheet {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: var(--canvas);
  transform: translateY(100%);
  transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sheet[data-open="true"] {
  transform: translateY(0);
}

/* Pill close, top-right. Fixed inside the transformed sheet resolves against the
   sheet's box (a transform is a containing block for fixed descendants), so it
   slides in with the sheet and then holds while the content scrolls. */
.close {
  position: fixed;
  top: 24px;
  right: 6vw;
  z-index: 95;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 9px 18px;
  cursor: pointer;
  transition:
    color 0.3s ease,
    border-color 0.3s ease;
}

/* The ✕ is decoration, not the accessible name (spec §15) — the label stays the
   plain word. */
.close::after {
  content: " ✕";
}

.close:hover {
  color: var(--work);
  border-color: var(--work);
}

/* Reduced motion (spec §11): no slide. The sheet is simply present when open. */
@media (prefers-reduced-motion: reduce) {
  .sheet {
    transition: none;
  }
}
```

- [ ] **Step 5: Swap the shell into the interceptor** `src/app/@modal/(.)work/[slug]/page.tsx` — replace the plain fixed `<div>` from Task 7:

```tsx
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/work/case-study-article";
import { CaseStudyModal } from "@/components/work/case-study-modal";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";

export default async function InterceptedCaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = publishedWork.find((s) => s.slug === slug);
  if (!study) notFound();

  const next = nextStudy(publishedWork, slug);

  return (
    <CaseStudyModal label={study.title}>
      <CaseStudyArticle
        study={study}
        headingLevel={1}
        next={next ? { title: next.title, url: next.url } : undefined}
      />
    </CaseStudyModal>
  );
}
```

- [ ] **Step 6: Run the test, then build.** Run: `pnpm test src/components/work/case-study-modal.test.tsx` (expect 5 passed), then `pnpm build && pnpm lint` (clean).

- [ ] **Step 7: Commit**

```bash
git add src/components/work/case-study-modal.tsx src/components/work/case-study-modal.module.css src/components/work/case-study-modal.test.tsx "src/app/@modal/(.)work/[slug]/page.tsx"
git commit -m "feat(work): slide-up case-study modal shell — Lenis lock, Escape/back (§10)"
# + trailers
```

---

## Task 9: Full browser verification, both themes + reduced motion

The mechanism tests pass; §10 is a motion/scroll feature, so it is not done until the pixels are. This task is verification and tuning only — no new component code unless a defect surfaces.

**Files:**
- Possibly small tunes to `case-study-modal.module.css` / `case-study-article.module.css` if verification finds spacing or lock defects.

- [ ] **Step 1: Fresh dev server.** Kill any stale `next dev`, start `pnpm dev`, confirm it is ready and postdates the commits (CLAUDE.md — stale servers have produced false results here twice).

- [ ] **Step 2: Open flow (light + dark).** From `/`, scroll into #work; open a study from a **gallery card** and (separately) from an **index row**. Confirm: the sheet slides up from the bottom over ~0.6s on the overlay curve, lands opaque over the frozen page, the close pill sits top-right, and the content is the stark detail (client eyebrow, big title, impact, dt/dd grid, mono section headings, prose, wide image slot, Next teaser). Repeat with the theme toggled to dark.

- [ ] **Step 3: Scroll lock.** With the sheet open, wheel/trackpad over the sheet: the sheet scrolls, the page behind does **not** move. Wheel over any exposed area: still no background movement. Reachability, not `element.click()` — confirm the pixels.

- [ ] **Step 4: Close paths.** Verify all three close the sheet with the slide-down and restore `/` at the prior scroll position: (a) the close pill, (b) Escape, (c) the browser back button. Then confirm the "Next" teaser inside the sheet navigates to the next study **within** the modal (the interceptor re-fires).

- [ ] **Step 5: Deep link / refresh / share.** Hard-load `/work/collaya`, refresh it, and confirm the full `/work/[slug]` page renders (not the modal), styled stark in both themes. `curl -s http://localhost:3000/work/collaya | grep -c 'site-header'` ≥ 1 (served full page).

- [ ] **Step 6: Reduced motion.** In the browser's emulation (or OS setting), enable `prefers-reduced-motion: reduce`. Open a study: it appears with no slide; close: it dismisses immediately. No stuck/half-open state.

- [ ] **Step 7: Regression sweep.** `pnpm build && pnpm test && pnpm lint` — all green. Confirm the gallery/index toggle (Phase 4) and Contact (Phase 5) still behave.

- [ ] **Step 8: Commit any tunes** (only if Steps 2–6 required CSS adjustments)

```bash
git add <only the files you tuned>
git commit -m "fix(work): tune detail modal spacing/lock after browser pass (§10)"
# + trailers
```

---

## Self-review notes (checked against §10 before hand-off)

- **§10 content — eyebrow (client), h1, impact, dt/dd grid, labeled prose, `.dshot` slot:** Tasks 3 (eyebrow=client, h1, impact), 2 (dt/dd grid), 4 (prose `.dbody` + `.dshot`). ✅
- **§10 intercepting + parallel routes, slide `translateY(100%→0)` 0.6s cubic-bezier(.2,.8,.2,1), pill close top-right, Escape:** Tasks 7 (routes), 8 (shell + CSS). ✅
- **§10 scroll lock the prototype lacks — stop Lenis on open, resume on close:** Task 8 (`getLenis().stop()/start()` + `data-lenis-prevent`), verified Task 9 Step 3. ✅
- **§10 URL is source of truth; back button + SEO:** `router.back()` close, `/work/[slug]` full page kept for hard load/SEO (`generateStaticParams` + `generateMetadata` untouched). Verified Task 9 Steps 4–5. ✅
- **§10 fallback if intercepting routes fight Lenis:** de-risked — `data-lenis-prevent` (Lenis 1.3.25 supports it) + `stop()`; if Task 9 exposes an unresolvable conflict, drop `@modal` and let cards navigate to `/work/[slug]` plainly (the article is already stark from Part 1, so the page stands alone). No task depends on the slide for correctness.
- **§11 reduced motion first-class:** Task 8 (no slide, immediate close) + Task 9 Step 6. ✅
- **§14 content not in JSX:** Task 1 (`detailShotCaption`, `detailCloseLabel`); labels via `siteContent.work.metaLabels`, `labels.allWork`. ✅
- **Stark tokens / no dead tokens:** Tasks 2–5 swap every dead token; Task 6 guards it. The now-unused global classes `.slab`/`.pill`(global)/`.heading-display`/`.text-kicker`/`.on-scrim`/`.scrim-ramp` in `globals.css` still carry dead tokens but are referenced nowhere after Task 2–3 — leaving them is harmless (they emit unused rules). Removing them is **out of scope** here; note for a later cleanup pass to avoid widening this phase's blast radius.
