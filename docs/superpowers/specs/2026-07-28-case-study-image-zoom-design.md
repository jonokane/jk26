# Case-study image zoom — click-to-zoom lightbox

_Date: 2026-07-28 · Author: Jono + Claude · Builds on: `2026-07-28-case-study-scroll-visuals-design.md` (Pin & Breakout) and `2026-07-16-stark-visual-language-design.md` (§10 modal, §11 motion, §14 conventions)_

## Problem

The `<Pin>` treatment holds an image at ~46% column width. On a wide viewport that's a
modest size — good enough to anchor the read, too small to appreciate a screen or diagram.
There's no way to see any case-study image larger.

## Decision

**A click-to-zoom lightbox on the *small* case-study body figures — inline and `<Pin>`.**
Because both render through **`MdxImage`** (`figure.tsx`), the affordance lives there once.

**Refinement (2026-07-28, post-build):** `<Breakout>` images are *excluded*. A breakout is
already displayed at or beyond full-screen width — often taller than the viewport (the page
scrolls to it) — so a lightbox that must fit the whole image on screen can only ever *shrink*
it, which reads as a broken "zoom". Breakouts opt out via a `ZoomDisabled` context that
`<Breakout>` provides and `ZoomableImage` reads; inside it, `ZoomableImage` renders a plain
figure image (no trigger). Rule: the small images zoom; the breakout already *is* the big view.

Click (or Enter/Space) → the image **animates from its exact on-screen rect up to a
full-viewport view** (a FLIP zoom) over a stark theme-canvas backdrop, caption in mono beneath.
Esc / click backdrop / click image → it animates back to where it sat; focus returns to the
trigger. One lightbox open at a time.

**Not** built (YAGNI): prev/next gallery between images, pinch/pan inside the lightbox, and the
bottom `cover` shot (a separate `CaseStudyCover` / `next/image` component — body figures only).

## Interaction

- **Trigger:** each figure's image is wrapped in a real `<button>` (accessible name from the
  image `alt`; a generic fallback label when `alt` is empty). Hover → `cursor: zoom-in` plus a
  subtle enlarge cue (a small corner glyph fading in; stark, no persistent chrome).
- **Open:** measure the trigger's `getBoundingClientRect()`; render the lightbox image at its
  full-viewport target (`object-fit: contain`, ~90vw × 90vh); FLIP — start transformed to the
  origin rect, then transition to identity so it animates origin → target. Backdrop fades in.
- **Close:** reverse the FLIP (target → origin), fade the backdrop, then unmount. Triggered by
  Esc, a click on the backdrop, or a click on the image.
- **Curve / duration:** `cubic-bezier(.2,.8,.2,1)` (spec §11 overlay curve), ~0.45s. Tunable.
- **Reduced motion** (`useReducedMotionPref()`): no FLIP scale — the lightbox cross-fades in
  centred at final size and fades out. Never a transform-based zoom.

## Architecture

Three pieces, all under `src/components/mdx/`:

1. **`ZoomableImage` (client, `"use client"`)** — the interactive `<button><img/></button>`
   trigger. Renders the image (same lazy `<img>` MdxImage uses today), owns local open state
   and the origin-rect measurement, and renders the `Lightbox` (via portal) only while open.
   `MdxImage` (server component) renders `<figure>` with `ZoomableImage` inside + the existing
   `<figcaption>`. Keeping the trigger a small client leaf means `MdxImage`, `Breakout`, and
   `Pin` stay server components.
2. **`Lightbox` (client)** — the portalled full-viewport overlay: backdrop + centred image +
   caption + a close control. Owns the FLIP animation. One open at a time (local state on the
   active `ZoomableImage`; opening is a plain click, and only one image is clicked at a time).
3. **`useOverlayLock` (hook)** — the shared accessible-overlay behavior, extracted from
   `CaseStudyModal` (which currently inlines it) so there is **one** copy, not two divergent
   ones. See below.

### `useOverlayLock` — the shared overlay hook

`CaseStudyModal` already implements, correctly, the exact behavior a lightbox needs: stop Lenis,
inert every other `<body>` child, capture-then-restore focus, Esc-to-close, and a Tab trap.
Rather than copy ~50 lines of subtle a11y logic into the lightbox (where it would drift),
**extract it into `useOverlayLock({ containerRef, onDismiss, active })`** and use it in both.

The hook, on activate:
- `getLenis()` and stop it **only if it wasn't already stopped**, remembering the prior state;
- capture `document.activeElement` as the return target *before* inerting;
- set `inert` on every `<body>` child except `containerRef`, **saving each element's prior
  `inert` value**;
