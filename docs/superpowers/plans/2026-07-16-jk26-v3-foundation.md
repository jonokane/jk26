# jk26-v3 Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Park Cold Noon behind an archive tag and leave `jk26-v3` rendering every real word of the site in Mae Variable on a stark white/black canvas, with a working light/dark theme, and the entire time-of-day system gone.

**Architecture:** Branch v3 off `main` (which already holds every reuse target and none of the Cold Noon extras). Strip the scene system, the parked wordmark engines, the collector and the shelf down to a compiling type-only shell. Then land the new foundation bottom-up: three faces → two hand-authored palettes → a pure theme-resolution engine → a pre-hydration script pinned to that engine → provider + nav toggle.

**Tech Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (CSS-first, `@theme` in `globals.css`) · Velite (MDX) · GSAP + Lenis · Vitest + Testing Library · pnpm.

**Spec:** `docs/superpowers/specs/2026-07-16-stark-visual-language-design.md`

## Global Constraints

- **pnpm only.** Never `npm`/`yarn` — npm would write a competing `package-lock.json` and a flat `node_modules`, defeating pnpm's phantom-dependency protection.
- **No new dependencies in this phase.** Everything needed is installed.
- **`pnpm build` must pass before every commit.** It runs Velite first, so it is what catches content-schema and type errors.
- **Content never lives in JSX.** Every visitor-facing string comes from `src/lib/site-content.ts` or MDX. Accessible names are copy too.
- **No em-dashes in visitor-facing copy** (house style).
- **Design decisions live in CSS**, as custom properties mapped to Tailwind by the `@theme` block in `globals.css`.
- **No second RAF loop.** Lenis and GSAP share one ticker via `smooth-scroll.tsx`. A stray RAF has silently locked scrolling on this site before.
- **Both palettes are hand-edited.** Nothing derived or computed from the other. Changing a colour must never require touching logic.
- **Do not touch** `content/**` (no migration needed), `smooth-scroll.tsx`, `gsap.ts`, `mdx-content.tsx`, `hash-scroll.tsx`, `use-reduced-motion.ts`, `fonts-ready.tsx`, `api/contact/route.ts`, `velite.config.ts`.
- Node's `Date.now()` is fine in app code; the removed scene engine was the only clock consumer.

---

### Task 1: Archive Cold Noon and open the v3 branch

Pure git. No code changes. This makes the Cold Noon work permanently recoverable before anything is deleted, and puts the spec on `main` so it is readable without a checkout.

**Files:** none created or modified.

**Interfaces:**
- Consumes: nothing.
- Produces: branch `jk26-v3` based on `main`, carrying commit `07f9b29` (the spec + handoff + Cold Noon summary). Tag `archive/cold-noon`.

- [ ] **Step 1: Confirm the starting state**

```bash
git -C /Users/jonokane/Dev/jk26 status --short
git branch --show-current
```

Expected: working tree clean, current branch `cold-noon-visual-language`. If the tree is dirty, stop and ask — do not stash someone else's work.

- [ ] **Step 2: Tag the Cold Noon branch**

```bash
git tag -a archive/cold-noon cold-noon-visual-language -m "Cold Noon visual language, parked 2026-07-16.

The cyberpunk time-of-day pivot: living sky, 8 scene keyframes, frosted-flip
slab, decode/terminal motif, sky FX (god rays, smog, grain, veil), and the
vertical Work read.

Parked because a design that must hold at every hour is optimised for no
hour: layout read as arbitrary, colour went muddy, motion stayed clunky.
Superseded by docs/superpowers/specs/2026-07-16-stark-visual-language-design.md

Run it again:  git switch --detach archive/cold-noon && pnpm install && pnpm dev"
```

- [ ] **Step 3: Verify the tag resolves to real work**

```bash
git show --stat --oneline archive/cold-noon | head -5
git tag -l archive/cold-noon
```

Expected: the tag lists and points at commit `fa0914b` ("feat(work): replace horizontal shelf with a vertical stacked read").

- [ ] **Step 4: Put the spec, handoff, and this plan on `main`**

Both doc commits live on `cold-noon-visual-language` (that is where they were written). They belong on `main`, which is where v3 branches from.

Every commit on `cold-noon-visual-language` after `fa0914b` is docs-only — verify that first, then take the range. A range rather than a SHA list, so this step does not rot if the docs are amended again before it runs.

```bash
git diff --name-only fa0914b..cold-noon-visual-language | sed 's|/.*||' | sort -u
```

Expected: exactly `docs`. If anything else appears, stop and read it — the range is only safe while it is documentation.

```bash
git switch main
git cherry-pick fa0914b..cold-noon-visual-language
git log --oneline -4
```

Expected: the spec, this plan, and any doc fixups, sitting on top of main's `b65f1b2`. If a cherry-pick conflicts, stop — `main` should not contain these files at all.

- [ ] **Step 5: Verify the docs landed**

```bash
ls docs/superpowers/specs/2026-07-16-stark-visual-language-design.md
ls docs/superpowers/plans/2026-07-16-jk26-v3-foundation.md
ls docs/notes/jk26-v3-handoff/README.md
ls docs/notes/cold-noon-project-summary.md
```

Expected: all four paths exist. You are reading this plan from the file you just cherry-picked.

- [ ] **Step 6: Open the v3 branch and confirm the base is right**

```bash
git switch -c jk26-v3
test ! -d src/components/decode && echo "OK: no decode (cold-noon only)"
test ! -f src/lib/active-style.ts && echo "OK: no active-style (cold-noon only)"
test -f src/app/api/contact/route.ts && echo "OK: contact route present (reuse target)"
test -f src/components/hero/use-wordmark-morph.ts && echo "OK: morph hook present (reuse target)"
test -f src/components/work/url-label.ts && echo "OK: url-label present (reuse target)"
```

Expected: five OK lines. This proves `main` carries the reuse targets and none of the Cold Noon extras.

- [ ] **Step 7: Baseline the suite before touching anything**

```bash
pnpm install
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: tests pass and the build succeeds.

**Baseline, measured 2026-07-16: 22 test files, 211 tests passing; build green.**
Later tasks delete tests on purpose. Compare against this number to tell a deletion from a regression.

> `package.json` declares `"test": "vitest run"` — already non-watch. Use `pnpm test`, or `pnpm test <path>` for one file. `pnpm test run` appends `run` as a filename filter, matches nothing, and exits 1.

Nothing to commit; the branch itself is the deliverable.

---

### Task 2: Remove the Farewell section

Smallest self-contained removal — proves the loop before the bigger strips. Farewell's whole premise is the visitor's clock (spec §1).

**Files:**
- Delete: `src/components/farewell/farewell.tsx`, `src/components/farewell/farewell.module.css`, `src/components/farewell/farewell.test.tsx`, `src/components/farewell/farewell-hour-gate.test.tsx`, `src/lib/farewell-word.ts`, `src/lib/farewell-word.test.ts`
- Modify: `src/app/page.tsx`, `src/lib/site-content.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a home page rendering `Hero`, `About`, `Work`, `Contact` only. `siteContent` no longer has a `farewell` key.

- [ ] **Step 1: Confirm nothing else depends on these**

