# Earlier work — openable modals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each "Selected earlier work" item open in the reused `CaseStudyModal` as a lighter mini case study (title, meta, body copy, live link), mirroring the featured `/work/[slug]` + intercepting-modal pattern.

**Architecture:** Add `slug`/`url` to the Velite `earlier` collection; a new `EarlierDetail` component renders an earlier item (used by a standalone `/earlier/[slug]` page and an intercepting `@modal/(.)earlier/[slug]` modal); the earlier-work list links each title to `/earlier/[slug]`; the six earlier bodies are ported from the copy doc.

**Tech Stack:** Next.js 16 App Router (parallel/intercepting routes) · React 19 · TypeScript · CSS Modules · Velite (MDX) · vitest + Testing Library.

## Global Constraints

- **pnpm only.** `pnpm test` is non-watch — never `pnpm test run`. `pnpm test <path>` for one file.
- **No user-facing strings in JSX** (spec §14/§15) — all labels come from `src/lib/site-content.ts`.
- **Tags stay tight** — do NOT change any `sector`/`discipline`/`platform` frontmatter; keep the existing canonical vocabulary. Only bodies change in content files.
- **Never `git add -A`** — stage only the files each task names.
- **Do not touch** `content/work/collaya.mdx` or `next.config.ts`.
- Commit trailers on every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_011b64DrxdY9bE8xYAnAbWM7`
- Run `pnpm build && pnpm test && pnpm lint` green before the final task completes.

## File Structure

```
velite.config.ts                                  MODIFY  add slug/url transform to `earlier`
src/components/work/work-lists.ts                 MODIFY  add generic nextBySlug(); nextStudy delegates to it
src/components/work/work-lists.test.ts            MODIFY  test nextBySlug
src/lib/site-content.ts                           MODIFY  add work.viewLiveLabel
src/components/work/earlier-detail.tsx            CREATE  the earlier item's rendering
src/components/work/earlier-detail.module.css     CREATE
src/components/work/earlier-detail.test.tsx       CREATE
src/app/earlier/[slug]/page.tsx                   CREATE  standalone page
src/app/@modal/(.)earlier/[slug]/page.tsx         CREATE  intercepting modal
src/components/work/earlier-work.tsx              MODIFY  titles link to /earlier/[slug]
src/components/work/earlier-work.test.tsx         MODIFY  assert the internal link
content/earlier/{cinematiq,shift,intuit,yahoo-bubbles,yahoo-developer-network,yahoo-design-pattern-library}.mdx  MODIFY body
```

---

### Task 1: Velite — `slug`/`url` on the `earlier` collection

**Files:**
- Modify: `velite.config.ts`

**Interfaces:**
- Produces: every `EarlierProject` now carries `slug: string` and `url: "/earlier/${slug}"`, exactly like `CaseStudy`. Consumed by Tasks 2, 4, 5.

- [ ] **Step 1: Confirm slug is absent today (the failing state)**

Run: `pnpm exec velite && node -e "console.log('slug' in require('./.velite/earlier.json')[0])"`
Expected: `false`

- [ ] **Step 2: Add the transform**

In `velite.config.ts`, the `earlier` collection currently ends its schema with `s.object({ … })`. Change it to add the same transform the `work` collection uses. Find:

```ts
const earlier = defineCollection({
  name: "EarlierProject",
  pattern: "earlier/**/*.mdx",
  schema: s.object({
    title: s.string().max(120),
    sector: s.array(s.string()).min(1),
    discipline: s.array(s.string()).min(1),
    platform: s.array(s.string()).default([]),
    role: s.string(),
    timeframe: s.string(),
    view: s.string(),
    order: s.number().int(),
    path: s.path(),
    body: s.mdx(),
  }),
});
```

Replace with (wrap the object in `.transform(...)`):

```ts
const earlier = defineCollection({
  name: "EarlierProject",
  pattern: "earlier/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(120),
      sector: s.array(s.string()).min(1),
      discipline: s.array(s.string()).min(1),
      platform: s.array(s.string()).default([]),
      role: s.string(),
      timeframe: s.string(),
      view: s.string(),
      order: s.number().int(),
      path: s.path(),
      body: s.mdx(),
    })
    .transform((data) => {
      const slug = data.path.replace(/^earlier\//, "");
      return { ...data, slug, url: `/earlier/${slug}` };
    }),
});
```

- [ ] **Step 3: Regenerate and verify**

Run: `pnpm exec velite && node -e "const e=require('./.velite/earlier.json'); console.log(e[0].slug, e[0].url)"`
Expected: a slug and url print, e.g. `cinematiq /earlier/cinematiq`

- [ ] **Step 4: Commit**

```bash
git add velite.config.ts
git commit -m "feat(earlier): slug + url on the earlier collection"
```

---

### Task 2: `nextBySlug()` generic helper

**Files:**
- Modify: `src/components/work/work-lists.ts`
- Test: `src/components/work/work-lists.test.ts`

**Interfaces:**
- Produces: `nextBySlug<T extends { slug: string }>(list: readonly T[], slug: string): T | undefined` — the item after `slug`, or `undefined` at the end (NO wrap, matching `nextStudy`). `nextStudy` keeps its signature by delegating. Consumed by Task 4.

- [ ] **Step 1: Write the failing test**

Append to `src/components/work/work-lists.test.ts`:

```ts
import { nextBySlug } from "@/components/work/work-lists";

