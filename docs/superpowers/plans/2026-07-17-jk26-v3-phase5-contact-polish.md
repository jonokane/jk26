# jk26-v3 Phase 5: Contact — restyle + polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Contact section to the stark §12 treatment — a sticky title, a two-column form of transparent bottom-border fields with mono labels, a solid button, and a mono footer — keeping the working Resend logic untouched, and close out Phase 5 with a whole-site polish pass.

**Architecture:** The Contact component's logic (validation, honeypot, spam gate, status states, the Resend `fetch`) is already built and correct and **must not be re-plumbed** (spec §12). Phase 5 is presentation only: replace `contact.module.css` wholesale (the current one references `--scrim`/`--sub`/`--card-border`, all removed with the Cold Noon palette — it styles against nothing), swap the parked classes (`on-scrim`, `slab`, `heading-display`, `pill`) out of the markup, restructure the fields into a 2-col grid, and add the footer.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (CSS-first), CSS Modules, Velite, Vitest + Testing Library, pnpm. The Resend route (`src/app/api/contact/route.ts`) and its test are untouched.

## Global Constraints

Every task implicitly includes all of these. Values are binding, copied from the spec/CLAUDE.md.

- **Content never lives in JSX** (spec §14/§15). Every visible string — labels, the footer link text, the button — lives in `src/lib/site-content.ts`. Editing copy must not touch a component.
- **Design decisions live in CSS**, using the palette tokens. **Nothing computed in the palettes**; `globals.css.test.ts` fails on `color-mix`/`oklch`/`calc` in a palette. Do **not** add a color to the palettes — every token needed exists (below).
- **Theme-aware, two locked palettes.** Use tokens, never literal hexes, for anything that must flip with the theme. The button's solid `--contact` fill takes `--canvas` text — verified to contrast in both themes (white on `#2f7d8f` light, black on `#5ab6cb` dark).
- **There is no clock; nothing time-of-day derived.**
- **Respect `prefers-reduced-motion`** for anything substantial; the form's only motion is the button's `translateY(-2px)` hover, which is fine, but do not add scroll-motion here.
- **Do not touch `src/app/api/contact/route.ts` or its test** (spec §12: "Restyle; do not re-plumb"). Do not change the component's submit/validation/honeypot LOGIC — only its markup classes, structure, and the footer.
- pnpm only; `pnpm test` is non-watch (never `pnpm test run`). Every render-based test needs `afterEach(cleanup)` (vitest has no globals here).
- Never `git add -A`. `content/work/collaya.mdx` and any other file the owner is editing are off-limits — stage only what each task changes.
- Run `pnpm build` **and** `pnpm test` before every commit.