```bash
grep -rn "farewell" src/ --include=*.ts --include=*.tsx | grep -v "^src/components/farewell/" | grep -v "^src/lib/farewell-word"
```

Expected: only `src/app/page.tsx` (the import and the `<Farewell />` element). If anything else appears, read it before deleting.

- [ ] **Step 2: Delete the files**

```bash
git rm -r src/components/farewell
git rm src/lib/farewell-word.ts src/lib/farewell-word.test.ts
```

- [ ] **Step 3: Remove it from the page**

In `src/app/page.tsx`, delete the import line `import { Farewell } from "@/components/farewell/farewell";` and the `<Farewell />` element. The file becomes:

```tsx
import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { About } from "@/components/about/about";
import { Work } from "@/components/work/work";
import { Contact } from "@/components/contact/contact";
import { HashScroll } from "@/components/hash-scroll";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Work />
        <Contact />
      </main>
      <HashScroll />
    </>
  );
}
```

- [ ] **Step 4: Remove the farewell copy**

In `src/lib/site-content.ts`, delete the entire `farewell: { ... }` block **and the comment block above it** (the one beginning `/** Farewell (spec §11). The word comes from the visitor's own clock...`). Leave every other key untouched.

- [ ] **Step 5: Verify nothing references it**

Run: `grep -rn "farewell\|Farewell" src/`
Expected: no output.

- [ ] **Step 6: Run tests and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: tests pass (the count drops by the farewell tests — that is the deletion, not a regression). Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove the farewell section

Its premise is the visitor's clock, which v3 removes. Preserved at
tag archive/cold-noon. Spec: 2026-07-16-stark-visual-language-design.md §1"
```

---

### Task 3: Remove the living sky and the scene engine

The whole time-of-day system. After this the site renders against undefined custom properties and will look wrong — that is expected; Tasks 6 and 7 install the replacement token layer. It compiles throughout.

**Files:**
- Delete: `src/components/sky/` (all 11 files: `birds.tsx`, `clouds.tsx`, `rays.tsx`, `scene-provider.tsx`, `scene-provider.test.tsx`, `scene-tune-panel.tsx`, `sky.module.css`, `sky.tsx`, `stars.tsx`, `sun-moon.tsx`, `time-scrubber.tsx`), `src/lib/scene-config.ts`, `src/lib/scene-engine.ts`, `src/lib/scene-engine.test.ts`, `src/lib/pre-hydration-scene.ts`, `src/lib/pre-hydration-scene.test.ts`, `src/lib/seeded-random.ts`, `src/lib/seeded-random.test.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a `layout.tsx` with no scene stack and no first-paint script. `SmoothScroll` still wraps `children` — Task 9 re-adds a provider inside it.

- [ ] **Step 1: Confirm `seeded-random` is sky-only**

```bash
grep -rln "seeded-random" src/ | grep -v "^src/lib/seeded-random"
```

Expected: only `src/components/sky/rays.tsx` and `src/components/sky/stars.tsx`. Both are being deleted, so `seeded-random` goes with them.

- [ ] **Step 2: Confirm the only non-sky scene references are comments**

```bash
grep -rn "scene-engine\|scene-config\|scene-provider" src/components/work/ src/lib/site-content.ts
```

Expected: one hit in `src/components/work/work-lists.ts` inside a doc comment (`the wordmark-engine.ts / scene-engine.ts` pattern reference). Comments are fine to leave; they name a pattern, not an import. Do **not** delete `work-lists.ts`.

- [ ] **Step 3: Delete the sky and the engine**

```bash
git rm -r src/components/sky
git rm src/lib/scene-config.ts src/lib/scene-engine.ts src/lib/scene-engine.test.ts
git rm src/lib/pre-hydration-scene.ts src/lib/pre-hydration-scene.test.ts
git rm src/lib/seeded-random.ts src/lib/seeded-random.test.ts
```

- [ ] **Step 4: Rewrite the layout**

Replace `src/app/layout.tsx` entirely. This drops every scene import, the `<Script>` first-paint tag, and the whole `<SceneProvider><Sky>...` stack. Geist and `suppressHydrationWarning` stay for now — Task 6 removes Geist, Task 9 re-earns `suppressHydrationWarning` for the theme script.

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { FontsReady } from "@/components/fonts-ready";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jonokane.com"),
  title: {
    default: "Jono Kane — Designer",
    template: "%s — Jono Kane",
  },
  description:
    "Design and career portfolio of Jono Kane — case studies in product design, design systems, and motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <link rel="preconnect" href="https://use.typekit.net" />
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://use.typekit.net/aqv1jgr.css"
        precedence="default"
      />
      <body className="min-h-full flex flex-col">
        <FontsReady />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify no scene references survive in code**

```bash
grep -rn "SceneProvider\|useScene\|applySceneToRoot\|SCENE_KEYFRAMES\|TimeScrubber\|preHydrationSceneScript" src/
```

Expected: no output.

- [ ] **Step 6: Run tests and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: both pass. The site now renders with unresolved custom properties — visually wrong, structurally sound. Do not "fix" the look here.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: remove the living sky and the scene engine

The time-of-day system: 8 keyframes, the scene engine, the first-paint
script, and every sky layer. A design that must hold at every hour is
optimised for no hour. Preserved at tag archive/cold-noon.

The site renders against undefined custom properties until the new token
layer lands. Spec: 2026-07-16-stark-visual-language-design.md §3"
```

---

### Task 4: Remove the parked wordmark engines and reduce the hero

The Area/TotalBlack hero and its engines go; the hero becomes a plain type stub that Phase 2 rebuilds against Config Variable. `use-wordmark-morph.ts` is **kept** — it is the v3 morph (spec §7).

**Files:**
- Delete: `src/components/hero-wordmark.tsx`, `src/components/wordmark-tune-panel.tsx`, `src/components/hero/use-hero-lockup.ts`, `src/lib/area-font.ts`, `src/lib/area-font.test.ts`, `src/lib/carve-engine.ts`, `src/lib/carve-engine.test.ts`, `src/lib/hero-config.ts`, `src/lib/hero-config.test.ts`, `src/lib/lockup-math.ts`, `src/lib/lockup-math.test.ts`, `src/lib/optical-kerning.ts`, `src/lib/optical-kerning.test.ts`, `src/lib/wordmark-config.ts`, `src/lib/wordmark-engine.ts`, `src/lib/wordmark-engine.test.ts`
- Modify: `src/components/hero/hero.tsx`, `src/components/hero/hero.module.css`, `src/components/site-header.tsx`

**Interfaces:**
- Consumes: `siteContent.kicker`, `siteContent.tagline` from `src/lib/site-content.ts`.
- Produces: `siteContent.wordmark` (`"JONOKANE"`) and `siteContent.labels.scrollCue` (`"scroll"`) — `site-header.tsx` and Phase 2 both read the wordmark. `<Hero />` renders `#welcome`. `use-wordmark-morph.ts` survives untouched.

- [ ] **Step 1: Confirm the parked hero is unmounted**

```bash
grep -rn "hero-wordmark\|HeroWordmark\|WordmarkTunePanel" src/ | grep -v "^src/components/hero-wordmark.tsx" | grep -v "^src/components/wordmark-tune-panel.tsx"
```

