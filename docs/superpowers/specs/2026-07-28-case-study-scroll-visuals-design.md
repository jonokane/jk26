# Case-study scroll visuals — Pin & Breakout

_Date: 2026-07-28 · Author: Jono + Claude · Builds on: `2026-07-16-stark-visual-language-design.md` (§10 detail surface, §14 conventions)_

## Problem

The case studies read content-dense and visual-light. A study like Collaya carries its
whole argument in prose, in a 62-character reading column centred inside a 1000px article,
with empty canvas on both sides — and exactly **one** image (the `cover`), parked in a band
at the foot of the article. Nothing appears as you scroll the body.

Two things are true and unused:

1. An inline-image mechanism already exists (`MdxImage` / `figure.tsx`, wired as `img:` in
   `mdx-content.tsx`) — markdown `![alt](src "caption")` becomes a hairline-framed `<figure>`
   with a mono caption. Collaya's MDX simply never uses it.
2. `.body { max-width: 62ch }` (`case-study-article.module.css`) hard-caps *everything* in the
   body to text width. So even the existing inline figure can never exceed the measure, and
   the side whitespace can never be used.

We want visuals that arrive **as the reader scrolls**, use the horizontal room, and stay
authorable from a single `.mdx` file with no per-study code.

## Decision

Two scroll treatments, chosen from a live prototype pass (four candidates: inline, breakout,
margin-aside, pinned-stage):

- **Breakout (B)** — an image that escapes *wider than the text column*, a wide visual beat
  between tight prose. Everyday treatment.
- **Pin (D1)** — an image that **holds in view while its related paragraphs scroll past it**,
  in a two-column stage. The moment a study earns a held image. **Dead-still** — no parallax.

Explicitly **not** building now (parked, not rejected):

- **Cross-dissolve (D2)** — one frame fading through several shots. Reconsider once studies
  have enough real assets to warrant it.
- **Micro-parallax (D3)** — subtle drift on a pinned/breakout image. Kept as a **future
  per-image opt-in**; the prototype proved a sensible default of ~56px. Not default-on.
- **Margin / side-gutter figures** — didn't win; the modal surface is too narrow for it.

Both treatments are **static-by-authoring**: the study degrades gracefully with a partial
image set (the "some, need more" content reality) because absent images simply aren't
authored — there is no placeholder to maintain. A study may have zero, one, or many of each,
freely mixed with plain inline figures and full-width prose.

## Authoring model (the whole surface)

Adding any image is always the same three steps:

1. Drop the file in `content/work/media/<slug>/` (e.g. `content/work/media/collaya/daw.png`).
2. Reference it as a **relative markdown image**. Velite copies it to `/static/…-<hash>.ext`,
   reads its intrinsic dimensions, and generates the blur placeholder — automatically, the
   same path the cover uses. **Markdown image syntax is load-bearing**: Velite only rewrites
   `src` for `![]()` nodes, not for arbitrary HTML `<img>` or component `src` props.
3. First brackets = **alt** (accessible description). Quoted string = **caption** (mono, under
   the image). Omit the quotes for an uncaptioned image.

The three forms:

**① Inline** — already wired; text-width figure. No wrapper.
```mdx
![Collaya's chat, mid-session](./media/collaya/chat.png "The conversation is still the heart of it.")
```

**② Breakout** — wrap that image so it escapes wider than the text; auto-collapses to inline
on narrow screens.
```mdx
<Breakout>

![Collaya in the rack](./media/collaya/rack.png "In the same rack as FabFilter, NI and U-He.")

</Breakout>
```

**③ Pin** — wrap the image **and the paragraphs that should scroll past it**. First child (the
image) is the held column; the paragraphs are the side column. Stacks on mobile.
```mdx
<Pin>

![Collaya, loaded in the DAW](./media/collaya/daw.png "Collaya, loaded in the DAW")

The web app worked. You uploaded your sounds, Collaya listened, and then you could have a real
conversation about the material.

The workflow was the problem. Stop the session, switch apps, bounce a reference, upload it,
wait, then talk.

A plugin closes both gaps at once — tempo, key and transport read straight from the host.

</Pin>
```

**Authoring contract:** inside `<Pin>`, the **first block child is the held media**; everything
after it is the prose that scrolls past. The blank lines around the inner content are required
— they tell MDX to parse the inside as Markdown (which is what keeps Velite's asset rewriting
and the caption convention working).

No new dependency: this uses MDX's native JSX-with-Markdown-children. `velite.config.ts` is
untouched.

## Components

Two components, registered in `mdx-content.tsx`'s `mdxComponents` map (alongside `img`), so
they are available to **every** study — not Collaya-specific.

### `<Breakout>` — `src/components/mdx/breakout.tsx`
- Wraps its child figure in a block that escapes the reading measure and centres on the
  **viewport**, so it uses the side whitespace (see Layout below). Width capped so it stays a
  band, not edge-to-edge chrome.
- No motion. No copy. Purely a width/placement wrapper around the existing `MdxImage` output.

### `<Pin>` — `src/components/mdx/pin.tsx`
- Splits children: **first element child → the media (sticky) column; the rest → the text
  column.** Implemented in React (not CSS), because grouping the trailing paragraphs into one
  flex/grid child is the only robust way to make the media stick against them (`grid-row: 1 /
  -1` does not reliably span implicit rows).