### Palette tokens (exist — use these, add none)
`--canvas` (#fff / #000) · `--ink` (#0d0d0d / #f2f2f2) · `--mute` (#9a9a9a / #7d7d7d) · `--hairline` (#e6e6e6 / #1c1c1c) · `--contact` (#2f7d8f / #5ab6cb) · `--font-mono` (config-mono-vf) · `--header-h` (the header's live measured height on `<html>`, from `use-header-height`).

### The prototype's §12 values (source of truth, from `docs/notes/jk26-v3-handoff/prototypes/Portfolio v2.dc.html`)
- Section: `min-height:100vh; padding:16vh 6vw 10vh; display:flex; flex-direction:column`.
- Title `h2`: `position:sticky; top:84px; z-index:20; background:<canvas>; padding:6px 0; color:<contact>`, at the shared section-title size `clamp(2.6rem,7vw,6.5rem)` wght 700, `letter-spacing:-0.02em`, `line-height:1`.
- Lead: `max-width:34ch; margin-top:26px; clamp(1.05rem,1.6vw,1.4rem); line-height:1.45`.
- Form: `margin-top:7vh; grid 1fr 1fr; gap:26px 40px; max-width:900px`. Message field spans both columns.
- Label: `font-size:12px; letter-spacing:0.22em; text-transform:uppercase`, mono, `--mute`.
- Input/textarea: `font:inherit; font-size:1.1rem; color:<ink>; background:transparent; border:none; border-bottom:1px solid <hairline>; padding:10px 2px; outline:none; resize:none`; focus → `border-color:<contact>`.
- Button: `grid-column:1/-1; justify-self:start; margin-top:10px; font-size:1rem; wght 560; letter-spacing:0.02em; color:<canvas>; background:<contact>; border:none; border-radius:2px; padding:16px 40px`; hover `translateY(-2px); opacity:0.92`.
- Footer: `margin-top:12vh; display:flex; flex-wrap:wrap; gap:28px; align-items:center`, mono `14px`, `--mute`; links `border-bottom:1px solid transparent` → `color`+`border-color` `--contact` on hover.

---

## Task 1: Contact copy and footer links in site-content

**Files:**
- Modify: `src/lib/site-content.ts` (the `contact` block, ~lines 90-110)

**Interfaces:**
- Produces: `siteContent.contact.footerLinks` — an ordered `readonly { label: string; key: "linkedin" | "collaya" | "resume" }[]`; `siteContent.contact.emailLabel` unchanged usage; existing `siteContent.contact.{lede,fields,submit,sending,success,error,validation}` unchanged; `siteContent.links.{email,linkedin,collaya,resume}` unchanged.

- [ ] **Step 1: Add the footer links to the `contact` block**

In `src/lib/site-content.ts`, inside the `contact: { … }` object (which already holds `lede`, `fields`, `submit`, `sending`, `success`, `error`, `validation`), add:

```ts
    /** The footer's links, in order. `resume` is hidden while links.resume is
     *  empty — the same rule the About CTA follows. The email is links.email,
     *  rendered as a mailto. Read.cv (the prototype's third link) is dropped:
     *  the service was sunset in 2024 and is not in `links`. */
    footerLinks: [
      { label: "LinkedIn", key: "linkedin" },
      { label: "Collaya", key: "collaya" },
      { label: "Résumé", key: "resume" },
    ],
```

(Keep it inside `contact`, alongside `lede`. Do not touch `siteContent.links` — the hrefs already live there.)

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm build`
Expected: clean. `site-content.ts` is `as const`, so a typo in a key is a compile error where the component reads it (Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/lib/site-content.ts
git commit
```
Message: the contact footer's links land in content; why Read.cv is dropped and Résumé is conditional.

---

## Task 2: Restyle the Contact section

**Files:**
- Replace: `src/components/contact/contact.module.css`
- Modify: `src/components/contact/contact.tsx` (markup + classes + footer; **not** the submit/validation/honeypot logic)
- Test: `src/components/contact/contact.test.tsx` (create)

**Interfaces:**
- Consumes: `siteContent.contact.*`, `siteContent.links.*` from Task 1.
- Produces: `<Contact />` — the `#contact` landmark, unchanged id/aria.

- [ ] **Step 1: Write the failing test**

Create `src/components/contact/contact.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { siteContent } from "@/lib/site-content";

/* The route is not called in these tests — they cover the restyle's structure
   and the footer, not the submit logic (which the API route's own test covers). */
afterEach(cleanup);

const { Contact } = await import("@/components/contact/contact");

describe("Contact", () => {
  it("names the landmark and renders the sticky section title", () => {
    const { container } = render(<Contact />);
    const section = container.querySelector("section");
    expect(section?.getAttribute("id")).toBe("contact");
    expect(section?.getAttribute("aria-labelledby")).toBe("contact-title");
    expect(screen.getByRole("heading", { name: siteContent.titles.contact })).toBeTruthy();
  });

  it("renders the three labeled fields and the submit", () => {
    render(<Contact />);
    expect(screen.getByLabelText(siteContent.contact.fields.name)).toBeTruthy();
    expect(screen.getByLabelText(siteContent.contact.fields.email)).toBeTruthy();
    expect(screen.getByLabelText(siteContent.contact.fields.message)).toBeTruthy();
    expect(screen.getByRole("button", { name: siteContent.contact.submit })).toBeTruthy();
  });

  it("renders the footer: a mailto and the links that have a URL", () => {
    const { container } = render(<Contact />);
    const footer = container.querySelector("[data-contact-footer]");
    expect(footer).toBeTruthy();
    const scope = within(footer as HTMLElement);
    // email as a mailto
    expect(scope.getByRole("link", { name: siteContent.links.email }).getAttribute("href")).toBe(
      `mailto:${siteContent.links.email}`,
    );
    // LinkedIn and Collaya have URLs -> rendered
    expect(scope.getByRole("link", { name: "LinkedIn" }).getAttribute("href")).toBe(
      siteContent.links.linkedin,
    );
    expect(scope.getByRole("link", { name: "Collaya" }).getAttribute("href")).toBe(
      siteContent.links.collaya,
    );
  });

  /* Résumé has no URL yet (links.resume === ""), so it must not render — the
     same rule the About CTA follows. This asserts the CONDITIONAL, which is the
     thing most likely to regress. */
  it("hides a footer link whose URL is empty", () => {
    expect(siteContent.links.resume).toBe(""); // guard: this test's premise
    render(<Contact />);
    expect(screen.queryByRole("link", { name: "Résumé" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm test src/components/contact/contact.test.tsx`
Expected: FAIL — no `[data-contact-footer]` exists yet, and the heading name may differ.

- [ ] **Step 3: Replace the CSS**

Replace `src/components/contact/contact.module.css` **entirely** with:

```css
/* Contact (spec §12): the stark treatment. Replaces the parked Cold Noon
   "frosted slab", whose tokens (--scrim, --sub, --card-border) were removed with
   that palette and had been resolving to nothing — the form styled against air. */

.section {
  min-height: 100vh;
  padding: 16vh 6vw 10vh;
  display: flex;
  flex-direction: column;
}

/* Sticky, so the section name holds while the form scrolls under it. Its own
   canvas background covers the fields as they pass; `top` clears the nav pill
   via its live measured height. z-index below the nav (10) but above the form. */
.title {
  position: sticky;
  top: var(--header-h, 84px);
  z-index: 5;
  align-self: flex-start;
  background: var(--canvas);
  padding: 6px 0;
  font-size: clamp(2.6rem, 7vw, 6.5rem);
  font-variation-settings: "wght" 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--contact);
}

.lede {
  max-width: 34ch;
  margin-top: 26px;
  font-size: clamp(1.05rem, 1.6vw, 1.4rem);
  line-height: 1.45;
  color: var(--ink);
}

.form {
  margin-top: 7vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 26px 40px;
  max-width: 900px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* The message, the honeypot's box, the button, and the status region all span
   both columns. */
.fieldFull {
  grid-column: 1 / -1;
}

.label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--mute);
}

.input,
.textarea {
  font: inherit;
  font-size: 1.1rem;
  color: var(--ink);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--hairline);
  padding: 10px 2px;
  outline: none;
  transition: border-color 0.3s ease;
}

.textarea {
  resize: none;
}

.input:focus,
.textarea:focus {
  border-color: var(--contact);
}

/* No error hue in the token set — an invalid field is marked by a heavier,
   accent border, distinct from the 1px hairline. Focus (also --contact) and
   invalid can coexist: the field is simply accented while it needs attention. */
.input[aria-invalid="true"],
.textarea[aria-invalid="true"] {
  border-bottom-width: 2px;
  border-bottom-color: var(--contact);
}

.fieldError {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--contact);
}

/* Honeypot: genuinely off-screen (never display:none, which spam bots skip),
   plus aria-hidden + tabIndex={-1} on the input, so sighted, keyboard, and
   screen-reader users never meet it. */
.honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  left: -9999px;
}

.submit {
  grid-column: 1 / -1;
  justify-self: start;
  margin-top: 10px;
  font: inherit;
  font-size: 1rem;
  font-variation-settings: "wght" 560;
  letter-spacing: 0.02em;
  color: var(--canvas);
  background: var(--contact);
  border: none;
  border-radius: 2px;
  padding: 16px 40px;
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1),
    opacity 0.3s ease;
}

.submit:hover {
  transform: translateY(-2px);
  opacity: 0.92;
}

.submit:disabled {
  cursor: progress;
  opacity: 0.7;
  transform: none;
}

.statusRegion {
  grid-column: 1 / -1;
  min-height: 1.5rem;
}

.sending,
.success,
.errorMessage {
  margin: 0;
  font-size: 0.95rem;
  color: var(--ink);
}

.errorMessage a {
  color: var(--contact);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer {
  margin-top: 12vh;
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--mute);
}

.footer a {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition:
    color 0.3s ease,
    border-color 0.3s ease;
}

.footer a:hover {
  color: var(--contact);
  border-color: var(--contact);
}

/* One column when the two do not fit. */
@media (max-width: 640px) {
  .form {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Update the component markup**

In `src/components/contact/contact.tsx`, change **only** the JSX (keep every bit of the submit/validation/honeypot/status LOGIC exactly as it is). The specific edits:

1. The `<section>`: drop the parked classes, keep the id/aria:
```tsx
    <section id="contact" aria-labelledby="contact-title" className={styles.section}>
```
(Remove the `.inner` wrapper `<div>` and its closing tag — the section is the flex column now. The title, lede, form, and footer are its direct children.)

2. The title: drop `heading-display`:
```tsx
      <h2 id="contact-title" className={styles.title}>
        {siteContent.titles.contact}
      </h2>
      <p className={styles.lede}>{siteContent.contact.lede}</p>
```

3. The form: drop `slab`; keep `noValidate onSubmit={handleSubmit}`:
```tsx
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
```

4. The message field's wrapper takes the full-width class:
```tsx
          <div className={`${styles.field} ${styles.fieldFull}`}>
```
(name and email fields keep `className={styles.field}`.)

5. The honeypot wrapper and the status region span both columns — add `fieldFull`:
```tsx
          <div className={`${styles.honeypot} ${styles.fieldFull}`} aria-hidden="true">
```
```tsx
          <div role="status" aria-live="polite" className={`${styles.statusRegion} ${styles.fieldFull}`}>
```

6. The submit: drop `pill`:
```tsx
          <button
            type="submit"
            className={styles.submit}
            disabled={sending}
            aria-busy={sending || undefined}
          >
```

7. **Add the footer** as the last child of the `<section>` (after the `</form>`):
```tsx
        <div className={styles.footer} data-contact-footer>
          <a href={`mailto:${siteContent.links.email}`}>{siteContent.links.email}</a>
          {siteContent.contact.footerLinks.map((link) => {
            const href = siteContent.links[link.key];
            /* A link with no URL is not rendered — the About CTA's rule. Résumé
               waits on links.resume. */
            if (!href) return null;
            return (
              <a key={link.key} href={href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            );
          })}
        </div>
```

Confirm nothing still references `styles.inner` (it is gone): `grep -n "styles.inner" src/components/contact/contact.tsx` → no output.

- [ ] **Step 5: Run the tests**

Run: `pnpm test src/components/contact/contact.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 6: Prove the conditional-link test can fail**

Temporarily set `resume: "https://example.com/cv.pdf"` in `siteContent.links`. Expected: *"hides a footer link whose URL is empty"* fails (Résumé now renders, and the premise-guard `expect(...).toBe("")` also fails). Restore `resume: ""`. Report both outputs. This proves the conditional is really tested.

- [ ] **Step 7: Verify in a browser, both themes**

Kill any stale server (`lsof -ti:3000 -sTCP:LISTEN | xargs kill -9`), start `pnpm dev`, confirm its start time postdates your edits. Then:

1. Scroll to `#contact` in **light** and **dark**. Screenshot each. Confirm: title in `--contact`, sticky as you scroll the form under it; labels mono/uppercase/muted; inputs are transparent with a single bottom border that turns `--contact` on focus; the button is solid `--contact` with readable text in BOTH themes (this is the one to check — white on teal light, black on teal dark); the footer shows the email + LinkedIn + Collaya (no Résumé).
2. Focus each input — the bottom border must go `--contact` and the focus be visible.
3. Submit empty — the inline field errors + native bubble appear in our copy (logic unchanged; just confirm the restyle did not break it). Do NOT actually send a message (no Resend key in dev).
4. `document.documentElement.scrollWidth <= innerWidth` — no horizontal page scroll.

Report the measurements and say you looked at the screenshots.

- [ ] **Step 8: Commit**

```bash
pnpm test && pnpm build && pnpm lint
git add src/components/contact/contact.module.css src/components/contact/contact.tsx src/components/contact/contact.test.tsx
git commit
```
Message: the Contact restyle — what it replaced (dead-token frosted slab) and what stayed (all the logic).

---

## Task 3: Whole-phase review + final polish pass

**Files:** whatever the review surfaces.

- [ ] **Step 1: Confirm no parked-design residue remains in the live path**

```bash
# The dead Cold Noon tokens must appear nowhere in src/ any more:
grep -rn "\-\-scrim\|\-\-sub\b\|\-\-card-border\|\-\-card-bg" src/
# on-scrim was contact-only; confirm it is now unused (safe to leave the class def, but flag if a live component still uses it):
grep -rn "on-scrim" src/components
```
Expected: the first returns nothing in a live-rendered file (a comment mention is fine; a `var(--sub)` in a rendered rule is not). If `on-scrim`/`slab`/`heading-display` are now unused by any rendered component, note them for the reviewer — do not mass-delete global classes in this task (the case-study detail surface at `/work/[slug]` may still use `slab`/`heading-display`; verify before removing anything).

- [ ] **Step 2: Look at the whole site, both themes**

Fresh `pnpm dev`. Scroll the one-pager top to bottom — Welcome → About → Work → Contact — in light and dark. Screenshot each section in each theme. Confirm nothing regressed and the four sections read as one coherent language (the three section titles share size/weight; each section's accent is its own; the Contact restyle sits with the rest). Report what you saw.

- [ ] **Step 3: Dispatch the whole-phase review**

Build the package (`scripts/review-package <phase-5-base> HEAD`) and dispatch a reviewer (opus) with the §12 constraints and the "restyle, don't re-plumb" rule. The review must confirm: the Resend logic is untouched; no dead token or literal color slipped in; the button contrasts in both themes; the footer's conditional link is correct; content stays out of JSX.

- [ ] **Step 4: Fix what the review finds, then finish the branch**

Dispatch one fix subagent for any Critical/Important findings (batched), re-review, then Phase 5 is complete.

---

## Self-Review

**Spec §12 coverage:**

| §12 requirement | Task |
|---|---|
| `min-height:100vh`, 6vw gutter, 16vh/10vh padding | 2 (CSS `.section`) |
| Sticky `h2` "Let's talk." at `top:84px` in `--contact` | 2 (`.title`, `--header-h`) |
| Lead `max-width:34ch` | 2 (`.lede`) |
| Form 2-col grid `gap:26px 40px` `max-width:900px`; full-width fields span both | 2 (`.form`, `.fieldFull` on message/honeypot/status/button) |
| Inputs transparent, bottom-border only → `--contact` on focus | 2 (`.input`/`.textarea`) |
| Mono uppercase labels | 2 (`.label`) |
| Button solid `--contact`, `--canvas` text, radius 2px, wght 560, `16px 40px`, hover `translateY(-2px)` | 2 (`.submit`) |
| Footer: mono email + LinkedIn / Collaya / Résumé, underline-on-hover in `--contact` | 1 (content) + 2 (`.footer`) |
| Résumé hidden until URL | 1 + 2 (conditional render, tested) |
| Take the prototype's styling, keep the logic (don't re-plumb) | 2 (logic untouched — only JSX classes/structure + footer change) |
| Route + test untouched | Global constraint |

**Placeholder scan:** clean — every code step carries complete code; every verification names the command and expected result.

**Type consistency:** `footerLinks` keys (`linkedin`/`collaya`/`resume`) match `siteContent.links` keys exactly, so `siteContent.links[link.key]` type-checks against the `as const` object. `.fieldFull`, `.footer`, `data-contact-footer` are used consistently across Task 2's CSS, component, and test.