Expected: no output — nothing mounts them (they are the parked TotalBlack hero, CLAUDE.md §"The old TotalBlack hero is parked").

- [ ] **Step 2: Delete the engines and the parked hero**

```bash
git rm src/components/hero-wordmark.tsx src/components/wordmark-tune-panel.tsx
git rm src/components/hero/use-hero-lockup.ts
git rm src/lib/area-font.ts src/lib/area-font.test.ts
git rm src/lib/carve-engine.ts src/lib/carve-engine.test.ts
git rm src/lib/hero-config.ts src/lib/hero-config.test.ts
git rm src/lib/lockup-math.ts src/lib/lockup-math.test.ts
git rm src/lib/optical-kerning.ts src/lib/optical-kerning.test.ts
git rm src/lib/wordmark-config.ts
git rm src/lib/wordmark-engine.ts src/lib/wordmark-engine.test.ts
```

- [ ] **Step 3: Reduce the hero to a type stub**

Replace `src/components/hero/hero.tsx` entirely. Phase 2 rebuilds the per-letter build-in, the living gradient, and the morph on top of this shell — the letter spans are already here so that work has somewhere to land.

```tsx
import { siteContent } from "@/lib/site-content";
import styles from "@/components/hero/hero.module.css";

/**
 * Phase 1 stub. The letters are already split into spans so Phase 2's
 * per-letter build-in and living gradient have somewhere to land (spec §6).
 *
 * The accessible name sits on the <h1> itself, never on a copy that motion
 * can hide. The prototype puts it on the fly copy, which is display:none
 * under reduced motion — leaving the wordmark with no accessible name at all
 * (spec §6, bug 2). Keep it here when Phase 2 adds the fly copy.
 */
export function Hero() {
  return (
    <section className={styles.hero} id="welcome">
      <p className={styles.kicker}>{siteContent.kicker}</p>
      <h1 className={styles.wordmark} aria-label={siteContent.wordmark}>
        {siteContent.wordmark.split("").map((letter, i) => (
          <span key={i} className={styles.letter} aria-hidden="true">
            {letter}
          </span>
        ))}
      </h1>
      <p className={styles.tagline}>{siteContent.tagline}</p>
      <p className={styles.scrollCue}>{siteContent.labels.scrollCue}</p>
    </section>
  );
}
```

> No `"use client"`: the stub has no hooks or handlers, so it stays a server component. Phase 2 adds the directive when it adds the build-in.

- [ ] **Step 4: Add the wordmark and scroll-cue copy**

Neither string exists in `site-content.ts` yet. The wordmark text is visitor-facing copy and an accessible name, so it lives here — not in a component (Global Constraints; spec §14).

At the top level of the `siteContent` object, beside `kicker`, add:

```ts
  /** The hero wordmark and the nav brand render this. */
  wordmark: "JONOKANE",
```

And inside the `labels` object, add:

```ts
    scrollCue: "scroll",
```

- [ ] **Step 5: Reduce the hero stylesheet**

Replace `src/components/hero/hero.module.css` entirely. Values come from spec §6 and `Portfolio v2:37`. Colours resolve once Task 7 lands the palettes.

```css
.hero {
  min-height: 100vh;
  padding: 0 6vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.kicker {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--mute);
}

.wordmark {
  display: flex;
  margin: 0.2em 0 0.26em 0;
  font-family: var(--font-wordmark);
  font-size: clamp(3rem, 9vw, 8rem);
  font-variation-settings: "wght" 300;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  line-height: 0.9;
  color: var(--ink);
}

.tagline {
  max-width: 52ch;
  font-size: clamp(1.15rem, 1.9vw, 1.72rem);
  font-variation-settings: "wght" 400;
  line-height: 1.34;
  color: var(--ink);
}

.scrollCue {
  position: absolute;
  left: 6vw;
  bottom: 6vh;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--mute);
}
```

- [ ] **Step 6: Point the header at the new wordmark source**

`src/components/site-header.tsx:10` imports `WORDMARK_TEXT, wordmarkConfig, wordmarkFvs` from the deleted `@/lib/wordmark-config`. **Delete that import line entirely** — the file already imports `siteContent` at line 9, which is now where the wordmark text lives.

The only uses are in the brand slot at `site-header.tsx:76-91`. Replace that whole `const slot = (...)` block with:

```tsx
  const slot = (
    <span
      id={NAV_WORDMARK_SLOT_ID}
      className={styles.brandSlot}
      /* opacity is live state, so it stays inline; the type is a design
         decision and lives in CSS. */
      style={{ opacity: slotVisible ? 1 : 0 }}
    >
      {siteContent.wordmark}
    </span>
  );
```

Then add the slot's type to `src/components/site-header.module.css`. These are the Config Variable values from spec §Type — the same recipe the hero uses, at nav scale:

```css
.brandSlot {
  font-family: var(--font-wordmark);
  font-size: 1.05rem;
  font-variation-settings: "wght" 300;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  white-space: nowrap;
}
```

> The deleted inline style carried a comment explaining that the locked Area axes were needed or the slot rendered at the font's defaults under reduced motion. That hazard is real and survives the move: the explicit `font-variation-settings: "wght" 300` above is what keeps Config Variable off its thin default. Do not drop it.

- [ ] **Step 7: Verify no dangling imports**

```bash
grep -rn "wordmark-config\|wordmark-engine\|area-font\|carve-engine\|hero-config\|lockup-math\|optical-kerning\|use-hero-lockup" src/
```

Expected: no output.

- [ ] **Step 8: Run tests and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: both pass. `pnpm build` is what proves Step 6 removed every `wordmarkConfig` reference — TypeScript will name any it missed.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: reduce the hero to a type stub, remove the wordmark engines

Area/TotalBlack, the carve engine, the shrink-to-fit lockup, and the
optical kerning table all belonged to the parked hero. The wordmark is
Config Variable now (spec §Type); Phase 2 rebuilds the build-in, the
living gradient, and the morph on this shell.

use-wordmark-morph.ts is deliberately kept: it is the v3 morph, and it
already fixes a measurement bug the prototype still has (spec §7)."
```

---

### Task 5: Remove the collector and the horizontal shelf

The About collector and the Cold Noon shelf are both replaced in later phases (teleprompter, gallery). Their sections become stubs holding real copy and their anchors.

**Files:**
- Delete: `src/components/about/collector-config.ts`, `src/components/about/collector-math.ts`, `src/components/about/collector-math.test.ts`, `src/components/about/use-collector.ts`, `src/components/about/about.test.tsx`, `src/components/work/work-shelf.tsx`, `src/components/work/shelf-labels.ts`, `src/components/work/shelf-math.ts`, `src/components/work/shelf-math.test.ts`, `src/components/work/shelf-panel.tsx`, `src/components/work/shelf-panel.module.css`, `src/components/work/shelf-panels.ts`, `src/components/work/shelf-panels.test.ts`, `src/components/work/shelf-stage.tsx`, `src/components/work/shelf-stage.module.css`, `src/components/work/shelf-store.ts`, `src/components/work/use-shelf-mode.ts`, `src/components/work/use-shelf-scroll.ts`, `src/components/work/use-shelf-swipe.ts`, `src/components/work/header-work-row.tsx`
- Modify: `src/components/about/about.tsx`, `src/components/about/about.module.css`, `src/components/work/work.tsx`, `src/components/site-header.tsx`

**Interfaces:**
- Consumes: `siteContent.titles.about`, `siteContent.about.lede`, `siteContent.beats`, `siteContent.titles.work`, `siteContent.work.intro` from `src/lib/site-content.ts`; `publishedWork` from `@/components/work/work-data` (**not** `work-lists.ts`, which exports only pure functions — `work-data.ts` is the thin glue that applies them to `#site/content`).
- Produces: `<About />` renders `#about` with all four beat statements as plain paragraphs — the exact content Phase 3's teleprompter animates. `<Work />` renders `#work`. Both keep their anchors so `HashScroll` and the header's scroll-spy keep working.

