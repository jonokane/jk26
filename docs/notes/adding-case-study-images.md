# Adding images to a case study

Two image roles, both **content-relative** — the source file lives next to the
MDX and Velite copies it into `/static/…-<hash>.ext` at build, so content stays
self-contained and there's no `public/` juggling. No code changes to add images;
just author the MDX.

Put a study's images under a per-slug folder:

```
content/work/media/<slug>/
```

## 1. Cover image

One `cover` per study drives **both** the gallery card's shot and the wide band
at the foot of the detail page (`/work/<slug>`).

In the study's frontmatter:

```yaml
cover: ./media/tappa/cover.jpg
```

Velite resolves this to `{ src, width, height, blurDataURL }` and the components
render it with **`next/image`** — optimized (responsive `srcset`, modern
formats, lazy) with a blur-up placeholder from the frontmatter. Until you set
`cover`, both surfaces show the hatched placeholder, so covers can land
study-by-study.

Both slots are **fixed-size crop boxes** (`object-fit: cover`), so:

- Supply a **wide landscape** (~2000 px wide is plenty).
- Keep the subject **roughly centered** — the card and the detail band crop to
  different shapes.
- Must be a **raster** file (`.jpg` / `.png` / `.webp`) — `s.image()` reads its
  dimensions; SVG won't work as a cover.

The cover's alt text is the study title automatically.

## 2. Inline images in the body

Standard markdown image syntax, content-relative. The optional **title** (the
quoted string) becomes a visible caption; the **alt** stays the accessible
description:

```markdown
![Install flow, three steps](./media/tappa/flow.jpg "The three-tap install flow")
```

Renders as a `<figure>` — hairline-framed image + a mono caption in the site's
caption register (`src/components/mdx/figure.tsx`). Omit the `"title"` for an
uncaptioned image. These are lazy-loaded `<img>` (body images carry no known
dimensions, so `next/image` isn't a fit); size them ~1400 px wide.

## Formats & weight

- Prefer **webp/avif** or well-compressed **jpg/png**.
- Covers are optimized by `next/image` at request time, but still start from a
  reasonable source (aim < ~400 KB) — don't drop a 5 MB export in.

## Gotchas

- **Relative paths only.** `cover: ./media/…` and `![](./media/…)` are what
  Velite copies + hashes. An absolute `/something.png` (a file you dropped in
  `public/`) still loads, but skips Velite's copy/optimize step.
- **`_`-prefixed files are ignored** by Velite — don't name a study or an image
  folder `_foo`.
- A `cover` pointing at a missing file **fails the build** (strict mode) — that's
  the content gate working, not a bug.

## Where the wiring lives (for maintainers)

- `velite.config.ts` — `cover: s.image()`, and `rehype-unwrap-images` (lifts a
  lone body image out of its paragraph so `<figure>` is valid).
- `src/components/work/work-card.tsx`, `case-study-cover.tsx` — the two cover
  slots, `next/image` with `fill` + blur.
- `src/components/mdx/figure.tsx` (+ `.module.css`) — the inline `<figure>`,
  registered as the `img` component in `src/components/mdx-content.tsx`.
