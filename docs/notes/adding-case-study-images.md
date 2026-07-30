# Adding images to a case study

Images are **content-relative**: the source file lives next to the MDX and Velite
copies it into `/static/…-<hash>.ext` at build, so content stays self-contained
and there's no `public/` juggling. Adding or changing imagery is editing one
`.mdx` file — no code changes.

Put a study's images under a per-slug folder:

```
content/work/media/<slug>/
```

## The one rule that will bite you: blank lines

**Every image must be its own paragraph — a blank line before AND after it**,
especially inside `<Pin>`, `<Breakout>`, and `<Slides>`. An image glued to
adjacent text stays in the same paragraph, never gets lifted out, and renders a
`<figure>` inside a `<p>` — invalid HTML that crashes hydration at runtime.

There's a build-time guard (`remark-standalone-images`) that catches this and
**fails the build with the file and line**, e.g.:

> `Image must be on its own line: an image is mixed with other content in a
> paragraph in content/work/facebook-pages.mdx (line 48). Put a blank line
> before AND after the image…`

So if you ever see that, add the blank line.

---

## 1. Cover image

One `cover` per study drives **both** the gallery card's shot and the wide band
at the foot of the detail page. In the study's frontmatter:

```yaml
cover: ./media/<slug>/cover.png
```

**Ideal cover: 2000 × 1000 px (≈2:1 landscape), PNG.** Why:

- Both slots are `object-fit: cover` **crop boxes** — the band is a wide ~2:1
  strip; the card shot is *portrait*. The same image is cropped to both.
- **Keep the subject centered on _both_ axes**, with breathing room — tall
  screens trim the sides, short screens trim top/bottom, and the card crops
  differently again. Center-safe survives all of them.
- **PNG (lossless)** is right for UI screenshots (crisp text/lines). `next/image`
  re-encodes to WebP/AVIF at **quality 90** (set in code), which keeps them sharp.
- Raster only (`.png`/`.jpg`/`.webp`) — `s.image()` reads the dimensions; SVG
  won't work as a cover.

**Mobile / portrait work** (e.g. phone screenshots): don't drop a raw portrait
shot in — it'll crop to a sliver in the wide band. **Compose a landscape cover**
at 2000×1000 (two or three phones on a wide canvas, or a context shot), and
**fill the frame with the actual content** — a small screenshot inside a big
canvas has low *effective* resolution once it's cropped and scaled.

Until you set `cover`, both surfaces show the hatched placeholder, so covers can
land study-by-study. The cover's alt text is the study title automatically.

---

## 2. Body image treatments

Four ways to place a visual in the prose. All use ordinary markdown images
inside; the wrapper decides the treatment.

### Inline — the default

```markdown
![Install flow, three steps](./media/<slug>/flow.png "The three-tap install flow")
```

A hairline-framed `<figure>` at the reading-column width, mono caption from the
`"title"`. Omit the title for no caption. **Click-to-zoom** (see §3).

### `<Breakout>` — wider than the text

```mdx
<Breakout>

![alt](./media/<slug>/wide.png "Caption")

</Breakout>
```

Escapes the reading measure into a centered band (up to ~1280px) that uses the
side whitespace; collapses back to inline width on mobile. Use it for a wide
visual beat. **Not** click-to-zoom — a breakout is already the big view.

### `<Pin>` — held while the text scrolls past

```mdx
<Pin>

![alt](./media/<slug>/held.png "Caption")

The first paragraph that scrolls past the held image…

Another paragraph…

</Pin>
```

The **first block is the held image** (it sticks in view); everything after it
is prose that scrolls past in a side column. Stacks vertically on mobile. Use it
for a moment where one image anchors a run of writing. **Click-to-zoom.**

### `<Slides>` — inline click-to-advance gallery

```mdx
<Slides>

![Intro screen](./media/<slug>/step-01.png "1 — The value proposition")
![Choose a category](./media/<slug>/step-02.png "2 — Choose a category")
…up to ~a dozen or so…

</Slides>
```

A screen-by-screen walkthrough: **click the image**, the **‹ ›** buttons, or the
**← → keys** to step (wraps both ends). Cross-dissolves between screens; a ring
pulses on the Next arrow until the first step. Manual only. **Not** click-to-zoom
(a click advances). Tips:

- Use **uniform dimensions / aspect** across the set — the frame sizes to the
  tallest slide, so mixed aspects make it jump.
- **Portrait phone screens are fine here** (capped at 70vh, centered).
- Per-screen **alt** = description; **caption** = the step label.

---

## 3. Click-to-zoom (lightbox)

**Inline and `<Pin>` images are click-to-zoom** — click to open a full-viewport
lightbox (Esc / backdrop / image click to close; arrow-key-independent). Reduced
motion cross-fades instead of scaling.

`<Breakout>` and `<Slides>` images are **not** zoomable (a breakout is already
full-size; a slide click advances). Higher-resolution sources zoom crisper.

---

## 4. Filenames with spaces

Markdown image paths don't handle spaces. Either **rename to web-safe** names
(`01-intro.png`), or use CommonMark's angle-bracket destination:

```markdown
![alt](<./media/<slug>/01 - Intro.png> "Caption")
```

Velite resolves the literal-space path and `%20`-encodes the output URL.

---

## 5. Recommended dimensions & weight

| Role | Target | Notes |
|---|---|---|
| **Cover** | **2000 × 1000 (2:1), PNG** | Center the subject; fill the frame; compose landscape for mobile work |
| Inline / Breakout | ~1600–2000 px wide | Breakout shows up to ~1280px; extra for retina + zoom |
| Pin (held) | ~1600 px+ wide | Small on-page (~46% column) but zooms — give it resolution |
| Slides | ~1200–2000 px long edge, **uniform aspect** | Phone screens welcome |

- Prefer **PNG** for UI screenshots (crisp), webp/avif/jpg for photos.
- Start from a reasonable source (aim < ~1 MB) — don't drop a 5 MB export in;
  Velite/`next/image` optimize covers, but body inline images are lazy `<img>`
  (no `next/image` resize) so their source size ships as-is.

## Gotchas

- **Relative paths only.** `./media/…` is what Velite copies + hashes. An
  absolute `/foo.png` in `public/` loads but skips Velite's copy/optimize.
- **`_`-prefixed files are ignored** by Velite — don't name a folder/file `_foo`.
- A `cover` (or any markdown image) pointing at a **missing file fails the
  build** (strict mode) — the content gate working, not a bug.

## Where the wiring lives (for maintainers)

- `velite.config.ts` — `cover: s.image()`; `remarkPlugins` include
  `remark-standalone-images` (the blank-line guard, `src/lib/`); `rehype-unwrap-images`.
- `src/components/mdx/figure.tsx` — the inline `<figure>` (`img` component).
- `src/components/mdx/{breakout,pin,slides}.tsx` (+ `.module.css`) — the three
  wrappers, registered in `src/components/mdx-content.tsx`.
- `src/components/mdx/{zoomable-image,lightbox,zoom-context}.tsx` — click-to-zoom;
  `<ZoomDisabled>` (from `zoom-context`) turns it off inside Breakout & Slides.
- `src/components/work/{work-card,case-study-cover}.tsx` — the two cover slots
  (`next/image`, `quality={90}`; the card's `sizes` is tuned for the cover-crop).