- [ ] **Step 1: Read what `work.tsx` currently does before gutting it**

```bash
sed -n '1,40p' src/components/work/work.tsx
```

`publishedWork` comes from `@/components/work/work-data` — a two-line module that applies `work-lists.ts`'s pure `selectPublishedWork()` to `#site/content`. `work-lists.ts` itself exports only functions; importing `publishedWork` from it will not compile.

**Do not delete `work-lists.ts`, `work-data.ts`, `url-label.ts`, `earlier-work.tsx`, `earlier-work.module.css`, `heading-tags.tsx`, `case-study-sections.ts`, or any `case-study-*` component** — all are reuse targets for Phase 4 or are already load-bearing for `/work/[slug]`.

- [ ] **Step 2: Delete the collector and the shelf**

```bash
git rm src/components/about/collector-config.ts src/components/about/collector-math.ts \
       src/components/about/collector-math.test.ts src/components/about/use-collector.ts \
       src/components/about/about.test.tsx
git rm src/components/work/work-shelf.tsx src/components/work/shelf-labels.ts \
       src/components/work/shelf-math.ts src/components/work/shelf-math.test.ts \
       src/components/work/shelf-panel.tsx src/components/work/shelf-panel.module.css \
       src/components/work/shelf-panels.ts src/components/work/shelf-panels.test.ts \
       src/components/work/shelf-stage.tsx src/components/work/shelf-stage.module.css \
       src/components/work/shelf-store.ts src/components/work/use-shelf-mode.ts \
       src/components/work/use-shelf-scroll.ts src/components/work/use-shelf-swipe.ts \
       src/components/work/header-work-row.tsx
```

> `about.test.tsx` is deleted because it asserts collector behaviour that no longer exists. Phase 3 writes the teleprompter's own tests against the new mechanic.

- [ ] **Step 3: Reduce About to a stub carrying the real statements**

Replace `src/components/about/about.tsx` entirely:

```tsx
import { siteContent } from "@/lib/site-content";
import styles from "@/components/about/about.module.css";

/**
 * Phase 1 stub. The four beats render as plain paragraphs — the same copy
 * Phase 3's teleprompter animates word by word (spec §8). The statements move
 * to content/site/about.mdx in Phase 3; they stay in site-content.ts until then
 * so this phase changes presentation only.
 */
export function About() {
  return (
    <section className={styles.about} id="about" aria-labelledby="about-title">
      <h2 className={styles.title} id="about-title">
        {siteContent.titles.about}
      </h2>
      <p className={styles.lede}>{siteContent.about.lede}</p>
      {siteContent.beats.map((beat) => (
        <p key={beat.title} className={styles.statement}>
          {beat.statement}
        </p>
      ))}
    </section>
  );
}
```

> The `aria-labelledby="about-title"` / `id="about-title"` pairing is carried over from the component being replaced. It names the landmark; dropping it would be an accessibility regression hiding inside a restyle.

- [ ] **Step 4: Reduce the About stylesheet**

Replace `src/components/about/about.module.css` entirely:

```css
.about {
  min-height: 100vh;
  padding: 16vh 6vw 10vh;
}

.title {
  font-size: clamp(2.6rem, 7vw, 6.5rem);
  font-variation-settings: "wght" 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--about);
}

.lede {
  margin-top: 26px;
  max-width: 52ch;
  font-size: clamp(1.15rem, 1.9vw, 1.72rem);
  line-height: 1.34;
  color: var(--ink);
}

.statement {
  margin-top: 0.9em;
  max-width: 30ch;
  font-size: clamp(1.4rem, 2.5vw, 2.5rem);
  font-variation-settings: "wght" 440;
  line-height: 1.18;
  color: var(--about);
}
```

> `.statement` is `--about` green, not ink. That is the prototype's actual behaviour (spec §8, conflict register #5) and putting it here means the dark-mode green wall — the spec's highest-risk surface (§15) — is visible to look at the moment Task 7 lands.

- [ ] **Step 5: Reduce Work to a stub**

Replace `src/components/work/work.tsx` entirely. The `aria-labelledby`/`id="work-title"` pairing is carried over deliberately — it is what names the landmark, and dropping it would be an accessibility regression hiding inside a restyle.

```tsx
import { siteContent } from "@/lib/site-content";
import { publishedWork } from "@/components/work/work-data";
import { formatStudyNumber } from "@/components/work/work-lists";
import styles from "@/components/work/work.module.css";

/**
 * Phase 1 stub: a plain index holding the #work anchor. Phase 4 builds the
 * hybrid — horizontal gallery plus this filterable vertical index (spec §9).
 */
export function Work() {
  return (
    <section className={styles.work} id="work" aria-labelledby="work-title">
      <h2 className={styles.title} id="work-title">
        {siteContent.titles.work}
      </h2>
      <p className={styles.intro}>{siteContent.work.intro}</p>
      <ol className={styles.index}>
        {publishedWork.map((study, index) => (
          <li key={study.slug} className={styles.row}>
            <span className={styles.num}>{formatStudyNumber(index + 1)}</span>
            <a className={styles.rowTitle} href={study.url}>
              {study.title}
            </a>
            <span className={styles.meta}>{study.year}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

> `formatStudyNumber` is reused rather than re-implementing `String(n).padStart(2, "0")` inline: it is already the tested source of truth for how a study's number prints, and Phase 4's `01 / 09` counter reads from the same function. If its signature differs from `(number: number) => string`, match the real one.

- [ ] **Step 6: Reduce the Work stylesheet**

Replace `src/components/work/work.module.css` entirely:

```css
.work {
  min-height: 100vh;
  padding: 16vh 6vw 10vh;
}

.title {
  font-size: clamp(2.6rem, 7vw, 6.5rem);
  font-variation-settings: "wght" 700;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--work);
}

.intro {
  margin-top: 26px;
  max-width: 52ch;
  font-size: clamp(1.15rem, 1.9vw, 1.72rem);
  line-height: 1.34;
  color: var(--ink);
}

.index {
  margin-top: 7vh;
  list-style: none;
}

.row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: center;
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid var(--hairline);
}

.num {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--mute);
}

.rowTitle {
  font-size: clamp(1.5rem, 3vw, 2.6rem);
  font-variation-settings: "wght" 480;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
}

