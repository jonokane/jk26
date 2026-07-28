# Case-study image zoom (click-to-zoom lightbox) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Click any case-study body figure to zoom it from its on-screen spot up to a full-viewport lightbox, dismissable with Esc / backdrop / image click.

**Architecture:** A client `ZoomableImage` trigger (used inside the still-server `MdxImage`) opens a portalled `Lightbox` overlay that FLIP-animates from the image's rect to full-viewport. The overlay's accessible-modal behavior (stop Lenis, inert background, focus trap, Esc) lives in a shared `useOverlayLock` hook, extracted from `CaseStudyModal` and used by both — with save/restore semantics so the lightbox nests correctly over the already-open modal.

**Tech Stack:** Next.js 16 / React 19, TypeScript, Tailwind-v4 CSS-modules, MDX via Velite, Lenis 1.3.25, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-07-28-case-study-image-zoom-design.md`

## Global Constraints

- **pnpm only.** No new dependencies. Verify before committing: `pnpm build` AND `pnpm test` (script is `vitest run` — use `pnpm test` / `pnpm test <path>`, never `pnpm test run`).
- **One RAF loop / one scroll owner** (CLAUDE.md): use the existing `getLenis()` from `@/components/smooth-scroll` to stop/start Lenis. Do not add a second RAF loop or a new Lenis instance.
- **Reuse, don't duplicate:** the accessible-overlay logic exists once, in `useOverlayLock`. `CaseStudyModal` and `Lightbox` both consume it.
- **Save/restore, not reset:** the hook restores each element's *prior* `inert` and Lenis's *prior* `isStopped`, never unconditional `false`/`start()` — required so a lightbox opened inside the modal doesn't un-freeze the page on close.
- **Content never in JSX** (§14): all UI strings live in `siteContent.work` (`src/lib/site-content.ts`).
- **Reduced motion** (`useReducedMotionPref()`): no FLIP scale — cross-fade only.
- **Accessibility:** trigger is a real `<button>`; overlay is `role="dialog" aria-modal="true"`, focus-trapped, Esc-dismissable, focus returns to trigger.
- **Never `git add -A`** — stage only each task's named files.
- **Verify pixels, not JSX** (CLAUDE.md): both themes, both surfaces, incl. the nested-in-modal case. Confirm the dev server postdates your last commit.

---

## File Structure

- `src/lib/use-overlay-lock.ts` — **create.** Shared accessible-overlay lock hook.
- `src/lib/use-overlay-lock.test.ts` — **create.** Hook tests (inert save/restore, Lenis, Esc).
- `src/components/mdx/lightbox.tsx` — **create.** The portalled overlay + FLIP.
- `src/components/mdx/lightbox.module.css` — **create.**
- `src/components/mdx/lightbox.test.tsx` — **create.**
- `src/components/mdx/zoomable-image.tsx` — **create.** The `<button><img></button>` trigger.
- `src/components/mdx/zoomable-image.module.css` — **create.**
- `src/components/mdx/zoomable-image.test.tsx` — **create.**
- `src/components/mdx/figure.tsx` — **modify.** Render `ZoomableImage` inside the figure.
- `src/lib/site-content.ts` — **modify.** Add `lightboxCloseLabel`, `zoomActionLabel`.
- `src/components/work/case-study-modal.tsx` — **modify.** Retrofit onto `useOverlayLock`.

---

## Task 1: `useOverlayLock` — the shared overlay lock hook

**Files:**
- Create: `src/lib/use-overlay-lock.ts`
- Test: `src/lib/use-overlay-lock.test.ts`

**Interfaces:**
- Consumes: `getLenis` from `@/components/smooth-scroll`.
- Produces: `useOverlayLock({ containerRef, onDismiss }: { containerRef: RefObject<HTMLElement | null>; onDismiss: () => void }): void`. On mount it stops Lenis (if not already stopped), inerts every other `<body>` child (saving prior state), moves focus into the container, and binds Esc→onDismiss + a Tab trap; on unmount it restores prior inert, prior Lenis state, and focus.

- [ ] **Step 1: Write the failing test.** Create `src/lib/use-overlay-lock.test.ts`:
```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useOverlayLock } from "@/lib/use-overlay-lock";