describe("nextBySlug", () => {
  const list = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];
  it("returns the next entry by slug", () => {
    expect(nextBySlug(list, "a")).toEqual({ slug: "b" });
    expect(nextBySlug(list, "b")).toEqual({ slug: "c" });
  });
  it("returns undefined past the last entry (no wrap)", () => {
    expect(nextBySlug(list, "c")).toBeUndefined();
  });
  it("returns undefined for an unknown slug", () => {
    expect(nextBySlug(list, "z")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/components/work/work-lists.test.ts`
Expected: FAIL — `nextBySlug is not a function` (or import error).

- [ ] **Step 3: Implement**

In `src/components/work/work-lists.ts`, add `nextBySlug` and make `nextStudy` delegate. Replace the existing `nextStudy` definition:

```ts
/** The study immediately after `slug` in `published`, for the "Next: {title}" teaser. */
export function nextStudy(published: readonly CaseStudy[], slug: string): CaseStudy | undefined {
  const index = published.findIndex((study) => study.slug === slug);
  return index === -1 ? undefined : published[index + 1];
}
```

with:

```ts
/** The entry immediately after `slug` in `list`, or undefined at the end (no wrap).
 *  Slug-keyed so it serves both the work and earlier lists. */
export function nextBySlug<T extends { slug: string }>(
  list: readonly T[],
  slug: string,
): T | undefined {
  const index = list.findIndex((item) => item.slug === slug);
  return index === -1 ? undefined : list[index + 1];
}

/** The study immediately after `slug` in `published`, for the "Next: {title}" teaser. */
export function nextStudy(published: readonly CaseStudy[], slug: string): CaseStudy | undefined {
  return nextBySlug(published, slug);
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/components/work/work-lists.test.ts`
Expected: PASS (new `nextBySlug` block + existing `nextStudy` block).

- [ ] **Step 5: Commit**

```bash
git add src/components/work/work-lists.ts src/components/work/work-lists.test.ts
git commit -m "feat(work): generic nextBySlug(); nextStudy delegates to it"
```

---

### Task 3: `EarlierDetail` component + label

**Files:**
- Create: `src/components/work/earlier-detail.tsx`
- Create: `src/components/work/earlier-detail.module.css`
- Create: `src/components/work/earlier-detail.test.tsx`
- Modify: `src/lib/site-content.ts`

**Interfaces:**
- Consumes: `EarlierProject` (with `slug`/`url` from Task 1), `nextBySlug` (Task 2), `MDXContent`, `HEADING_TAGS`/`BODY_HEADING_LEVEL`, `isViewUrl`, `siteContent.work.viewLiveLabel` (added here) + `siteContent.work.nextLabel` (exists).
- Produces: `<EarlierDetail item headingLevel next />`. Consumed by Task 4.

- [ ] **Step 1: Add the label**

In `src/lib/site-content.ts`, inside the `work: { … }` object, next to `viewLabel`, add:

```ts
    /** The earlier-item modal's outbound link to a still-live project. The arrow
     *  beside it is CSS content, not copy. */
    viewLiveLabel: "View live",
```

- [ ] **Step 2: Write the failing test**

Create `src/components/work/earlier-detail.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { EarlierProject } from "#site/content";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { siteContent } from "@/lib/site-content";

afterEach(cleanup);

const item = (over: Partial<EarlierProject> = {}) =>
  ({
    title: "Cinematiq",
    sector: ["Creative Tech"],
    discipline: ["Product Design", "Full-stack Product"],
    platform: [],
    role: "UX, visual, front-end",
    timeframe: "Summer 2015",
    view: "https://cinematiq.com",
    slug: "cinematiq",
    url: "/earlier/cinematiq",
    // Velite compiles MDX to a JS function body; a component that renders nothing
    // is enough for these assertions (the body path is covered by the browser pass).
    body: "const {jsx:_jsx}=arguments[0];return{default:()=>null}",
    ...over,
  }) as unknown as EarlierProject;

describe("EarlierDetail", () => {
  it("renders the title and the primary sector eyebrow", () => {
    render(<EarlierDetail item={item()} />);
    expect(screen.getByRole("heading", { name: "Cinematiq" })).toBeTruthy();
    expect(screen.getByText("Creative Tech")).toBeTruthy();
  });

  it("shows a live link when view is a URL", () => {
    render(<EarlierDetail item={item()} />);
    const link = screen.getByRole("link", { name: new RegExp(siteContent.work.viewLiveLabel) });
    expect(link.getAttribute("href")).toBe("https://cinematiq.com");
  });

  it("shows no live link when view is Archived", () => {
    render(<EarlierDetail item={item({ view: "Archived" })} />);
    expect(screen.queryByRole("link", { name: new RegExp(siteContent.work.viewLiveLabel) })).toBeNull();
  });

  it("uses an h1 title when headingLevel is 1", () => {
    const { container } = render(<EarlierDetail item={item()} headingLevel={1} />);
    expect(container.querySelector("h1")?.textContent).toBe("Cinematiq");
  });
});
```

- [ ] **Step 3: Run it, confirm it fails**

Run: `pnpm test src/components/work/earlier-detail.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement the component**

Create `src/components/work/earlier-detail.tsx`:

```tsx
import type { EarlierProject } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { CaseStudyNext } from "@/components/work/case-study-next";
import { BODY_HEADING_LEVEL, HEADING_TAGS, type HeadingLevel } from "@/components/work/heading-tags";
import { isViewUrl } from "@/components/work/url-label";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/earlier-detail.module.css";

/**
 * One earlier project as a lighter "mini case study" (spec 2026-07-20): eyebrow
 * (primary sector), title, a compact meta line, the body copy, and — only when
 * the project is still live — an outbound link. Rendered by both the standalone
 * `/earlier/[slug]` page and the intercepting modal, exactly as CaseStudyArticle
 * serves both featured surfaces. Earlier items carry none of the featured fields
 * (cover, impact, client), so this reads only what an earlier item has.
 *
 * `headingLevel` sets only the title tag — h1 when the item is the subject.
 */
export function EarlierDetail({
  item,
  headingLevel = 3,
  next,
}: {
  item: EarlierProject;
  headingLevel?: HeadingLevel;
  next?: { title: string; url: string };
}) {
  const TitleTag = HEADING_TAGS[headingLevel];
  const BodyHeadingTag = HEADING_TAGS[BODY_HEADING_LEVEL[headingLevel]];
  const meta = [
    item.role,
    item.timeframe,
    item.discipline.join(", "),
    item.platform.join(", "),
  ].filter(Boolean);

  return (
    <article className={styles.detail} id={item.slug} data-earlier={item.slug}>
      <span className={styles.eyebrow}>{item.sector[0]}</span>
      <TitleTag className={styles.title}>{item.title}</TitleTag>
      <p className={styles.meta}>
        {meta.map((part, i) => (
          <span key={i}>{part}</span>
        ))}
      </p>

      <div className={styles.body}>
        <MDXContent code={item.body} components={{ h2: BodyHeadingTag }} />
      </div>

      {isViewUrl(item.view) && (
        <p className={styles.live}>
          <a href={item.view} target="_blank" rel="noreferrer">
            {siteContent.work.viewLiveLabel}
          </a>
        </p>
      )}

      {next && <CaseStudyNext title={next.title} url={next.url} />}
    </article>
  );
}
```

- [ ] **Step 5: Create the styles**

Create `src/components/work/earlier-detail.module.css`:

```css
/* The earlier-item detail (spec 2026-07-20): a lighter case study. Draws on the
   case-study-intro type roles, without the impact lead or attribute grid. */
.detail {
  max-width: 720px;
  margin: 0 auto;
  padding: 6vh 6vw 12vh;
}

.eyebrow {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--work);
}

.title {
  margin: 0.4rem 0 0.8rem;
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-variation-settings: "wght" 620;
  letter-spacing: -0.015em;
  line-height: 1.05;
  color: var(--ink);
}

.meta {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.03em;
  color: var(--mute);
}

/* Separator is a design decision, never copy (spec §15). */
.meta span + span::before {
  content: " · ";
}

.body {
  margin-top: 3.2rem;
  font-size: clamp(1.05rem, 1.4vw, 1.2rem);
  line-height: 1.6;
  color: var(--ink);
}

.body :where(p) {
  margin: 0 0 1.2rem;
}

.body :where(h2, h3) {
  margin: 2.4rem 0 0.8rem;
  font-size: 0.82rem;
  font-family: var(--font-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
}

.body :where(ul) {
  margin: 0 0 1.2rem;
  padding-left: 1.2rem;
}

.body :where(li) {
  margin: 0.3rem 0;
}

.live {
  margin-top: 2.8rem;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  letter-spacing: 0.06em;
}

.live a {
  color: var(--ink);
  text-underline-offset: 4px;
}

.live a::after {
  content: "→";
  display: inline-block;
  margin-left: 0.4em;
}
```

- [ ] **Step 6: Run tests**

Run: `pnpm test src/components/work/earlier-detail.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/components/work/earlier-detail.tsx src/components/work/earlier-detail.module.css src/components/work/earlier-detail.test.tsx src/lib/site-content.ts
git commit -m "feat(earlier): EarlierDetail component + view-live label"
```

---

### Task 4: Routes — standalone page + intercepting modal

**Files:**
- Create: `src/app/earlier/[slug]/page.tsx`
- Create: `src/app/@modal/(.)earlier/[slug]/page.tsx`

**Interfaces:**
- Consumes: `sortedEarlierWork` (has slug/url), `nextBySlug`, `EarlierDetail`, `CaseStudyModal`, `SiteHeader`, `siteContent.labels.allWork`.
- `@modal/default.tsx` already returns null and serves the closed state for both `(.)work` and `(.)earlier` in the shared slot — no change.

- [ ] **Step 1: Create the standalone page**

Create `src/app/earlier/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { nextBySlug } from "@/components/work/work-lists";
import { sortedEarlierWork } from "@/components/work/work-data";
import { SiteHeader } from "@/components/site-header";
import { siteContent } from "@/lib/site-content";

export function generateStaticParams() {
  return sortedEarlierWork.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) return {};
  return { title: item.title };
}

/**
 * The standalone earlier-project page (spec 2026-07-20): the share/SEO/no-JS
 * surface the intercepting modal falls through to, mirroring /work/[slug].
 */
export default async function EarlierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) notFound();

  const next = nextBySlug(sortedEarlierWork, slug);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1000px] px-[6vw] pt-24">
          <Link href="/#work" className="font-mono text-sm text-mute transition-colors hover:text-ink">
            {siteContent.labels.allWork}
          </Link>
        </div>
        <EarlierDetail
          item={item}
          headingLevel={1}
          next={next ? { title: next.title, url: next.url } : undefined}
        />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Create the intercepting modal**

Create `src/app/@modal/(.)earlier/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { CaseStudyModal } from "@/components/work/case-study-modal";
import { nextBySlug } from "@/components/work/work-lists";
import { sortedEarlierWork } from "@/components/work/work-data";

/**
 * Intercepts a client-side navigation to /earlier/[slug] from the one-pager and
 * renders the earlier item over it in the shared CaseStudyModal (spec 2026-07-20).
 * `(.)` is the same-level matcher, exactly as (.)work/[slug]. A hard load falls
 * through to /earlier/[slug].
 */
export default async function InterceptedEarlier({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) notFound();

  const next = nextBySlug(sortedEarlierWork, slug);

  return (
    <CaseStudyModal label={item.title}>
      <EarlierDetail
        item={item}
        headingLevel={1}
        next={next ? { title: next.title, url: next.url } : undefined}
      />
    </CaseStudyModal>
  );
}
```

- [ ] **Step 3: Verify the routes build**

Run: `pnpm build 2>&1 | grep -E "/earlier/\[slug\]|Compiled|error" | head`
Expected: the build lists `/earlier/[slug]` among the routes and completes with no error.

- [ ] **Step 4: Verify a slug resolves and a bad slug 404s (served HTML)**

Run: `pnpm build && pnpm start &` then (after it is up) `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/earlier/cinematiq` and `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/earlier/nope`; then stop the server.
Expected: `200` then `404`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/earlier/[slug]/page.tsx" "src/app/@modal/(.)earlier/[slug]/page.tsx"
git commit -m "feat(earlier): standalone page + intercepting modal routes"
```

---

### Task 5: Earlier-work list links to the modal

**Files:**
- Modify: `src/components/work/earlier-work.tsx`
- Modify: `src/components/work/earlier-work.test.tsx`

**Interfaces:**
- Consumes: each entry's `url` (Task 1). Every title becomes an internal `<Link href={entry.url}>`; the external live link now lives in the modal (Task 3), so the list no longer branches on `isViewUrl`.

- [ ] **Step 1: Update the test**

In `src/components/work/earlier-work.test.tsx`, the fixture builds an `EarlierProject`; ensure it has a `url`, and assert the title links to it. Add `url: "/earlier/cinematiq"` to the fixture object, and add:

```tsx
import Link from "next/link";

it("links every title to its earlier detail url, not the external view", () => {
  const { container } = render(<EarlierWork />);
  const link = container.querySelector("a");
  expect(link?.getAttribute("href")).toMatch(/^\/earlier\//);
});
```

(If the existing suite renders `<EarlierWork />` against real `sortedEarlierWork`, this passes on real data; if it mocks, keep the mock's `url` set as above.)

- [ ] **Step 2: Run it, confirm it fails**

Run: `pnpm test src/components/work/earlier-work.test.tsx`
Expected: FAIL — the title currently links to the external `view` (or is plain text), not `/earlier/...`.

- [ ] **Step 3: Implement**

In `src/components/work/earlier-work.tsx`: add `import Link from "next/link";` at the top, and drop the `isViewUrl` import if it is now unused. Replace the title cell:

```tsx
            <h4 className={styles.title}>
              {isViewUrl(entry.view) ? (
                <a
                  href={entry.view}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.titleLink}
                >
                  {entry.title}
                </a>
              ) : (
                entry.title
              )}
            </h4>
```

with:

```tsx
            <h4 className={styles.title}>
              <Link href={entry.url} className={styles.titleLink}>
                {entry.title}
              </Link>
            </h4>
```

- [ ] **Step 4: Run tests**

Run: `pnpm test src/components/work/earlier-work.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/work/earlier-work.tsx src/components/work/earlier-work.test.tsx
git commit -m "feat(earlier): list titles open the modal instead of linking out"
```

---

### Task 6: Port the body copy from the doc

**Files:**
- Modify: `content/earlier/cinematiq.mdx`, `shift.mdx`, `intuit.mdx`, `yahoo-bubbles.mdx`, `yahoo-developer-network.mdx`, `yahoo-design-pattern-library.mdx`

**Interfaces:** none (content). Keep each file's frontmatter EXACTLY as-is (tags stay tight); replace only the body below the closing `---`.

- [ ] **Step 1: Replace each body**

For each file, keep the frontmatter block unchanged and replace everything after the closing `---` with the copy below (two paragraphs + a `## What I did` list, from `docs/notes/jonokane-selected-earlier-work.md`).

`content/earlier/cinematiq.mdx` body:

```md
Independent film festivals run on a surprising amount of manual coordination, and Cinematiq set out to automate it. They brought me in as a single design-and-build resource to define the product's core interactions and hand their team a reusable style guide to build against.

I ran stakeholder interviews to understand how festivals actually work, translated what I learned into wireframes and visual design, and coded the front end so the handoff was grounded in something real rather than a static mockup. A tight, fast engagement that shows how I move from research to shipped front-end on my own.

## What I did

- Stakeholder interviews to map the festival workflow
- Interaction design and wireframes for the core product
- Visual design
- Front-end engineering and a build-ready style guide (Bootstrap 3)
```

`content/earlier/yahoo-bubbles.mdx` body:

```md
Bubbles was an internal skunkworks project at Yahoo!, built inside the Catalyst innovation program: a spatial network that combined location, social, and a real sense of play. It never launched publicly, but it was one of the most enjoyable and formative projects of my time there.

As design lead I authored the interaction design specs for both iOS and Android, directed a small group of contributors, and partnered closely with mobile and web engineers, a product visionary, and QA. It was a proving ground for me as a design leader, and a strong example of taking an ambitious concept from zero to a built, running app across both platforms.

## What I did

- Led design across iOS and Android
- Authored full interaction design specs for both platforms
- Directed a small team of contributors
- Partnered with mobile and web engineers, product, and QA to build a running cross-platform concept
```

`content/earlier/shift.mdx` body:

```md
Shift, the used-car marketplace, needed an MVP prototype credible enough to help raise their next round. They already had a starting prototype, but it had interaction problems that got in the way of the story they needed to tell investors.

I came in to resolve those interaction issues, refresh the visual design, and code a fully functioning responsive front end. The result helped them secure funding, which is exactly the kind of commercial outcome an early-stage team hopes a fractional design-and-build partner can deliver. Shift has since wound down, but the work stands as a clear example of design and code in service of a raise.

## What I did

- Diagnosed and fixed interaction issues in an existing prototype
- Refreshed the visual design
- Coded a fully functioning responsive front-end MVP
- Delivered a prototype that supported a successful raise
```

`content/earlier/intuit.mdx` body:

```md
Intuit brought in Tangible UX to design, prototype, and test a unified authentication system and member center spanning their products, including Mint. I worked through several design rounds and then validated them in a week of usability testing.

The testing focused on the details that make or break a sign-in flow: field validation, error states, and whether a separate User ID field was even necessary. It is a focused research-and-prototyping engagement for a major consumer-finance brand, and a good example of pairing design decisions with real user testing rather than opinion.

## What I did

- Designed and prototyped a unified authentication and member center
- Ran a week of usability testing across several design rounds
- Tested field validation, error states, and drop-off points
- Investigated whether a separate User ID field was necessary
```

`content/earlier/yahoo-developer-network.mdx` body:

```md
A large part of my Yahoo! career went into the Yahoo! Developer Network. In 2007 I pioneered a way to build rapid, iterative usability-testing prototypes in HTML and CSS, at a time when Flash was the industry standard for that work. The approach worked well enough that parts of the prototypes were carried straight into production code.

Alongside the prototyping method, I designed a range of YDN features, including the API uptime dashboard, app-publish functionality, and the YDN events module. It is an early but telling example of the design-and-code overlap that still defines how I work today.

## What I did

- Pioneered HTML and CSS rapid prototyping for usability testing, replacing Flash
- Designed the API uptime dashboard, app-publish functionality, and the YDN events module
- Contributed prototype work that carried into production code
```

`content/earlier/yahoo-design-pattern-library.mdx` body:

```md
The Yahoo! Design Pattern Library was an early public, curated collection of interaction patterns: a reference designers could turn to for how common problems get solved across screens. It lived as part of the Yahoo! Developer Network.

I worked closely with Christian Crumlish, who curated the patterns, and built the front-end code that published his work to the web. It is a focused front-end engineering engagement, and an early example of me shipping the code behind a design system rather than only designing for one.

## What I did

- Built the front-end for the public Design Pattern Library
- Partnered with Christian Crumlish to publish his curated pattern set
- Turned a curated collection into a usable, browsable web resource
```

- [ ] **Step 2: Rebuild content and verify all six compile**

Run: `pnpm exec velite && node -e "const e=require('./.velite/earlier.json'); console.log(e.length, e.every(x=>x.body.length>200))"`
Expected: `6 true` (six items, each with a non-trivial compiled body).

- [ ] **Step 3: Commit**

```bash
git add content/earlier/cinematiq.mdx content/earlier/shift.mdx content/earlier/intuit.mdx content/earlier/yahoo-bubbles.mdx content/earlier/yahoo-developer-network.mdx content/earlier/yahoo-design-pattern-library.mdx
git commit -m "content(earlier): port the rewritten body copy from the earlier-work doc"
```

---

### Task 7: Whole-feature verification (controller-run)

**Files:** none (verification + gate).

- [ ] **Step 1: Gates green**

Run: `pnpm test && pnpm lint && pnpm build`
Expected: all tests pass, 0 lint errors, build completes with `/earlier/[slug]` in the route list.

- [ ] **Step 2: Browser pass (both themes), on a fresh dev server**

Restart the dev server clean (`pkill -f "next dev"; rm -rf .next; pnpm dev`). Then verify:
- On `/`, scrolling to the Selected earlier work panel, each title is a link to `/earlier/<slug>`.
- Clicking a title opens the slide-up modal showing the item's body copy (paragraphs + "What I did" list); the eyebrow, title and meta render.
- A live-link item (Cinematiq / YDN / Design Pattern Library) shows "View live →"; an Archived item (Shift / Intuit / Bubbles) shows none.
- Escape closes the modal and restores focus to the triggering title; the background is inert while open.
- A hard load of `/earlier/cinematiq` shows the standalone page (header + back link + detail).
- Opening a featured Work card still works (the two `@modal` interceptors coexist).

- [ ] **Step 3: Final commit if any fixups were needed**

```bash
git add -p   # stage only intended fixups
git commit -m "fix(earlier): <describe any browser-pass fixups>"
```

---

## Self-Review

- **Spec coverage:** routes (Task 4), reused modal (Task 3/4), EarlierDetail lighter rendering with eyebrow/title/meta/body/live-link/next (Task 3), list links to modal (Task 5), Velite slug/url (Task 1), content port with tight tags (Task 6), reduced-motion/a11y inherited from the modal (verified Task 7). All spec sections map to a task.
- **Placeholder scan:** none — every step has concrete code/commands and the six bodies are inline.
- **Type consistency:** `nextBySlug` generic used with both `CaseStudy` and `EarlierProject`; `EarlierDetail` reads only earlier fields; `HeadingLevel`/`HEADING_TAGS`/`BODY_HEADING_LEVEL` used exactly as `CaseStudyArticle` does; `sortedEarlierWork` carries `slug`/`url` after Task 1, which Tasks 4/5 rely on.