.meta {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--mute);
}
```

- [ ] **Step 7: Cut the shelf out of the header**

In `src/components/site-header.tsx`, remove:
- `import { HeaderWorkRow } from "@/components/work/header-work-row";`
- `import { useShelfState } from "@/components/work/shelf-store";`
- every use of `useShelfState(...)` and the `<HeaderWorkRow ... />` element, plus any local variable that existed only to feed them.

The header keeps the brand, the three nav links, and the scroll-spy. Phase 2 restyles it.

- [ ] **Step 8: Verify nothing dangles**

```bash
grep -rn "shelf\|Shelf\|collector\|Collector" src/
```

Expected: no output. If `work.module.css` still holds shelf rules, Step 6 replaced it — re-check.

- [ ] **Step 9: Run tests and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: both pass. `pnpm build` proves Step 7 caught every shelf reference.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: reduce About and Work to stubs, remove collector and shelf

Both mechanics are replaced in later phases (teleprompter, hybrid
gallery). The stubs keep every real word and both anchors, so scroll-spy
and deep links keep working while the foundation lands.

About's statements render in --about green per the prototype's actual
behaviour, not the README's inverted paraphrase (spec §8, register #5)."
```

---

### Task 6: The three-face type system

Three faces, one role each, from Adobe Fonts kit `aqv1jgr` (spec §Type). Mae is already wired; only the wordmark and mono tokens change. Geist goes.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Test: `src/app/globals.css.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties `--font-display`, `--font-body` (both `"mae-variable"`), `--font-mono` (`"config-mono-vf"`), `--font-wordmark` (`"config-variable"`). Every later task and phase styles against these four names.

- [ ] **Step 1: Write the failing test**

A stylesheet is not a module, so the test reads the file and asserts the contract. This is cheap and it is what stops a later refactor silently reverting the wordmark to TotalBlack or leaving a Geist fallback behind.

Create `src/app/globals.css.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.resolve(__dirname, "globals.css"), "utf8");