- Renders:
  ```
  <div class=pin>
    <div class=pin-media>{firstChild}</div>   // position: sticky
    <div class=pin-text>{restChildren}</div>
  </div>
  ```
- **Dead-still hold = pure CSS `position: sticky`.** No ScrollTrigger, no RAF loop, no JS
  scroll listener. This is deliberate: it sidesteps CLAUDE.md's "one RAF loop / one scroll
  owner" rule entirely and works identically on the full page and inside the modal's own
  scroller, because sticky resolves against whatever scroll container it lives in.
- No copy. The caption is the MDX image's title, rendered by `MdxImage` in the media column so
  it travels with the held image.

Both reuse `MdxImage` unchanged for the framed figure + caption; they only govern width,
placement, and (for Pin) stick behaviour.

## Layout — the body width model changes

The blocker is `.body { max-width: 62ch }`. Fix by moving the measure **off the container and
onto the text elements** (`case-study-article.module.css`):

- `.body` loses its `62ch` cap and becomes the full article column (still bounded by
  `.article { max-width: 1000px }`).
- `.body :where(p, li, h2, h3, …)` gain `max-width: 62ch` (left-aligned, matching today's
  reading position) so prose measure is unchanged visually.
- Inline figures (`.figure`) may now fill the article column rather than the old 62ch cap.

**Breakout width:** a centred band escaping the 1000px article toward the viewport edges:
`width: min(<cap ~1280px>, 100vw - 2*gutter)`, centred via `margin-inline: auto` relative to
the viewport (`margin-left: 50%; transform: translateX(-50%)` against the centred article, or
a full-bleed `margin-inline: calc(50% - 50vw)` re-padded). On narrow screens the `min()`
resolves to ~full width, so breakout ≡ inline — the free mobile degradation.

**Pin geometry:** lives within the article column. `display: flex; gap: 6vw;` — media column
`flex: 0 0 46%`, `position: sticky; top: ~16vh; align-self: flex-start`; text column `flex: 1`,
with generous bottom padding so the last paragraph clears the held image. **Mobile (`≤820px`):
the flex row stacks** — media on top (static, `position: static`), prose below at full width.

Held images are authored at modest/native size (a plugin window, a diagram), never scaled to
fill the viewport — so resolution stays honest. This was the governing constraint behind
choosing dead-still D1 over a full-bleed pin.

## Two surfaces

Both `CaseStudyArticle` surfaces render the same components:

- **Full page `/work/[slug]`** — Lenis smooth-scrolls the window; CSS sticky resolves against
  the document. Works.
- **Modal `@modal/(.)work/[slug]`** — Lenis is stopped (spec §10); the `.scroller`
  (`overflow-y:auto`, `data-lenis-prevent`) scrolls natively; CSS sticky resolves against the
  `.scroller`. Works, no extra wiring.

Because the hold is pure CSS, there is **nothing surface-specific to configure** — the reason
we chose sticky over a JS pin.

## Motion & accessibility

- **Reduced motion:** the pin's hold is scroll layout, not animation, so it is *not* gated
  (a held image is not vestibular-triggering, unlike parallax). What reduce gates: the
  existing §11 reveal fade on figures, and the future D3 drift (not built). If we later add
  Pin's opt-in parallax, that path is reduce-gated to dead-still.
- **Alt vs caption** (spec §14, §15): alt = accessible description (first brackets); caption =
  the quoted title, decorative/context. Never fold one into the other.
- **Reachability / no chrome traps:** figures are non-interactive; nothing new to tab to.

## Content strings

Zero UI copy in these components (spec §14). Every visible string — alt, caption — is authored
in the `.mdx`. Nothing lands in `site-content.ts`; nothing is hard-coded in JSX.

## Testing & verification

- **Unit** (`pin.test.tsx`, `breakout.test.tsx`): Pin splits first-media vs rest correctly;
  Pin with no media child fails safe (renders text, no empty sticky column); Breakout wraps
  its figure. Keep the existing `case-study-*` suites green.
- **Visual (non-negotiable, per CLAUDE.md "Verifying visual work"):** render the pixels, both
  themes, **both surfaces** (page + modal), desktop + mobile, with real Collaya imagery in a
  `<Pin>` and a `<Breakout>`. Confirm: the pin actually holds while text scrolls; the breakout
  visibly exceeds the measure and uses the side whitespace; mobile collapses both to inline;
  captions read in mono under the image. Check the served result, not the JSX.

## Build order (high level)

1. Flip the body width model (`case-study-article.module.css`) + confirm inline figures and
   all existing studies still read correctly. This is the enabling change.
2. `<Breakout>` + styles; register; author one real breakout into `collaya.mdx`; verify.
3. `<Pin>` + styles (sticky, flex, mobile stack); register; author one real pin into
   `collaya.mdx`; verify the hold on both surfaces and both themes.
4. Tests. Full `pnpm build` + `pnpm test`.

## Open / deferred

- **Breakout cap width** (~1280px?) and **pin `top` offset / media column %** are tunables to
  dial on real pixels; land sensible defaults, adjust by eye.
- **D3 micro-parallax as a Pin/Breakout prop** (e.g. `<Pin drift={56}>`) — deferred; the
  authoring hook and default are known if we want it.
- **True full-bleed breakout** (edge-to-edge, escaping the gutter entirely) — deferred; default
  is a capped band.
- **D2 cross-dissolve** — revisit when asset density justifies it.
