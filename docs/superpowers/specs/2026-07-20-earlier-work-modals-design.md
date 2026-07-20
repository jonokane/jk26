# Earlier work — openable modals — design

**Status:** approved in brainstorming (2026-07-20). Ready to plan.

## Why

The "Selected earlier work" list currently renders each project as just a title
plus a one-line meta row. Some titles link out to a (often dead) external URL;
most are inert text. As Jono put it: a bare list of names is pointless. Each
earlier project has real, rewritten body copy (`docs/notes/jonokane-selected-earlier-work.md`)
that has nowhere to appear.

This makes each earlier item **openable**, in the same slide-up sheet the
featured case studies use — a lighter "mini case study" showing its body copy.

## What it is

Clicking an earlier project's title opens the existing `CaseStudyModal` over the
one-pager (same behaviour as a Work card), showing the project's title, a compact
meta line, its body copy, and — where one exists — a "View live" link. A hard
load or refresh of the URL falls through to a real standalone page. This mirrors
the featured-study pattern exactly (`/work/[slug]` + `@modal/(.)work/[slug]`),
reusing the modal and the MDX renderer.

Six items: Cinematiq, Shift, Intuit, Yahoo! Bubbles, Yahoo! Developer Network,
Yahoo! Design Pattern Library. (HuddleUp already removed.)

## Architecture

Mirror the featured-study routing, one level lighter in content.

```
src/app/earlier/[slug]/page.tsx            NEW  standalone page (SEO/share/no-JS fallback)
src/app/@modal/(.)earlier/[slug]/page.tsx  NEW  intercepting modal (reuses CaseStudyModal)
src/app/@modal/default.tsx                 EXISTING (null) — already covers both slots
src/components/work/earlier-detail.tsx     NEW  the earlier item's rendering (title/meta/body/links)
src/components/work/earlier-detail.module.css NEW
src/components/work/earlier-work.tsx        MODIFY  titles link to /earlier/[slug], not the external URL
velite.config.ts                            MODIFY  add slug/url transform to the `earlier` collection
src/components/work/work-lists.ts           MODIFY  add nextEarlier() (mirrors nextStudy())
content/earlier/*.mdx                        MODIFY  port the doc's fuller body copy (6 files)
```

### Data (velite)

The `earlier` collection has no `slug`/`url` today. Add the same transform the
`work` collection uses:

```ts
.transform((data) => {
  const slug = data.path.replace(/^earlier\//, "");
  return { ...data, slug, url: `/earlier/${slug}` };
})
```

`sortedEarlierWork` (from `work-data.ts`) then carries `slug`/`url`. No new data
module — the routes read `sortedEarlierWork` exactly as the work routes read
`publishedWork`.

### Routes (mirror `/work/[slug]`)

- **`/earlier/[slug]/page.tsx`** — `generateStaticParams` from `sortedEarlierWork`
  slugs; `generateMetadata` (title). Renders `SiteHeader` + `<main>` + the
  "← All work" back link (to `/#work`) + `<EarlierDetail>`. `notFound()` on a
  missing slug.
- **`@modal/(.)earlier/[slug]/page.tsx`** — finds the item, renders
  `<CaseStudyModal label={item.title}><EarlierDetail …/></CaseStudyModal>`.
  Same interception mechanics as `(.)work/[slug]`; `default.tsx` (null) already
  serves the closed state for the shared `@modal` slot.

### `EarlierDetail` (the lighter rendering)

One component, used by both routes (page and modal), like `CaseStudyArticle` is
for featured studies — but earlier items carry far fewer fields (no cover,
impact, client, summary), so it is deliberately simpler:

- **Eyebrow** — mono, the project's primary sector (e.g. "CREATIVE TECH").
- **Title** — `<h1>` (the item is the subject on its own page; the accessible
  name for the modal comes from `CaseStudyModal`'s `aria-label`).
- **Meta line** — `role · timeframe · discipline · platform` (mono, muted),
  fuller than the gallery list's row (which drops role/platform for space).
- **Body** — `<MDXContent code={item.body} />`, so the doc's two paragraphs and
  the `## What I did` list render with the site's MDX components (incl. the
  figure component if an earlier item ever gets an inline image).