describe("type tokens", () => {
  it("uses Mae Variable for display and body", () => {
    expect(css).toMatch(/--font-display:\s*"mae-variable"/);
    expect(css).toMatch(/--font-body:\s*"mae-variable"/);
  });

  it("uses Config Mono for the mono role", () => {
    expect(css).toMatch(/--font-mono:\s*"config-mono-vf",\s*monospace/);
  });

  /* Config Variable is the wordmark face and nothing else (spec §Type,
     conflict register #2). TotalBlack is the parked hero. */
  it("uses Config Variable for the wordmark, and only there", () => {
    expect(css).toMatch(/--font-wordmark:\s*"config-variable"/);
    expect(css).not.toContain("totalblack-variable");
  });

  it("carries no Geist fallbacks — the site is served from the Adobe kit", () => {
    expect(css).not.toContain("font-geist");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test src/app/globals.css.test.ts`
Expected: FAIL — `--font-wordmark` is still `"totalblack-variable"`, `--font-mono` is still `var(--font-geist-mono)`, and Geist fallbacks are present.

- [ ] **Step 3: Update the type tokens**

In `src/app/globals.css`:

In the `@theme inline` block (around lines 11-20), replace the two font lines:

```css
  --font-mono: "config-mono-vf", monospace;
  --font-wordmark: "config-variable", sans-serif;
```

and delete the line `--font-sans: var(--font-geist-sans);` if nothing references it (Step 5 verifies).

In the token block that currently declares them (around lines 81-82), replace:

```css
  --font-display: "mae-variable", system-ui, sans-serif;
  --font-body: "mae-variable", system-ui, sans-serif;
```

The Geist fallbacks go: the site is served entirely from kit `aqv1jgr`, and `system-ui` is the honest fallback if the kit fails to load.

- [ ] **Step 4: Set the variation-weight floor**

The README warns both faces render at their thin defaults without an explicit base. In `globals.css`, on the `body` rule (around line 108), ensure:

```css
  font-family: var(--font-body), system-ui, sans-serif;
  font-variation-settings: "wght" 400;
```

And add a rule so mono never inherits a display weight:

```css
.mono,
[class*="mono"] {
  font-family: var(--font-mono);
  font-variation-settings: "wght" 400;
}
```

- [ ] **Step 5: Drop Geist from the layout**

In `src/app/layout.tsx`, delete `import { Geist, Geist_Mono } from "next/font/google";`, both `const geistSans = ...` / `const geistMono = ...` declarations, and the `${geistSans.variable} ${geistMono.variable} ` from the `<html>` className. The className becomes:

```tsx
      className="h-full antialiased"
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pnpm test src/app/globals.css.test.ts
grep -rn "geist\|Geist" src/ || echo "OK: no Geist references"
```

Expected: PASS, and the grep prints the OK line.

- [ ] **Step 7: Build**

Run: `pnpm build 2>&1 | tail -5`
Expected: succeeds. If it complains about an unused `--font-sans`, remove that line too.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(type): three faces, one role each

Mae Variable for display and body, Config Mono for labels, Config
Variable for the wordmark only. All from Adobe Fonts kit aqv1jgr, which
layout.tsx already embeds.

Mae was already wired as --font-display/--font-body; only the wordmark
(was totalblack-variable) and mono (was Geist) tokens change. Geist is
gone — the site is served entirely from the kit.

Resolves handoff conflict #1 and #2 (spec §Type): the README claimed
Config Variable was display+body, but both prototypes declare
body { font-family: 'mae-variable' } and Jono confirmed."
```

---

### Task 7: Two locked palettes

The heart of the pivot. Two hand-authored palettes replace ~40 scene properties. Not interpolated, not derived — a design that must hold at every hour is optimised for no hour (spec §3).

**Files:**
- Modify: `src/app/globals.css`
- Test: `src/app/globals.css.test.ts` (extend)

**Interfaces:**
- Consumes: nothing.
- Produces: tokens `--canvas`, `--ink`, `--mute`, `--dim`, `--hairline`, `--row-hover`, `--about`, `--work`, `--contact`, `--nav-glass` on `:root` and on `:root[data-theme="dark"]`. Every component styles against these names in both themes.

- [ ] **Step 1: Write the failing test**

Add to `src/app/globals.css.test.ts`:

```ts
const TOKENS = [
  "--canvas", "--ink", "--mute", "--dim",
  "--hairline", "--row-hover", "--about", "--work", "--contact",
];

/** `:root { ... }` and `:root[data-theme="dark"] { ... }` bodies. */
function paletteBody(selector: string): string {
  const i = css.indexOf(selector);
  if (i === -1) throw new Error(`no ${selector} block`);
  return css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i));
}

describe("palettes", () => {
  it("declares every token in both themes", () => {
    const light = paletteBody(":root {");
    const dark = paletteBody(':root[data-theme="dark"]');
    for (const t of TOKENS) {
      expect(light, `light is missing ${t}`).toContain(`${t}:`);
      expect(dark, `dark is missing ${t}`).toContain(`${t}:`);
    }
  });

  it("keeps the handoff's light values verbatim", () => {
    const light = paletteBody(":root {");
    expect(light).toMatch(/--canvas:\s*#ffffff/);
    expect(light).toMatch(/--ink:\s*#0d0d0d/);
    expect(light).toMatch(/--about:\s*#3f9b4e/);
    expect(light).toMatch(/--work:\s*#6d4bd8/);
    expect(light).toMatch(/--contact:\s*#2f7d8f/);
  });

  it("uses a pure black dark canvas", () => {
    expect(paletteBody(':root[data-theme="dark"]')).toMatch(/--canvas:\s*#000000/);
  });

  /* The whole point of two locked palettes: a hex is a hex. If a dark value
     is ever expressed as a function of a light one, the muddiness that killed
     Cold Noon has a way back in. */
  it("derives nothing — no colour functions in either palette", () => {
    for (const body of [paletteBody(":root {"), paletteBody(':root[data-theme="dark"]')]) {
      expect(body).not.toMatch(/color-mix|oklch|hsl\(|rgb\(|calc\(/);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test src/app/globals.css.test.ts`
Expected: FAIL — `no :root[data-theme="dark"] block`.

- [ ] **Step 3: Write the palettes**

`globals.css` currently has **two** `:root` blocks and a stray dark-mode media query — know the shape before editing:

| Lines | What | Fate |
|---|---|---|
| 3-6 | `:root { --background; --foreground }` | **Delete** — Next.js scaffold leftover, superseded by `--canvas`/`--ink` |
| 8-21 | `@theme inline { ... }` | Keep, remap in Step 4 |
| 23-28 | `@media (prefers-color-scheme: dark) { :root { --background; --foreground } }` | **Delete** — Task 8's `data-theme` replaces this mechanism; leaving both means two systems fighting over the same paint |
| 31+ | `:root { --sky-* ... }` scene tokens | **Replace** with the two palettes below |

Replace the whole scene-token block — every `--sky-*`, `--w-*`, `--sun-*`, `--moon-*`, `--slab-*`, `--field-*`, `--struct-*`, `--fx-*`, `--cover-*`, `--daylight`, `--scrim`, `--text-glow`, `--elev`, `--dw`, `--bw` declaration. All of it is dead. Keep the `--r-*` radius tokens and the font tokens from Task 6.

After this step exactly one bare `:root {` block must remain, or the test's `paletteBody(":root {")` helper will read the wrong one.

```css
/* ── Light ────────────────────────────────────────────────────────────
   The handoff's palette, verbatim. Hand-edited. Nothing here is derived
   from anything: a hex is a hex (spec §3).                             */
:root {
  --canvas:    #ffffff;
  --ink:       #0d0d0d;
  --mute:      #9a9a9a;
  --dim:       #bcbcbc; /* teleprompter resting word */
  --hairline:  #e6e6e6;
  --row-hover: #fafafa;

  --about:     #3f9b4e;
  --work:      #6d4bd8;
  --contact:   #2f7d8f;

  --nav-glass: rgba(255, 255, 255, 0.6);
  --nav-edge:  rgba(15, 15, 15, 0.06);
}

/* ── Dark ─────────────────────────────────────────────────────────────
   Same tokens, same order, so the two read side by side. The handoff has
   no dark mode; these are authored here. The accents are lifted to clear
   4.5:1 on #000 (the handoff's violet lands ~3.2:1) while holding hue.

   EXPECT TO TUNE THESE BY HAND. Look at the About wall first — it is a
   near-full-screen field of --about and the likeliest place for "muddy"
   to return (spec §15).                                                 */
:root[data-theme="dark"] {
  --canvas:    #000000;
  --ink:       #f2f2f2;
  --mute:      #7d7d7d;
  --dim:       #3a3a3a;
  --hairline:  #1c1c1c;
  --row-hover: #0a0a0a;

  --about:     #57c46a;
  --work:      #9d86f0;
  --contact:   #5ab6cb;

  --nav-glass: rgba(0, 0, 0, 0.6);
  --nav-edge:  rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 4: Map them to Tailwind and paint the canvas**

In the `@theme inline` block (lines 8-21), replace the old scene mappings — `--color-background`, `--color-foreground`, `--color-ink`, `--color-sub`, `--color-surface`, `--color-card`, `--color-card-border` — with:

```css
  --color-canvas: var(--canvas);
  --color-ink: var(--ink);
  --color-mute: var(--mute);
  --color-about: var(--about);
  --color-work: var(--work);
  --color-contact: var(--contact);
```

And ensure the `body` rule paints the canvas:

```css
body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-body), system-ui, sans-serif;
  font-variation-settings: "wght" 400;
}
```

Delete the stale `--background: #ffffff; --foreground: #171717;` pair and the `@media (prefers-color-scheme: dark)` block that overrides them — Task 8's `data-theme` attribute replaces that mechanism entirely, and leaving both means two systems fighting over the same paint.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/app/globals.css.test.ts`
Expected: PASS, all cases.

- [ ] **Step 6: Verify no scene tokens survive**

```bash
grep -nE "\-\-sky-|\-\-w-|\-\-slab-|\-\-fx-|\-\-struct-|\-\-daylight|\-\-scrim" src/app/globals.css || echo "OK: no scene tokens"
```

Expected: the OK line.

- [ ] **Step 7: Build and look at it**

```bash
pnpm build 2>&1 | tail -5
pnpm dev
```

Open `http://localhost:3000`. Expected: white canvas, near-black Mae type, green About statements, violet Work title, teal Contact. **Look at the pixels.** This is the first honest read of the palette; the whole pivot rests on it. Dark is not reachable yet — Task 8 wires the attribute.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(color): two locked palettes replace the scene token layer

Light is the handoff verbatim. Dark is authored here (the handoff has
none) with the accents lifted to clear 4.5:1 on pure black — the
handoff's violet lands ~3.2:1.

Both are hand-edited, adjacent, same tokens in the same order, nothing
derived. A design that must hold at every hour is optimised for no
hour; two fixed sets can be looked at and locked. Dark is expected to
be iterated by hand (spec §3)."
```

---

### Task 8: Theme resolution engine and the pre-hydration script

A pure resolver plus an inline script that stamps `data-theme` before first paint, so dark never flashes white. Same pattern as the deleted `pre-hydration-scene.ts`, new job — including its test discipline of pinning the script to the engine.

**Files:**
- Create: `src/lib/theme-engine.ts`, `src/lib/theme-engine.test.ts`, `src/lib/pre-hydration-theme.ts`, `src/lib/pre-hydration-theme.test.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Theme = "light" | "dark"`
  - `type ThemeChoice = Theme | "system"`
  - `const THEME_STORAGE_KEY: string`
  - `resolveTheme(choice: ThemeChoice | null, systemPrefersDark: boolean): Theme`
  - `parseThemeChoice(raw: string | null): ThemeChoice`
  - `applyTheme(theme: Theme): void`
  - `preHydrationThemeScript: string`

  Task 9 consumes all of these.

- [ ] **Step 1: Write the failing test for the engine**

Create `src/lib/theme-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyTheme,
  parseThemeChoice,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme-engine";

describe("resolveTheme", () => {
  it("honours an explicit choice over the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system preference when the choice is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  /* First visit: nothing stored. The OS decides — never a hardcoded default. */
  it("follows the system preference when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });
});

describe("parseThemeChoice", () => {
  it("accepts the three valid choices", () => {
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("system")).toBe("system");
  });

  /* localStorage is user-writable and survives deploys. Garbage must not
     paint a broken theme; it must fall back to following the OS. */
  it("falls back to system for anything else", () => {
    expect(parseThemeChoice(null)).toBe("system");
    expect(parseThemeChoice("")).toBe("system");
    expect(parseThemeChoice("DARK")).toBe("system");
    expect(parseThemeChoice("midnight")).toBe("system");
  });
});

describe("applyTheme", () => {
  it("stamps the theme onto the document element", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is namespaced so it cannot collide on localhost", () => {
    expect(THEME_STORAGE_KEY).toMatch(/^jk-/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test src/lib/theme-engine.test.ts`
Expected: FAIL — `Cannot find module '@/lib/theme-engine'`.

- [ ] **Step 3: Write the engine**

Create `src/lib/theme-engine.ts`:

```ts
/**
 * Theme resolution (spec §4). Pure, so the pre-hydration script and the
 * hydrated app cannot drift apart — a test pins them together.
 *
 * v3 has no clock: the visitor's OS preference decides, and an explicit
 * choice overrides it. Two locked palettes, never interpolated.
 */

export type Theme = "light" | "dark";

/** What the visitor chose. "system" means "follow the OS", the default. */
export type ThemeChoice = Theme | "system";

/** Namespaced: localhost is shared with every other project on this machine. */
export const THEME_STORAGE_KEY = "jk-theme";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme actually painted, from the stored choice and the OS preference. */
export function resolveTheme(choice: ThemeChoice | null, systemPrefersDark: boolean): Theme {
  if (choice === "light" || choice === "dark") return choice;
  return systemPrefersDark ? "dark" : "light";
}

/** Narrow an untrusted localStorage value. Anything unrecognised follows the OS. */
export function parseThemeChoice(raw: string | null): ThemeChoice {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

/** Stamp the theme onto <html>, where the palettes key off it. Idempotent. */
export function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test src/lib/theme-engine.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Write the failing test for the pre-hydration script**

Create `src/lib/pre-hydration-theme.test.ts`. It mirrors `pre-hydration-scene.test.ts`'s discipline: `eval` the script exactly as a browser would, and assert it agrees with the engine.

```ts
import { afterEach, describe, expect, it } from "vitest";
import { preHydrationThemeScript } from "@/lib/pre-hydration-theme";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme-engine";

function setSystemPrefersDark(dark: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: dark,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

function run() {
  eval(preHydrationThemeScript); // execute the inline script exactly as a browser would
}

describe("preHydrationThemeScript", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("paints the OS preference when nothing is stored", () => {
    setSystemPrefersDark(true);
    run();
    expect(document.documentElement.dataset.theme).toBe(resolveTheme(null, true));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("paints light when the OS prefers light and nothing is stored", () => {
    setSystemPrefersDark(false);
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  /* The case that matters: an explicit choice must beat the OS before first
     paint, or a dark-choosing visitor on a light OS gets a white flash — the
     exact failure the deleted scene script existed to prevent. */
  it("honours an explicit choice over the OS, matching the engine", () => {
    setSystemPrefersDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(document.documentElement.dataset.theme).toBe(resolveTheme("dark", false));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ignores a stored value the engine would reject", () => {
    setSystemPrefersDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark"); // fell back to the OS
  });

  it("uses the same storage key as the engine", () => {
    expect(preHydrationThemeScript).toContain(THEME_STORAGE_KEY);
  });

  /* It runs before anything else and must never break the page: a visitor
     with localStorage disabled would otherwise get a blank site. */
  it("is try/catch wrapped", () => {
    expect(preHydrationThemeScript).toContain("try{");
    expect(preHydrationThemeScript).toContain("catch");
  });
});
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `pnpm test src/lib/pre-hydration-theme.test.ts`
Expected: FAIL — `Cannot find module '@/lib/pre-hydration-theme'`.

- [ ] **Step 7: Write the script**

Create `src/lib/pre-hydration-theme.ts`. The storage key and the media query are serialised from the engine at build time — single source of truth, no manual sync.

```ts
import { DARK_QUERY, THEME_STORAGE_KEY } from "@/lib/theme-engine";

/**
 * Inline first-paint script (spec §4). Before hydration, SSR would otherwise
 * paint the light palette — a white flash for every dark-mode visitor. This
 * resolves the theme with the SAME precedence as `resolveTheme`: an explicit
 * stored choice wins, otherwise the OS decides. A test pins the two together.
 *
 * Because it mutates <html> before React hydrates, <html> carries
 * suppressHydrationWarning.
 */
export const preHydrationThemeScript = `(function(){try{
var c=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(c!=="light"&&c!=="dark"){c=matchMedia(${JSON.stringify(DARK_QUERY)}).matches?"dark":"light"}
document.documentElement.dataset.theme=c;
}catch(e){}})();`;
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `pnpm test src/lib/pre-hydration-theme.test.ts`
Expected: PASS, all six cases.

- [ ] **Step 9: Mount the script**

In `src/app/layout.tsx`, add the import and render the script in `<body>`, above `<FontsReady />`:

```tsx
import Script from "next/script";
import { preHydrationThemeScript } from "@/lib/pre-hydration-theme";
```

```tsx
        {/* Resolves the theme before hydration so dark never flashes white.
            `beforeInteractive` is the only strategy that lands in the server
            HTML ahead of framework JS; a raw <script> element would warn
            (React never executes scripts rendered on the client) and would
            not run on a client navigation. */}
        <Script
          id="theme-first-paint"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: preHydrationThemeScript }}
        />
```

`<html>` already carries `suppressHydrationWarning` — it is now earning it again, for this script instead of the scene one.

- [ ] **Step 10: Run the full suite and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: both pass.

- [ ] **Step 11: Verify dark actually paints**

Run `pnpm dev`, open `http://localhost:3000`, and in DevTools set **Rendering → Emulate prefers-color-scheme: dark**. Reload.

Expected: `<html data-theme="dark">`, a pure black canvas, no white flash on reload. **Look at the About wall.** It is a near-full-screen field of `--about` green — the spec's highest-risk surface (§15). If it reads muddy, note it now; do not silently retune.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(theme): resolution engine and pre-hydration script

A pure resolver (explicit choice beats the OS; anything unrecognised in
localStorage follows the OS) plus an inline script that stamps
data-theme before first paint, so dark never flashes white.

The script is pinned to the engine by test, the way the deleted scene
script was — the storage key and media query are serialised from the
engine, so the two cannot drift. Spec §4"
```

---

### Task 9: ThemeProvider and the nav toggle

The visitor-facing control. Type, not an icon — the design is type-only by rule (spec §4).

**Files:**
- Create: `src/components/theme/use-theme.ts`, `src/components/theme/theme-toggle.tsx`, `src/components/theme/theme-toggle.module.css`, `src/components/theme/theme-toggle.test.tsx`
- Modify: `src/lib/site-content.ts`, `src/components/site-header.tsx`, `src/components/site-header.module.css`

**Interfaces:**
- Consumes: `Theme`, `ThemeChoice`, `THEME_STORAGE_KEY`, `DARK_QUERY`, `resolveTheme`, `parseThemeChoice`, `applyTheme` from `@/lib/theme-engine`.
- Produces:
  - `useTheme(): { theme: Theme; setChoice: (c: ThemeChoice) => void }`
  - `<ThemeToggle />`
  - `siteContent.labels.theme: { toLight: string; toDark: string }`

- [ ] **Step 1: Add the copy**

In `src/lib/site-content.ts`, inside the `labels` object, add:

```ts
    /** The theme control names the mode it switches TO, not the current one. */
    theme: {
      toLight: "Light",
      toDark: "Dark",
    },
```

- [ ] **Step 2: Write the failing test**

Create `src/components/theme/theme-toggle.test.tsx`:

```tsx
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY } from "@/lib/theme-engine";
import { siteContent } from "@/lib/site-content";

function setSystemPrefersDark(dark: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: dark,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("offers dark when the OS prefers light", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toDark })).toBeTruthy();
  });

  it("offers light when the OS prefers dark", async () => {
    setSystemPrefersDark(true);
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toLight })).toBeTruthy();
  });

  it("applies and persists the chosen theme", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: siteContent.labels.theme.toDark });
    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  /* An explicit choice must survive a reload that disagrees with the OS —
     that is the entire reason the choice is persisted. */
  it("honours a stored choice over the OS preference", async () => {
    setSystemPrefersDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toLight })).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `pnpm test src/components/theme/theme-toggle.test.tsx`