- move focus into the container; bind Esc → `onDismiss` and a Tab trap within the container.

On deactivate/cleanup, it **restores** each element's prior `inert` and the prior Lenis state,
and returns focus. Save/restore (not unconditional `false`/`start`) is the one behavioral change
from the modal's current code, and it is **required for nesting**: the lightbox opens *over* the
already-open modal, which has itself inerted the page and stopped Lenis. Blindly un-inerting and
restarting Lenis on lightbox-close would wrongly re-enable the frozen page beneath the still-open
modal. Restoring prior state is a no-op for the modal used alone (prior state = not inert / not
stopped) and correct when nested — so retrofitting the modal onto the hook does not change its
standalone behavior, and the modal's existing tests (`case-study-modal.test.tsx`) guard that.

The modal keeps its own surface-specific bits (the slide transform, `router.back()` on close,
`data-lenis-prevent` scroller, close pill); only the lock/a11y concern moves into the hook.

## Both surfaces

- **Full page:** Lenis smooth-scrolls the window; the hook stops it on open, restores on close.
- **Modal:** Lenis is already stopped by the modal, and the sheet scrolls via its native
  `.scroller`. The lightbox portals to `<body>` at a z-index **above** the sheet (sheet is
  `z-index: 90`; lightbox sits higher), and inerting body children makes the sheet itself inert
  for the duration — so focus is trapped in the lightbox and the sheet can't be interacted with.
  The overlay is a full-viewport fixed layer with `overscroll-behavior: contain` and no
  scrollable content, so wheel/touch over it scrolls nothing on either surface.

## Accessibility

- Trigger is a `<button>` — keyboard-activatable (Enter/Space), in tab order, accessible name
  from `alt`.
- Overlay is `role="dialog"` `aria-modal="true"`, labelled by the image's alt/caption; focus
  moves in on open, is trapped (via the hook), and returns to the trigger on close; Esc closes.
- Reachability (CLAUDE.md): verify with `elementFromPoint` that the trigger and the close
  control are actually hittable in both surfaces and themes — not merely present in the DOM.

## Content strings (§14)

All UI copy lives in `siteContent.work` (`site-content.ts`), never JSX — alongside the existing
`detailShotCaption` / `detailCloseLabel`:
- a close-control label for the lightbox (e.g. `lightboxCloseLabel`);
- the enlarge affordance's accessible verb / fallback name (e.g. `zoomActionLabel`), composed
  with the per-image `alt` from MDX for the button's accessible name.
Exact wording is Jono's; the spec only fixes *where* the strings live.

## Testing & verification

- **Unit** (`zoomable-image.test.tsx`, `lightbox.test.tsx`, `use-overlay-lock.test.ts`):
  ZoomableImage renders a button wrapping the image and opens the lightbox on activate; Lightbox
  renders `role="dialog"`/`aria-modal` with the image + caption and calls `onDismiss` on Esc /
  backdrop click; the hook inerts siblings and **restores prior inert state** (assert a
  pre-inerted sibling stays inert after cleanup — the nesting case), stops/restores Lenis via a
  mocked `getLenis`, and returns focus. Keep `case-study-modal.test.tsx` green through the
  retrofit.
- **Visual (non-negotiable, CLAUDE.md):** render the pixels in **both themes** and **both
  surfaces** (page + modal). Confirm: the zoom animates from the clicked image's position; the
  enlarged image is crisp and fits the viewport; backdrop reads stark; Esc / backdrop / image
  click all close and return focus; reduced-motion path fades without scaling; no scroll leaks
  behind the overlay; and — the nesting case — opening then closing the lightbox **inside** the
  modal leaves the modal fully interactive and the page still frozen behind it.

## Build order (high level)

1. Extract `useOverlayLock` from `CaseStudyModal` with save/restore semantics; retrofit the
   modal onto it; keep its tests green. (Enabling refactor; no behavior change standalone.)
2. `Lightbox` overlay component + styles (backdrop, centred image, close control, FLIP, reduced
   motion), using the hook.
3. `ZoomableImage` client trigger (button + zoom-in affordance + origin-rect + open state);
   render it inside `MdxImage`; add the `site-content.ts` strings.
4. Tests; full `pnpm build` + `pnpm test`; visual sweep across both themes and both surfaces,
   including the nested (in-modal) case.

## Open / deferred

- **Backdrop exact treatment** (solid theme canvas vs. a whisker translucent) and **zoom
  duration / max size** — land sensible defaults, tune by eye.
- **Enlarge cue** — corner glyph vs. cursor-only; decide on pixels.
- **Cover shot + gallery navigation** — deferred; body figures, single-image zoom only.