const lenis = { isStopped: false, stop: vi.fn(), start: vi.fn() };
vi.mock("@/components/smooth-scroll", () => ({ getLenis: () => lenis }));

function Harness({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlayLock({ containerRef: ref, onDismiss });
  return (
    <div ref={ref} tabIndex={-1} data-testid="overlay">
      <button>inside</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  lenis.isStopped = false;
  lenis.stop.mockClear();
  lenis.start.mockClear();
  document.body.querySelectorAll("[data-sib]").forEach((n) => n.remove());
});

describe("useOverlayLock", () => {
  it("stops Lenis on open and starts it on close when it wasn't already stopped", () => {
    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(lenis.stop).toHaveBeenCalledTimes(1);
    unmount();
    expect(lenis.start).toHaveBeenCalledTimes(1);
  });

  it("does NOT restart Lenis if it was already stopped (nesting)", () => {
    lenis.isStopped = true;
    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(lenis.stop).not.toHaveBeenCalled();
    unmount();
    expect(lenis.start).not.toHaveBeenCalled();
  });

  it("inerts other body children and restores their PRIOR inert state", () => {
    const normal = document.body.appendChild(document.createElement("div"));
    normal.setAttribute("data-sib", "");
    const already = document.body.appendChild(document.createElement("div"));
    already.setAttribute("data-sib", "");
    already.inert = true;

    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(normal.inert).toBe(true);
    expect(already.inert).toBe(true);

    unmount();
    expect(normal.inert).toBe(false); // restored to prior (false)
    expect(already.inert).toBe(true); // restored to prior (true) — not clobbered
  });

  it("calls onDismiss on Escape", () => {
    const onDismiss = vi.fn();
    render(<Harness onDismiss={onDismiss} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm test src/lib/use-overlay-lock.test.ts`
Expected: FAIL — cannot resolve `@/lib/use-overlay-lock`.

- [ ] **Step 3: Create the hook.** Create `src/lib/use-overlay-lock.ts`:
```tsx
"use client";

import { useEffect, useRef, type RefObject } from "react";
import { getLenis } from "@/components/smooth-scroll";

/**
 * Shared accessible-overlay lock (spec: 2026-07-28 image zoom). Both the
 * case-study modal and the image lightbox need the same behavior while open:
 * stop Lenis, inert the rest of the page, trap focus, close on Escape, restore
 * on unmount. Extracted here so there is one copy, not two.
 *
 * Save/restore (not unconditional reset) is deliberate: the lightbox opens OVER
 * the already-open modal, which has itself stopped Lenis and inerted the page.
 * Restoring each element's PRIOR inert value and Lenis's PRIOR stopped state
 * means closing the inner overlay never re-enables the frozen page beneath the
 * outer one. Used alone, the prior state is "not inert / not stopped", so the
 * behavior is unchanged.
 */
export function useOverlayLock({
  containerRef,
  onDismiss,
}: {
  containerRef: RefObject<HTMLElement | null>;
  onDismiss: () => void;
}) {
  // Keep the latest onDismiss without re-binding the key handler.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lenis = getLenis();
    const lenisWasStopped = lenis?.isStopped ?? false;
    if (!lenisWasStopped) lenis?.stop();

    // Capture the return target BEFORE inerting: the trigger may live in the
    // background we're about to inert, and an engine that blurs inert elements
    // synchronously would otherwise capture <body>.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const siblings = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== container && !el.contains(container),
    );
    const priorInert = siblings.map((el) => el.inert);
    siblings.forEach((el) => (el.inert = true));

    container.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      siblings.forEach((el, i) => (el.inert = priorInert[i]));
      if (!lenisWasStopped) lenis?.start();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [containerRef]);
}
```

- [ ] **Step 4: Run the test to verify it passes.**

Run: `pnpm test src/lib/use-overlay-lock.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**
```bash
git add src/lib/use-overlay-lock.ts src/lib/use-overlay-lock.test.ts
git commit -m "feat(lib): useOverlayLock — shared accessible-overlay lock

Stop-Lenis + inert-background + focus-trap + Esc, with save/restore of prior
inert and Lenis state so overlays nest correctly. Basis for the image
lightbox and (next) the case-study modal."
```

---

## Task 2: `Lightbox` — the portalled full-viewport overlay

**Files:**
- Create: `src/components/mdx/lightbox.tsx`
- Create: `src/components/mdx/lightbox.module.css`
- Test: `src/components/mdx/lightbox.test.tsx`
- Modify: `src/lib/site-content.ts`

**Interfaces:**
- Consumes: `useOverlayLock` (Task 1); `useReducedMotionPref` from `@/lib/use-reduced-motion`; `siteContent` from `@/lib/site-content`.
- Produces: `type LightboxOrigin = { top: number; left: number; width: number; height: number }` and `Lightbox({ src, alt, caption, origin, onClose }: { src: string; alt: string; caption?: string; origin: LightboxOrigin; onClose: () => void })`. Renders a portal to `document.body`; calls `onClose` after its exit animation (immediately under reduced motion).

- [ ] **Step 1: Add the two content strings.** In `src/lib/site-content.ts`, inside the `work: { … }` object, next to `detailCloseLabel`, add:
```ts
    /** The image lightbox's close control (spec 2026-07-28). "✕" is CSS. */
    lightboxCloseLabel: "Close",
    /** Accessible name for a zoomable figure's button, and the fallback when an
     *  image has no alt. Paired with aria-haspopup="dialog" to convey "enlarge". */
    zoomActionLabel: "Enlarge image",
```

- [ ] **Step 2: Write the failing test.** Create `src/components/mdx/lightbox.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Lightbox } from "@/components/mdx/lightbox";

vi.mock("@/components/smooth-scroll", () => ({
  getLenis: () => ({ isStopped: true, stop: vi.fn(), start: vi.fn() }),
}));

const origin = { top: 100, left: 100, width: 200, height: 150 };

afterEach(cleanup);

describe("Lightbox", () => {
  it("renders an accessible dialog with the image and caption", () => {
    render(<Lightbox src="/x.jpg" alt="A screen" caption="The screen" origin={origin} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByAltText("A screen")).toBeTruthy();
    expect(screen.getByText("The screen")).toBeTruthy();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<Lightbox src="/x.jpg" alt="A screen" origin={origin} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    // reduced-motion path (jsdom) dismisses immediately
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<Lightbox src="/x.jpg" alt="A screen" origin={origin} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
```
(jsdom reports zero-size rects, so the component's FLIP guard takes the no-animation path and `onClose` fires synchronously on dismiss — see Step 4's guard.)

- [ ] **Step 3: Create the stylesheet.** Create `src/components/mdx/lightbox.module.css`:
```css
/* Full-viewport image lightbox (spec 2026-07-28). Stark theme-canvas backdrop
   (matching the modal's no-scrim look). The figure FLIP-animates via inline
   transforms set in JS; only the backdrop opacity is driven by data-phase. */
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 100; /* above the case-study sheet (z-index: 90) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8vh 6vw;
  background: var(--canvas);
  opacity: 0;
  transition: opacity 0.45s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.backdrop[data-phase="open"] {
  opacity: 1;
}

.figure {
  margin: 0;
  max-width: 88vw;
  max-height: 84vh;
  transform-origin: top left;
  cursor: zoom-out;
}

.image {
  display: block;
  max-width: 88vw;
  max-height: 78vh;
  width: auto;
  height: auto;
  border: 1px solid var(--hairline);
}

.caption {
  margin-top: 0.7rem;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--mute);
}

.close {
  position: absolute;
  top: 24px;
  right: 6vw;
  z-index: 2;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--ink);
  background: var(--canvas);
  border: 1px solid var(--hairline);
  border-radius: 100px;
  padding: 13px 18px; /* ≥44px touch target */
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease;
}
.close::after {
  content: " ✕";
}
.close:hover {
  color: var(--work);
  border-color: var(--work);
}

@media (prefers-reduced-motion: reduce) {
  .backdrop {
    transition: opacity 0.2s linear;
  }
}
```

- [ ] **Step 4: Create the component.** Create `src/components/mdx/lightbox.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useOverlayLock } from "@/lib/use-overlay-lock";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/lightbox.module.css";

export type LightboxOrigin = { top: number; left: number; width: number; height: number };

const TRANSITION = "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)";

function flipTransform(o: LightboxOrigin, t: DOMRect): string {
  const sx = o.width / t.width;
  const sy = o.height / t.height;
  const tx = o.left - t.left;
  const ty = o.top - t.top;
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
}

/**
 * The zoomed image (spec: 2026-07-28 image zoom). FLIP-animates from the
 * clicked image's rect (`origin`) up to a full-viewport figure, over a stark
 * canvas backdrop. Esc / backdrop / image click dismiss it — playing the FLIP
 * in reverse, then calling `onClose` (which unmounts us). Reduced motion skips
 * the transform and just cross-fades.
 */
export function Lightbox({
  src,
  alt,
  caption,
  origin,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  origin: LightboxOrigin;
  onClose: () => void;
}) {
  const reduced = useReducedMotionPref();
  const dialogRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const flip = useRef("");
  const [phase, setPhase] = useState<"enter" | "open" | "exit">("enter");

  const dismiss = () => {
    if (phase === "exit") return;
    setPhase("exit");
    const fig = figureRef.current;
    if (reduced || !fig || !flip.current) {
      onClose();
      return;
    }
    fig.style.transition = TRANSITION;
    fig.style.transform = flip.current; // animate back to origin
  };

  useOverlayLock({ containerRef: dialogRef, onDismiss: dismiss });

  // ENTER FLIP: jump to the origin rect without transition, force a reflow so
  // that paints, then release to the natural (full-viewport) position so it
  // animates origin -> target.
  useEffect(() => {
    const fig = figureRef.current;
    if (reduced || !fig) {
      setPhase("open");
      return;
    }
    const target = fig.getBoundingClientRect();
    if (!target.width || !target.height) {
      setPhase("open"); // no measurable target (e.g. jsdom) — skip the FLIP
      return;
    }
    flip.current = flipTransform(origin, target);
    fig.style.transition = "none";
    fig.style.transform = flip.current;
    void fig.offsetWidth; // force reflow
    fig.style.transition = TRANSITION;
    fig.style.transform = "";
    setPhase("open");
  }, [reduced, origin]);

  const onFigureTransitionEnd = (event: React.TransitionEvent) => {
    if (phase === "exit" && event.propertyName === "transform") onClose();
  };

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.backdrop}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={alt || caption || siteContent.work.zoomActionLabel}
      tabIndex={-1}
      onClick={dismiss}
    >
      <button
        type="button"
        className={styles.close}
        aria-label={siteContent.work.lightboxCloseLabel}
        onClick={dismiss}
      >
        {siteContent.work.lightboxCloseLabel}
      </button>
      <figure
        ref={figureRef}
        className={styles.figure}
        onTransitionEnd={onFigureTransitionEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same lazy <img>
            treatment as the on-page figure; no intrinsic size for next/image. */}
        <img src={src} alt={alt} className={styles.image} />
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 5: Run the test to verify it passes.**

Run: `pnpm test src/components/mdx/lightbox.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit.**
```bash
git add src/components/mdx/lightbox.tsx src/components/mdx/lightbox.module.css src/components/mdx/lightbox.test.tsx src/lib/site-content.ts
git commit -m "feat(mdx): Lightbox — full-viewport FLIP zoom overlay

Portalled dialog that animates from an origin rect to a full-viewport image
over a stark canvas backdrop; Esc/backdrop/close dismiss it. Uses
useOverlayLock; reduced motion cross-fades. Strings in site-content."
```

---

## Task 3: `ZoomableImage` trigger + wire into `MdxImage`

**Files:**
- Create: `src/components/mdx/zoomable-image.tsx`
- Create: `src/components/mdx/zoomable-image.module.css`
- Test: `src/components/mdx/zoomable-image.test.tsx`
- Modify: `src/components/mdx/figure.tsx`

**Interfaces:**
- Consumes: `Lightbox`, `LightboxOrigin` (Task 2); `siteContent`.
- Produces: `ZoomableImage({ src, alt, caption, imgClassName }: { src: string; alt: string; caption?: string; imgClassName?: string })` — a `<button>`-wrapped `<img>` that opens the `Lightbox` on activate.

- [ ] **Step 1: Write the failing test.** Create `src/components/mdx/zoomable-image.test.tsx`:
```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { ZoomableImage } from "@/components/mdx/zoomable-image";

vi.mock("@/components/smooth-scroll", () => ({
  getLenis: () => ({ isStopped: true, stop: vi.fn(), start: vi.fn() }),
}));

afterEach(cleanup);

describe("ZoomableImage", () => {
  it("renders a dialog-popup button wrapping the image, named by alt", () => {
    render(<ZoomableImage src="/x.jpg" alt="A screen" />);
    const button = screen.getByRole("button", { name: "A screen" });
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button.querySelector("img")).toBeTruthy();
  });

  it("falls back to the generic label when alt is empty", () => {
    render(<ZoomableImage src="/x.jpg" alt="" />);
    expect(screen.getByRole("button", { name: "Enlarge image" })).toBeTruthy();
  });

  it("opens the lightbox on click", () => {
    render(<ZoomableImage src="/x.jpg" alt="A screen" caption="The screen" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "A screen" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

Run: `pnpm test src/components/mdx/zoomable-image.test.tsx`
Expected: FAIL — cannot resolve `@/components/mdx/zoomable-image`.

- [ ] **Step 3: Create the stylesheet.** Create `src/components/mdx/zoomable-image.module.css`:
```css
/* The zoom trigger (spec 2026-07-28): a reset button wrapping the figure image,
   with a zoom-in cursor and a subtle corner cue on hover/focus. The image's own
   look (hairline frame, width) stays in figure.module.css, passed via className. */
.trigger {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  cursor: zoom-in;
  position: relative;
}

.trigger img {
  display: block;
}

.trigger:focus-visible {
  outline: 2px solid var(--work);
  outline-offset: 3px;
}

/* Corner cue: inverse pill, fades in on hover/keyboard focus. Theme-aware via
   ink/canvas so it reads in both palettes. */
.trigger::after {
  content: "⤢";
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1;
  color: var(--canvas);
  background: var(--ink);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.trigger:hover::after,
.trigger:focus-visible::after {
  opacity: 0.9;
}

@media (prefers-reduced-motion: reduce) {
  .trigger::after {
    transition: none;
  }
}
```

- [ ] **Step 4: Create the component.** Create `src/components/mdx/zoomable-image.tsx`:
```tsx
"use client";

import { useRef, useState } from "react";
import { Lightbox, type LightboxOrigin } from "@/components/mdx/lightbox";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/zoomable-image.module.css";

/**
 * The click-to-zoom trigger (spec: 2026-07-28 image zoom). Wraps a case-study
 * body image in a button; on activate it measures the image's rect and opens
 * the Lightbox, which FLIP-zooms from there. The button carries the accessible
 * name (the image alt, or a generic fallback) + aria-haspopup="dialog"; the
 * inner <img> is decorative (alt="") so the name isn't announced twice.
 */
export function ZoomableImage({
  src,
  alt,
  caption,
  imgClassName,
}: {
  src: string;
  alt: string;
  caption?: string;
  imgClassName?: string;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [origin, setOrigin] = useState<LightboxOrigin | null>(null);

  const open = () => {
    const r = imgRef.current?.getBoundingClientRect();
    if (r) setOrigin({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={alt || siteContent.work.zoomActionLabel}
        aria-haspopup="dialog"
        onClick={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lazy <img>: no
            intrinsic size for next/image. alt="" — the button carries the name. */}
        <img ref={imgRef} src={src} alt="" loading="lazy" decoding="async" className={imgClassName} />
      </button>
      {origin ? (
        <Lightbox src={src} alt={alt} caption={caption} origin={origin} onClose={() => setOrigin(null)} />
      ) : null}
    </>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes.**

Run: `pnpm test src/components/mdx/zoomable-image.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Wire it into `MdxImage`.** In `src/components/mdx/figure.tsx`, replace the raw `<img>` with `ZoomableImage`. Add the import at the top:
```tsx
import { ZoomableImage } from "@/components/mdx/zoomable-image";
import styles from "@/components/mdx/figure.module.css";
```
and replace the `<img …>` line inside the `<figure>` with:
```tsx
      <ZoomableImage src={src} alt={alt ?? ""} caption={title} imgClassName={styles.image} />
```
Leave the surrounding `<figure>` and `<figcaption>` (and the `if (!src) return null` guard) exactly as they are, and drop the now-unused `no-img-element` eslint-disable comment that sat above the old `<img>`.

- [ ] **Step 7: Build and verify the pipeline.**

Run: `pnpm build && pnpm test`
Expected: build succeeds; full suite green (Task 1–3 tests included).

- [ ] **Step 8: Visual check (controller does the pixel pass — implementers skip).** _Left to the controller's browser sweep in Task 5._

- [ ] **Step 9: Commit.**
```bash
git add src/components/mdx/zoomable-image.tsx src/components/mdx/zoomable-image.module.css src/components/mdx/zoomable-image.test.tsx src/components/mdx/figure.tsx
git commit -m "feat(mdx): zoom every case-study figure via ZoomableImage

Wrap the figure image in a dialog-popup button that opens the Lightbox,
FLIP-zooming from the image's spot. Inline, Breakout and Pin all inherit it
through MdxImage. Subtle corner cue + zoom-in cursor; keyboard-accessible."
```

---

## Task 4: Retrofit `CaseStudyModal` onto `useOverlayLock`

**Files:**
- Modify: `src/components/work/case-study-modal.tsx`

**Interfaces:**
- Consumes: `useOverlayLock` (Task 1).
- Produces: no interface change — same rendered modal, one fewer copy of the lock logic.

- [ ] **Step 1: Read the current file and its tests.** Read `src/components/work/case-study-modal.tsx` and `src/components/work/case-study-modal.test.tsx` so you know exactly what behavior must stay green.

- [ ] **Step 2: Replace the inline lock with the hook.** In `case-study-modal.tsx`:
  - Add the import: `import { useOverlayLock } from "@/lib/use-overlay-lock";`
  - Remove the import of `getLenis` (`import { getLenis } from "@/components/smooth-scroll";`) — it's now used only inside the hook.
  - Delete the mount `useEffect` that stopped Lenis, inerted `backgrounded`, and returned the restore cleanup (the block from `const sheet = sheetRef.current;` through its `return () => { … }`), **keeping** the slide reveal. Replace that whole effect with a slide-only effect plus the hook call:
```tsx
  // Slide up on mount. The rAF lets translateY(100%) paint before flipping to 0
  // so the transition runs (setting both in one paint would show no animation).
  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Stop-Lenis + inert-background + focus-trap + Esc live in the shared hook,
  // which also feeds Escape to `close` (reduced-aware via the ref it keeps).
  useOverlayLock({ containerRef: sheetRef, onDismiss: close });
```
  - Delete the separate Esc/Tab `useEffect` (the block `useEffect(() => { const onKey = … }, [reduced]);`) — the hook now owns Escape and the Tab trap.
  - Move the `close` definition **above** the `useOverlayLock` call so it's defined before use (the `close`/`onTransitionEnd` functions stay otherwise unchanged).
  - Leave the JSX, `onTransitionEnd`, `router.back()` semantics, and the close pill untouched.

- [ ] **Step 3: Run the modal tests to verify they stay green.**

Run: `pnpm test src/components/work/case-study-modal.test.tsx`
Expected: PASS — same behavior (focus moves into the sheet, Escape closes, background inert, Lenis stopped) now sourced from the hook. If a test asserts a moved *implementation detail* rather than behavior, adjust that assertion minimally to target the behavior; do not weaken a behavioral assertion.

- [ ] **Step 4: Full build + suite.**

Run: `pnpm build && pnpm test`
Expected: both green.

- [ ] **Step 5: Commit.**
```bash
git add src/components/work/case-study-modal.tsx
git commit -m "refactor(work): case-study modal uses the shared useOverlayLock

Drop the modal's inline stop-Lenis + inert + focus-trap copy in favor of the
shared hook (one source of truth). Behavior unchanged standalone; save/restore
now lets the image lightbox nest over the open modal correctly."
```

---

## Task 5: Final verification

**Files:** none (verification only; commit only if a fix is needed).

- [ ] **Step 1: Clean build + full suite.**

Run: `pnpm build && pnpm test`
Expected: both green.

- [ ] **Step 2: Fresh dev server.** Stop stale `next-server`, start `pnpm dev`, confirm the process postdates your last commit.

- [ ] **Step 3: Visual sweep (both themes, both surfaces).** On `http://localhost:3000/work/collaya`:
  - Hover a figure → zoom-in cursor + corner cue; click → it **zooms from its exact spot** up to full-viewport over a stark backdrop; caption in mono.
  - Esc, backdrop click, and image click each close it, zooming back; focus returns to the clicked image.
  - Do this for an inline, a `<Breakout>`, and a `<Pin>` image; both light and dark.
  - **Nested case:** open the study as the modal (from `/#work`), open the lightbox **inside** it, close the lightbox → the modal is still fully interactive and the page behind it is still frozen; then close the modal normally.
  - Set OS reduced-motion → lightbox cross-fades (no zoom), still closes cleanly.
  - Confirm no scrollbar/scroll leak behind the overlay on either surface.

- [ ] **Step 4:** If any fix was needed, commit it with a focused message and re-run Step 1. Otherwise the feature is complete.

---

## Self-Review

**Spec coverage:**
- Lightbox on all body figures (inline/Breakout/Pin via MdxImage) → Task 3. ✓
- FLIP zoom from origin rect → Task 2 (`flipTransform`, enter/exit). ✓
- Esc / backdrop / image click dismiss → Task 2. ✓
- Shared `useOverlayLock` with save/restore for nesting → Task 1; both consumers Tasks 2/4. ✓
- Reduced motion cross-fade → Task 2 (guarded FLIP + CSS). ✓
- Accessibility (button trigger, dialog/aria-modal, focus trap/return, haspopup) → Tasks 1–3. ✓
- Both surfaces incl. nested-in-modal → verified Task 5 Step 3. ✓
- Strings in site-content (§14) → Task 2 Step 1. ✓
- Cover shot / gallery nav excluded → not built, as intended. ✓

**Placeholder scan:** No TBD/TODO; every code, CSS, and test step is complete. Task 3 Step 8 defers the *visual* check to Task 5 by design (mechanism is TDD'd; pixels are the controller's sweep). ✓

**Type consistency:** `LightboxOrigin` is defined/exported in `lightbox.tsx` and imported by `zoomable-image.tsx`; `useOverlayLock({ containerRef, onDismiss })` signature matches its two call sites (Lightbox, modal); `ZoomableImage`'s `{ src, alt, caption, imgClassName }` matches the `MdxImage` call and the tests. ✓