Expected: FAIL — `Cannot find module '@/components/theme/theme-toggle'`.

- [ ] **Step 4: Write the hook**

Create `src/components/theme/use-theme.ts`. It mirrors `use-reduced-motion.ts`'s hydration-safe shape: return a server-matching value on the first render, then the real one.

```ts
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyTheme,
  DARK_QUERY,
  parseThemeChoice,
  resolveTheme,
  THEME_STORAGE_KEY,
  type Theme,
  type ThemeChoice,
} from "@/lib/theme-engine";

/**
 * The visitor's theme (spec §4). The pre-hydration script has already painted
 * <html data-theme>; this hook adopts that value, then owns it.
 *
 * Hydration-safe: `theme` is "light" on the server and the first client
 * render, then corrected in an effect — the same pattern useReducedMotionPref
 * uses. The paint is never wrong regardless, because the inline script set the
 * attribute before React ran.
 */
export function useTheme(): { theme: Theme; setChoice: (c: ThemeChoice) => void } {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const stored = parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
    const resolved = resolveTheme(stored, mq.matches);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage and media queries are client-only
    setTheme(resolved);
    applyTheme(resolved);

    /* Follow the OS live, but only while the visitor has not chosen. */
    const onChange = (e: MediaQueryListEvent) => {
      if (parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY)) !== "system") return;
      const next = resolveTheme("system", e.matches);
      setTheme(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setChoice = useCallback((choice: ThemeChoice) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      /* Private mode: the choice still applies for this session. */
    }
    const next = resolveTheme(choice, window.matchMedia(DARK_QUERY).matches);
    setTheme(next);
    applyTheme(next);
  }, []);

  return { theme, setChoice };
}
```