- **Live link** — `View live →` to `item.view` (`target="_blank" rel="noreferrer"`)
  **only when** `isViewUrl(item.view)` (Cinematiq, YDN, Design Pattern Library).
  Archived items (Shift, Intuit, Bubbles) show no live link.
- **Next** — `Next: <title> →` via `nextEarlier(sortedEarlierWork, slug)`
  (reuses the featured "next" affordance; wraps at the ends like `nextStudy`).
  A plain `<Link href={next.url}>` so it re-intercepts into the modal.

All copy that is a fixed label (eyebrow prefix, "View live", "Next", "All work")
comes from `src/lib/site-content.ts` (spec §14/§15 — no strings in JSX).

### Earlier-work list change

In `earlier-work.tsx`, every title becomes a `<Link href={entry.url}>` (a plain
click intercepts into the modal, cmd-click / new-tab / share still work), instead
of today's "link to the external `view` if it is a URL, else plain text". The
external live link moves into the modal. The meta row underneath is unchanged.

### Content

Port each project's body from `docs/notes/jonokane-selected-earlier-work.md`:
the two rewritten paragraphs followed by a `## What I did` heading and its bullet
list, into the six `content/earlier/*.mdx` bodies. Strip the doc's flags/notes
blocks and the "Client / context / role / tags / live link" header lines — those
map to frontmatter (already present) or are editorial notes, not body copy.

**Tags stay tight** (Jono's call): keep the existing canonical frontmatter tags
(`sector`/`discipline`/`platform`) unchanged — they already map the doc's ad-hoc
suggestions (Front-End → Full-stack Product, Fintech → Creative Tech
(fintech-adjacent), etc.) into the site's filter vocabulary, so the Work filter
does not sprout one-off facets. Frontmatter otherwise unchanged (the two dead
`view` links, Shift and Intuit, were already set to `Archived`).

## Reduced motion / a11y

- The modal already handles reduced motion (no slide) and now carries full focus
  management (focus in, trap, restore, inert background) from the recent a11y
  fix — inherited for free.
- The standalone page is an ordinary reading surface (the reduced-motion-friendly
  route), like `/work/[slug]`.
- The eyebrow/title/meta are real headings and text; the live link and next link
  are real anchors.

## Testing

- **Unit:** `nextEarlier()` (wraps at ends, returns the right neighbour, handles
  a single-item list); `earlier-detail` renders title/body and shows the live
  link only for URL `view` values (not for "Archived"); the earlier-work list
  links every title to its `/earlier/[slug]` url.
- **Build/route:** `generateStaticParams` yields all six slugs; `/earlier/[slug]`
  renders standalone; a bad slug 404s.
- **Browser (controller):** clicking an earlier title opens the modal with the
  body copy; Escape closes and restores focus; a live-link item shows "View live",
  an Archived item does not; a hard load of `/earlier/<slug>` shows the standalone
  page; both themes.
- Gates unchanged: `pnpm build && pnpm test && pnpm lint` green; no dead tokens;
  content discipline (labels from site-content).

## Risks / notes

- **Two `@modal` interceptors in one slot.** `(.)work/[slug]` and
  `(.)earlier/[slug]` coexist under `@modal`; the single `default.tsx` (null)
  serves both closed states. Standard Next parallel-routing; verify a
  work-modal and an earlier-modal each open and close cleanly.
- **`nextEarlier` scope.** "Next" cycles within earlier items only (not into the
  featured studies) — earlier is its own list.
- **No cover/impact.** `EarlierDetail` must not assume the featured fields; it
  reads only `title`, `sector`, `discipline`, `platform`, `role`, `timeframe`,
  `view`, `body`, `slug`, `url`.

## Out of scope

- Cover images for earlier items (they have no `cover` field; not adding one).
- Promoting any earlier item into the featured `work` collection.
- Changing the filter vocabulary / adding the doc's suggested facets.
- A "fractional / consulting partner" byline the doc muses about (separate copy
  decision, not this feature).