- [ ] **Step 5: Write the toggle**

Create `src/components/theme/theme-toggle.tsx`:

```tsx
"use client";

import { siteContent } from "@/lib/site-content";
import { useTheme } from "@/components/theme/use-theme";
import styles from "@/components/theme/theme-toggle.module.css";

/**
 * The theme control (spec §4). Type, not an icon — the design is type-only.
 * The button names the mode it switches TO, so the label is never ambiguous.
 */
export function ThemeToggle() {
  const { theme, setChoice } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? siteContent.labels.theme.toDark : siteContent.labels.theme.toLight;

  return (
    <button type="button" className={styles.toggle} onClick={() => setChoice(next)}>
      {label}
    </button>
  );
}
```

- [ ] **Step 6: Write the toggle's styles**

Create `src/components/theme/theme-toggle.module.css`:

```css
.toggle {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--mute);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: color 0.5s ease;
}

.toggle:hover {
  color: var(--ink);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm test src/components/theme/theme-toggle.test.tsx`
Expected: PASS, all four cases.

- [ ] **Step 8: Mount it in the nav**

In `src/components/site-header.tsx`, import the toggle and render it as the last item in the links group, after the Contact link:

```tsx
import { ThemeToggle } from "@/components/theme/theme-toggle";
```

```tsx
        <ThemeToggle />
```

If the links container is a flex row, the toggle inherits its gap. If `site-header.module.css` needs a rule to keep it aligned, add it there — not as an inline style.

- [ ] **Step 9: Run the full suite and build**

```bash
pnpm test 2>&1 | tail -5
pnpm build 2>&1 | tail -5
```

Expected: both pass.

- [ ] **Step 10: Verify the whole loop by hand**

Run `pnpm dev` and check each of these:

1. Load with OS light → white canvas, toggle reads `DARK`.
2. Click it → black canvas, toggle reads `LIGHT`, no reload needed.
3. **Reload → still black, and no white flash.** This is the one that proves the pre-hydration script; watch the first paint, not the settled page.
4. DevTools → Rendering → emulate `prefers-color-scheme: dark` with storage cleared → loads dark unprompted.
5. `localStorage.clear()` then reload → follows the OS again.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(theme): provider hook and the nav toggle

Auto by default via prefers-color-scheme, overridable by a nav control,
choice persisted. The toggle is type, not an icon, and names the mode it
switches to. It follows the OS live until the visitor chooses, then stops.

localStorage here is a deliberate, scoped exception to the handoff's
'persist nothing' rule — that rule is about which case study is open,
which the URL owns. A theme preference is what localStorage is for.
Spec §4"
```

---

## Phase 1 exit criteria

Before planning Phase 2, all of these must hold:

- [ ] `pnpm test` and `pnpm build` both pass.
- [ ] `grep -rniE "scene|sky|slab|decode|farewell|shelf|collector|geist|totalblack" src/` returns nothing but doc comments.
- [ ] The site renders every real word — kicker, tagline, four About statements, the work index, the contact form — in Mae Variable on a stark canvas.
- [ ] Light and dark both paint, the toggle works, and reloading in dark shows **no white flash**.
- [ ] `git tag -l archive/cold-noon` resolves, and `git switch --detach archive/cold-noon && pnpm dev` still runs Cold Noon.
- [ ] **Jono has looked at the pixels in both themes** — especially the About wall in dark, the spec's highest-risk surface (§15). Cold Noon's lesson was that "tests pass" said nothing about whether it looked right.

## What Phase 1 deliberately leaves undone

Later phases, planned against real pixels rather than guessed at now:

- **Phase 2 — Welcome + nav morph.** Per-letter build-in, the living gradient (and it stays on the landed nav mark), the FLIP morph on the kept `use-wordmark-morph.ts`, the reduced-motion path that fixes the prototype's permanently-blurred wordmark and its missing accessible name.
- **Phase 3 — About teleprompter.** `content/site/about.mdx`, the markdown-emphasis tokeniser, `teleprompter-config.ts`, the sticky 640vh stage.
- **Phase 4 — Work.** The filterable vertical index first, then the horizontal gallery, then the `@modal` intercepting route and its scroll lock.
- **Phase 5 — Contact + polish.** Restyle onto the new tokens (keep the working Resend route), `content/site/` for the remaining prose, meta/OG, full a11y and reduced-motion audit.
