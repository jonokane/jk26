# Phase 2: Hero + Site Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The final JONOKANE hero (Area variable font, one-time build-in, cursor weight-carve, exact type lockup) replaces the old TotalBlack hero, and the floating site header assembles via a scroll-scrubbed wordmark morph — plus the Phase 1 punch-list items (SceneProvider fake-timer tests, pre-hydration scene script, fonts-loaded gating) and route plumbing (deep links, `/work` redirect).

**Architecture:** A font loader re-registers Area from the Typekit CDN with honest descriptors and gates the hero; the hero renders per-letter spans (hand-tuned kern margins) animated by a GSAP timeline, with a pure-math carve engine on the shared GSAP ticker and a measurement-driven lockup hook. The wordmark lives in a fixed layer so a ScrollTrigger-scrubbed morph can fly it into the header's slot, reversibly. Placeholder anchor sections give the nav/spy/deep-links real targets until Phases 3–5 fill them. Spec: `docs/superpowers/specs/2026-07-11-site-experience-design.md` §2, §5, §6, §12, §13, §14, §15.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, GSAP + ScrollTrigger + Lenis (existing shared-ticker integration), Tailwind v4, vitest + jsdom (+ new devDeps `@testing-library/react`, `@testing-library/dom`).

## Global Constraints

- **pnpm only** — never npm/yarn. Gates before every commit: `pnpm test && pnpm build && pnpm lint`.
- **Fonts are CDN-only** from Typekit kit `aqv1jgr` — never download/self-host font files. The `area-full` FontFace re-registration (spec §5) points at Adobe's own CDN URL extracted from the kit CSS at runtime; this corrects CSS descriptor metadata only.
- **Wordmark recipe is locked** (spec §5, verbatim): text `JONOKANE`; axes `wght 274, wdth 195, INKT 8, slnt 0`; tracking `0.05em`; size `7vw` shrink-to-fit (never expand); pair kerns `[30, 0, 0, 0, 165, 45, -70]` thousandths of an em (J·O…N·E); build-in `dur 1250ms, stagger 130ms, from scale 2 / blur 14px / y −18vh, expo-out (cubic-bezier(0.16, 1, 0.3, 1)), left→right`; hover carve `radius 240px, strength 65%, lag 220ms, wght 274 → toward 100`.
- **Copy is locked** (spec §5): kicker "Product Design Leader & Strategist"; tagline "I shape strategy, build teams, lead design, and code the front end that brings it to life."
- **One RAF loop** (CLAUDE.md): all frame work rides `gsap.ticker` (ScrollTrigger + the carve engine included). Never add a second RAF or `autoRaf`.
- **Motion behavior** (spec §5/§12): after the build-in the wordmark holds still — no ambient motion. Carve is pointer-only: inert on touch (`(hover: hover)` gate) and disabled under `prefers-reduced-motion`. Reduced motion: wordmark appears by simple fade, no scrubbed morph — the header fades in at a scroll threshold instead.
- **Type lockup** (spec §5): kicker width == the JONO segment width; tagline on ONE line spanning the full JONOKANE width; re-measured on resize.
- **Old hero is parked, not deleted** (spec §13): unmount `HeroWordmark` (and with it the wordmark tune panel) from the page; leave `src/components/hero-wordmark.tsx`, `src/components/wordmark-tune-panel.tsx`, `src/lib/wordmark-engine.ts`(+tests), `src/lib/hero-config.ts`(+tests) in the repo untouched. Reuse the engine's exported pure math (`rawInfluence`, `smoothingFactor`) — do not duplicate it.
- **Code organization** (spec §15): copy in `src/lib/site-content.ts`, tunables in `src/lib/wordmark-config.ts` — never in JSX; one component per file; motion/measurement logic in dedicated hooks; pure math unit-tested; recurring styles via the existing component classes (`.slab`, `.pill`, `.heading-display`, `.text-kicker`), utilities only for one-off layout.
- **Hydration discipline**: server render must match first client render — no client-only values during render (post-mount effects only; letters render hidden and are revealed by the animation path).
- **Scene engine internals are frozen** — Phase 2 may import from `scene-config`/`scene-engine` but not modify them.

## File Structure

```
src/components/sky/scene-provider.test.tsx   NEW: fake-timer tests (punch list)
src/lib/area-font.ts                         NEW: kit-CSS fetch → FontFace re-registration + gate
src/lib/area-font.test.ts                    NEW
src/lib/wordmark-config.ts                   NEW: locked recipe (single source of truth)
src/lib/site-content.ts                      NEW: kicker/tagline/nav/placeholder copy
src/lib/use-reduced-motion.ts                NEW: matchMedia hook (hydration-safe)
src/components/hero/hero.tsx                 NEW: hero section — gate, letters, build-in, wiring
src/components/hero/hero.module.css          NEW: hero-only styles
src/components/hero/use-hero-lockup.ts       NEW: measurement hook
src/lib/lockup-math.ts                       NEW: pure lockup math (tested)
src/lib/lockup-math.test.ts                  NEW
src/lib/carve-engine.ts                      NEW: pointer weight-carve on gsap ticker
src/lib/carve-engine.test.ts                 NEW: pure-math tests
src/components/hero/use-wordmark-morph.ts    NEW: ScrollTrigger FLIP morph
src/components/site-header.tsx               NEW: floating nav pill + slot + spy wiring
src/lib/use-scroll-spy.ts                    NEW
src/components/anchor-section.tsx            NEW: placeholder #about/#work/#contact sections
src/components/hash-scroll.tsx               NEW: deep-link scroll on load
src/components/fonts-ready.tsx               NEW: Mae fonts-loaded gate (punch list)
src/lib/pre-hydration-scene.ts               NEW: inline <head/body> script source (punch list)
src/lib/pre-hydration-scene.test.ts          NEW
src/components/smooth-scroll.tsx             MODIFY: expose getLenis()
src/app/page.tsx                             MODIFY: new hero + header + sections (old hero out)
src/app/layout.tsx                           MODIFY: pre-hydration script + FontsReady
src/app/globals.css                          MODIFY: fonts-mae gating, header/section support
next.config.ts                               MODIFY: /work → /#work redirect
src/app/work/page.tsx                        DELETE (index only; /work/[slug] stays)
CLAUDE.md, PLAN.md                           MODIFY: docs
```

---

### Task 1: SceneProvider fake-timer tests

**Files:**
- Test: `src/components/sky/scene-provider.test.tsx`
- Modify: `package.json` (devDeps via pnpm)

**Interfaces:**
- Consumes: `SceneProvider`, `useScene` from `@/components/sky/scene-provider` (existing: `{ hour, live, scrub(h), resume(), keyframes, setKeyframes }`).
- Produces: regression coverage only; no new exports.

- [ ] **Step 1: Add testing-library**

Run: `pnpm add -D @testing-library/react @testing-library/dom`
Expected: lockfile updated, install clean.

- [ ] **Step 2: Write the tests** (they should pass immediately — this is pinning existing behavior per the Phase 1 review)

```tsx
// src/components/sky/scene-provider.test.tsx
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneProvider, useScene } from "@/components/sky/scene-provider";

function Probe() {
  const { hour, live, scrub, resume } = useScene();
  return (
    <div>
      <span data-testid="hour">{hour === null ? "null" : hour.toFixed(2)}</span>
      <span data-testid="live">{String(live)}</span>
      <button onClick={() => scrub(3)}>scrub</button>
      <button onClick={resume}>resume</button>
    </div>
  );
}

describe("SceneProvider clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 13, 10, 0));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.documentElement.removeAttribute("style");
  });

  it("samples the visitor clock on mount and writes tokens to <html>", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    expect(screen.getByTestId("hour").textContent).toBe("10.00");
    expect(document.documentElement.style.getPropertyValue("--sky-top")).toMatch(/^#/);
  });

  it("ticks once a minute while live", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    act(() => {
      vi.setSystemTime(new Date(2026, 6, 13, 10, 30));
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("hour").textContent).toBe("10.50");
  });

  it("skips interval ticks while the tab is hidden", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      vi.setSystemTime(new Date(2026, 6, 13, 11, 0));
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("hour").textContent).toBe("10.00");
    hidden.mockRestore();
  });

  it("scrub freezes the clock; resume re-samples it", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    act(() => { screen.getByText("scrub").click(); });
    expect(screen.getByTestId("hour").textContent).toBe("3.00");
    expect(screen.getByTestId("live").textContent).toBe("false");
    act(() => {
      vi.setSystemTime(new Date(2026, 6, 13, 12, 0));
      vi.advanceTimersByTime(180_000);
    });
    expect(screen.getByTestId("hour").textContent).toBe("3.00");
    act(() => { screen.getByText("resume").click(); });
    expect(screen.getByTestId("hour").textContent).toBe("12.00");
    expect(screen.getByTestId("live").textContent).toBe("true");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `pnpm test -- src/components/sky/scene-provider.test.tsx`
Expected: PASS 4/4. If any fail, the provider has a real regression — investigate before touching the test.

- [ ] **Step 4: Full gates, commit**

Run: `pnpm test && pnpm build && pnpm lint`

```bash
git add package.json pnpm-lock.yaml src/components/sky/scene-provider.test.tsx
git commit -m "test: SceneProvider clock behavior under fake timers"
```

---

### Task 2: Area font loader + wordmark config + site content

**Files:**
- Create: `src/lib/area-font.ts`, `src/lib/wordmark-config.ts`, `src/lib/site-content.ts`
- Test: `src/lib/area-font.test.ts`

**Interfaces:**
- Produces: `AREA_FAMILY = "area-full"`; `extractAreaUrl(kitCss: string): string | null`; `loadAreaFont(): Promise<boolean>` (memoized; false on any failure or 4s timeout — never throws). `WORDMARK_TEXT: "JONOKANE"`; `wordmarkConfig` (shape below); `wordmarkFvs(wght: number): string`. `siteContent` (kicker, tagline, nav[{label,target}], placeholders{about,work,contact}).

- [ ] **Step 1: Write the failing loader tests**

```ts
// src/lib/area-font.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { extractAreaUrl, loadAreaFont, __resetAreaFontForTests } from "@/lib/area-font";

const KIT_FIXTURE = `
@font-face { font-family:"mae-variable"; src:url("https://use.typekit.net/af/mae/l?primer=x&fvd=n4&v=3") format("woff2"); }
@font-face {
font-family:"area-variable";
src:url("https://use.typekit.net/af/ad9eb8/000/31/l?primer=abc&fvd=n4&v=3") format("woff2"),url("https://use.typekit.net/af/ad9eb8/000/31/d?primer=abc&fvd=n4&v=3") format("woff");
font-weight:100 900; font-stretch:normal; font-style:normal;
}`;

describe("extractAreaUrl", () => {
  it("pulls area-variable's first (woff2) src url", () => {
    expect(extractAreaUrl(KIT_FIXTURE)).toBe(
      "https://use.typekit.net/af/ad9eb8/000/31/l?primer=abc&fvd=n4&v=3",
    );
  });
  it("returns null when area-variable is absent", () => {
    expect(extractAreaUrl('@font-face { font-family:"other"; src:url("x") }')).toBeNull();
  });
});

describe("loadAreaFont", () => {
  afterEach(() => {
    __resetAreaFontForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers area-full with honest descriptor ranges and resolves true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ text: () => Promise.resolve(KIT_FIXTURE) }));
    const load = vi.fn().mockResolvedValue(undefined);
    const ctor = vi.fn().mockImplementation(() => ({ load }));
    vi.stubGlobal("FontFace", ctor);
    const add = vi.fn();
    Object.defineProperty(document, "fonts", { configurable: true, value: { add } });

    await expect(loadAreaFont()).resolves.toBe(true);
    expect(ctor).toHaveBeenCalledWith(
      "area-full",
      expect.stringContaining("use.typekit.net"),
      { weight: "100 900", stretch: "100% 200%", style: "oblique 0deg 10deg" },
    );
    expect(add).toHaveBeenCalled();
  });

  it("resolves false when the kit fetch fails, without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(loadAreaFont()).resolves.toBe(false);
  });

  it("memoizes: second call returns the same promise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const p1 = loadAreaFont();
    const p2 = loadAreaFont();
    expect(p1).toBe(p2);
    await p1;
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/lib/area-font.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the loader**

```ts
// src/lib/area-font.ts

/**
 * Area variable font access (spec §5). Adobe's generated @font-face clamps
 * the registered wdth/slnt axes (font-stretch: normal, font-style: normal),
 * which freezes the wordmark's 195-wide stance. We fetch the kit CSS,
 * extract Area's own CDN URL, and re-register the SAME file as "area-full"
 * with honest descriptor ranges. The font never touches our origin — this
 * corrects CSS metadata only (deliberate licensing call, documented in the
 * spec).
 */
const KIT_CSS_URL = "https://use.typekit.net/aqv1jgr.css";
const LOAD_TIMEOUT_MS = 4000;

export const AREA_FAMILY = "area-full";

/** Pull area-variable's first (woff2) src URL out of the kit CSS. */
export function extractAreaUrl(kitCss: string): string | null {
  const match = kitCss.match(/area-variable[^}]*?src:url\("([^"]+)"\)/s);
  return match ? match[1] : null;
}

let areaPromise: Promise<boolean> | null = null;

/** Test hook: clear the memoized load so each test starts fresh. */
export function __resetAreaFontForTests(): void {
  areaPromise = null;
}

/**
 * Load + register area-full. Resolves true when usable, false on any
 * failure or after ~4s — callers render the fallback rather than blocking.
 */
export function loadAreaFont(): Promise<boolean> {
  if (areaPromise) return areaPromise;
  areaPromise = (async () => {
    try {
      const attempt = (async () => {
        const css = await (await fetch(KIT_CSS_URL)).text();
        const url = extractAreaUrl(css);
        if (!url) return false;
        const face = new FontFace(AREA_FAMILY, `url("${url}") format("woff2")`, {
          weight: "100 900",
          stretch: "100% 200%",
          style: "oblique 0deg 10deg",
        });
        await face.load();
        document.fonts.add(face);
        return true;
      })();
      const timeout = new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), LOAD_TIMEOUT_MS),
      );
      return await Promise.race([attempt, timeout]);
    } catch {
      return false;
    }
  })();
  return areaPromise;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test -- src/lib/area-font.test.ts` → PASS.

- [ ] **Step 5: Write the config + content modules** (data only — engine tests in later tasks consume them)

```ts
// src/lib/wordmark-config.ts

/**
 * The locked JONOKANE wordmark recipe (spec §5) — tuned in wordmark lab
 * v12 during the 2026-07 design run. Single source of truth; components
 * never hardcode these values.
 */
export const WORDMARK_TEXT = "JONOKANE";

export const wordmarkConfig = {
  /** area-full is the unclamped re-registration; area-variable the kit fallback. */
  family: '"area-full", "area-variable", sans-serif',
  axes: { wght: 274, wdth: 195, INKT: 8, slnt: 0 },
  trackEm: 0.05,
  sizeVw: 7,
  /** Hand-tuned optical pair kerns, thousandths of an em: J·O O·N N·O O·K K·A A·N N·E */
  pairKernsMem: [30, 0, 0, 0, 165, 45, -70],
  build: {
    durMs: 1250,
    staggerMs: 130,
    fromScale: 2,
    fromBlurPx: 14,
    fromDropVh: -18,
    /** gsap ease equivalent of cubic-bezier(0.16, 1, 0.3, 1) */
    ease: "expo.out",
  },
  hover: {
    radiusPx: 240,
    strengthPct: 65,
    lagMs: 220,
    carveToWght: 100,
  },
} as const;

/** font-variation-settings string at a given weight, other axes at rest. */
export function wordmarkFvs(wght: number): string {
  const { wdth, INKT, slnt } = wordmarkConfig.axes;
  return `'slnt' ${slnt}, 'wght' ${Math.round(wght)}, 'wdth' ${wdth}, 'INKT' ${INKT}`;
}
```

```ts
// src/lib/site-content.ts

/**
 * All site copy lives here, never in JSX (spec §15). Section copy for
 * About/Work/Contact is placeholder until Phases 3–5 build the real
 * sections.
 */
export const siteContent = {
  kicker: "Product Design Leader & Strategist",
  tagline:
    "I shape strategy, build teams, lead design, and code the front end that brings it to life.",
  nav: [
    { label: "About", target: "about" },
    { label: "Work", target: "work" },
    { label: "Contact", target: "contact" },
  ],
  placeholders: {
    about: "The story assembles here next — four beats collecting into an About wall.",
    work: "The work shelf arrives here — five case studies, read in full, on one horizontal shelf.",
    contact: "The contact form lands here. Until then: jono@collaya.com.",
  },
} as const;
```

- [ ] **Step 6: Gates, commit**

Run: `pnpm test && pnpm build && pnpm lint`

```bash
git add src/lib/area-font.ts src/lib/area-font.test.ts src/lib/wordmark-config.ts src/lib/site-content.ts
git commit -m "feat: area-full font loader (unclamped re-registration) + wordmark/site config"
```

---

### Task 3: Hero component — font gate, letters, build-in; old hero unmounted

**Files:**
- Create: `src/components/hero/hero.tsx`, `src/components/hero/hero.module.css`, `src/lib/use-reduced-motion.ts`
- Modify: `src/app/page.tsx` (swap heroes — see Step 4 for the exact section replacement; the rest of the page is restructured in Task 7)

**Interfaces:**
- Consumes: `loadAreaFont`, `AREA_FAMILY` (Task 2); `wordmarkConfig`, `WORDMARK_TEXT`, `wordmarkFvs` (Task 2); `siteContent` (Task 2); `gsap` from `@/lib/gsap`.
- Produces: `Hero` component; `useReducedMotionPref(): boolean`; inside Hero, the letter spans carry `data-letter` and refs used by Tasks 4–6; Hero exposes `data-settled` on its root when the build-in completes (Tasks 4/5/6 key off the same internal `settled` state via the wiring added in those tasks — the DOM attribute is for styling and manual inspection).

- [ ] **Step 1: Reduced-motion hook** (hydration-safe: false on server and first client render)

```ts
// src/lib/use-reduced-motion.ts
"use client";

import { useEffect, useState } from "react";

/**
 * prefers-reduced-motion, hydration-safe: returns false during SSR and the
 * first client render (matching the server), then the real value + live
 * updates. The same pattern the parked hero learned the hard way.
 */
export function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- media queries are client-only
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Hero module CSS**

```css
/* src/components/hero/hero.module.css — hero-only styles (spec §15) */
.section {
  min-height: 100vh;
  display: flex;
  align-items: center; /* mid-left hero, locked in prototyping */
}

.inner {
  padding-left: 7vw;
  padding-right: 7vw;
  max-width: 100%;
}

.kicker {
  display: block;
  margin-bottom: 1.1rem;
  opacity: 0;
  transition: opacity 0.8s ease 0.1s;
}

/* the in-flow wordmark reserves layout + provides measurement; the fixed
   live layer (Task 6 morph) renders on top of it */
.wordmark {
  font-family: var(--wordmark-family);
  line-height: 1.1;
  white-space: nowrap;
  color: var(--ink);
  text-shadow: 0 2px 30px var(--text-glow);
}

.wordmark span {
  display: inline-block;
  opacity: 0; /* revealed by the build-in (or instantly under reduced motion) */
  will-change: transform, opacity, filter;
}

.tagline {
  display: block;
  margin-top: 1.3rem;
  line-height: 1.45;
  white-space: nowrap;
  color: var(--ink);
  opacity: 0;
  transition: opacity 0.8s ease 0.25s;
}

.section[data-settled="true"] .kicker {
  opacity: 1;
}

.section[data-settled="true"] .tagline {
  opacity: 0.85;
}
```

- [ ] **Step 3: The Hero component**

```tsx
// src/components/hero/hero.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { loadAreaFont } from "@/lib/area-font";
import { WORDMARK_TEXT, wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import styles from "@/components/hero/hero.module.css";

type FontState = "loading" | "ready" | "fallback";

/**
 * The JONOKANE hero (spec §5): render-gated on the area-full FontFace,
 * per-letter build-in (once, then still), hand-tuned pair kerning.
 * Lockup (Task 4), carve (Task 5), and the header morph (Task 6) wire into
 * the refs this component owns.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [fontState, setFontState] = useState<FontState>("loading");
  const [settled, setSettled] = useState(false);
  const reducedMotion = useReducedMotionPref();

  useEffect(() => {
    let cancelled = false;
    loadAreaFont().then((ok) => {
      if (!cancelled) setFontState(ok ? "ready" : "fallback");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Build-in: runs once when the font resolves. Under reduced motion (or
     font fallback) the letters simply appear — no flight. */
  useEffect(() => {
    if (fontState === "loading" || settled) return;
    const letters = wordmarkRef.current?.querySelectorAll<HTMLElement>("[data-letter]");
    if (!letters || letters.length === 0) return;

    if (reducedMotion || fontState === "fallback") {
      gsap.set(letters, { opacity: 1 });
      setSettled(true);
      return;
    }

    const { durMs, staggerMs, fromScale, fromBlurPx, fromDropVh, ease } = wordmarkConfig.build;
    const tl = gsap.timeline({ onComplete: () => setSettled(true) });
    tl.fromTo(
      letters,
      {
        opacity: 0,
        scale: fromScale,
        y: () => (fromDropVh / 100) * window.innerHeight,
        filter: `blur(${fromBlurPx}px)`,
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: durMs / 1000,
        ease,
        stagger: staggerMs / 1000,
      },
    );
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- build-in runs once per font resolution; reducedMotion is read at that moment
  }, [fontState]);

  const letters = [...WORDMARK_TEXT];
  const kerns = wordmarkConfig.pairKernsMem;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      data-settled={settled || undefined}
      aria-label="Introduction"
    >
      <div className={styles.inner}>
        <h1 className="sr-only">Jono Kane</h1>
        <span className={`${styles.kicker} text-kicker text-sm`}>{siteContent.kicker}</span>
        <div
          ref={wordmarkRef}
          className={styles.wordmark}
          aria-hidden="true"
          style={
            {
              "--wordmark-family": wordmarkConfig.family,
              fontSize: `${wordmarkConfig.sizeVw}vw`,
              letterSpacing: `${wordmarkConfig.trackEm}em`,
              fontVariationSettings:
                fontState === "fallback" ? undefined : wordmarkFvs(wordmarkConfig.axes.wght),
            } as React.CSSProperties
          }
        >
          {letters.map((ch, i) => (
            <span
              key={i}
              data-letter
              style={i > 0 && kerns[i - 1] ? { marginLeft: `${kerns[i - 1] / 1000}em` } : undefined}
            >
              {ch}
            </span>
          ))}
        </div>
        <span className={styles.tagline}>{siteContent.tagline}</span>
      </div>
    </section>
  );
}
```

Also add the `sr-only` utility if Tailwind's preflight doesn't already provide it — Tailwind v4 ships `sr-only` as a core utility; no CSS change needed.

- [ ] **Step 4: Swap heroes on the page** — in `src/app/page.tsx`: remove the `HeroWordmark` import and the entire `{/* Hero */}` `<section>…</section>` block (lines ~29–67), replace with `<Hero />` (import `{ Hero } from "@/components/hero/hero"`). Leave everything else (including the second placeholder section and `motion` usages) untouched — Task 7 restructures the rest. The old wordmark tune panel disappears with `HeroWordmark`.

- [ ] **Step 5: Visual verification**

`pnpm dev` → JONOKANE builds in letter-by-letter (expo, l→r, blur-fall), kicker + tagline fade in after, then everything holds still; letters show wide Area (195) at weight 274. With DevTools reduced-motion emulation: letters appear via simple fade, no flight. If no browser available: note delegation to controller.

- [ ] **Step 6: Gates, commit**

Run: `pnpm test && pnpm build && pnpm lint`

```bash
git add src/components/hero/ src/lib/use-reduced-motion.ts src/app/page.tsx
git commit -m "feat: JONOKANE hero — area font gate, kerned letters, one-time build-in"
```

---

### Task 4: Type lockup

**Files:**
- Create: `src/lib/lockup-math.ts`, `src/components/hero/use-hero-lockup.ts`
- Test: `src/lib/lockup-math.test.ts`
- Modify: `src/components/hero/hero.tsx` (wire the hook), `src/components/hero/hero.module.css` (kicker/tagline inline-block for measurement)

**Interfaces:**
- Consumes: Hero refs (Task 3).
- Produces: `computeLockup(input: LockupInput): LockupResult` (pure, tested); `useHeroLockup(opts: { wordmarkRef, kickerRef, taglineRef, innerRef, active: boolean }): void`. Task 6's morph re-measures AFTER lockup applies (lockup runs first on settle; morph measures on ScrollTrigger refresh).

- [ ] **Step 1: Failing math tests**

```ts
// src/lib/lockup-math.test.ts
import { describe, expect, it } from "vitest";
import { computeLockup } from "@/lib/lockup-math";

const base = {
  availPx: 1000,
  wordmarkPx: 900,
  wordmarkFontPx: 100,
  jonoPx: 450,
  kickerPx: 600,
  kickerFontPx: 16,
  taglinePxAt100: 2000,
};

describe("computeLockup", () => {
  it("keeps the wordmark size when it fits", () => {
    expect(computeLockup(base).wordmarkFontPx).toBe(100);
  });

  it("shrinks (never grows) the wordmark to the available width", () => {
    const r = computeLockup({ ...base, wordmarkPx: 2000 });
    expect(r.wordmarkFontPx).toBeCloseTo(50, 5); // 100 * 1000/2000
    const r2 = computeLockup({ ...base, wordmarkPx: 500 });
    expect(r2.wordmarkFontPx).toBe(100); // no expansion
  });

  it("locks the kicker to the JONO segment width", () => {
    // kicker at 16px is 600px wide; JONO is 450px → 16 * 450/600 = 12
    expect(computeLockup(base).kickerFontPx).toBeCloseTo(12, 5);
  });

  it("scales the kicker against the SHRUNK jono width when the wordmark shrinks", () => {
    const r = computeLockup({ ...base, wordmarkPx: 2000 }); // scale 0.5 → jono 225
    expect(r.kickerFontPx).toBeCloseTo(16 * 225 / 600, 5);
  });

  it("fits the tagline to one line spanning the full wordmark width", () => {
    // full width 900 (fits) → 100px-font line is 2000px → 100 * (900*0.995)/2000
    expect(computeLockup(base).taglineFontPx).toBeCloseTo((900 * 0.995) / 20, 5);
  });

  it("guards degenerate measurements by returning current sizes", () => {
    const r = computeLockup({ ...base, kickerPx: 0, taglinePxAt100: 0 });
    expect(r.kickerFontPx).toBe(16);
    expect(r.taglineFontPx).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm test -- src/lib/lockup-math.test.ts` → module not found.

- [ ] **Step 3: Implement the math**

```ts
// src/lib/lockup-math.ts

/**
 * Pure math for the hero type lockup (spec §5):
 * - the wordmark shrinks to the available measure, never grows;
 * - the kicker's width locks to the JONO segment;
 * - the tagline sets on one line spanning the full JONOKANE width.
 * All inputs are pixel measurements taken by use-hero-lockup.ts.
 */
export interface LockupInput {
  /** Available content width (the hero inner box). */
  availPx: number;
  /** Rendered wordmark width at `wordmarkFontPx`. */
  wordmarkPx: number;
  wordmarkFontPx: number;
  /** Width of the JONO segment (letters 0–3) at the same font size. */
  jonoPx: number;
  /** Kicker width at `kickerFontPx`. */
  kickerPx: number;
  kickerFontPx: number;
  /** Tagline single-line width measured at a 100px font. */
  taglinePxAt100: number;
}

export interface LockupResult {
  wordmarkFontPx: number;
  kickerFontPx: number;
  taglineFontPx: number;
}

const TAGLINE_FILL = 0.995; // slight underfill so the line never wraps

export function computeLockup(input: LockupInput): LockupResult {
  const scale =
    input.wordmarkPx > 0 ? Math.min(1, input.availPx / input.wordmarkPx) : 1;
  const wordmarkFontPx = input.wordmarkFontPx * scale;
  const jonoScaled = input.jonoPx * scale;
  const fullScaled = input.wordmarkPx * scale;

  const kickerFontPx =
    input.kickerPx > 0
      ? (input.kickerFontPx * jonoScaled) / input.kickerPx
      : input.kickerFontPx;

  const taglineFontPx =
    input.taglinePxAt100 > 0
      ? (100 * fullScaled * TAGLINE_FILL) / input.taglinePxAt100
      : 16;

  return { wordmarkFontPx, kickerFontPx, taglineFontPx };
}
```

- [ ] **Step 4: Run to verify pass** — `pnpm test -- src/lib/lockup-math.test.ts` → PASS.

- [ ] **Step 5: The measurement hook**

```ts
// src/components/hero/use-hero-lockup.ts
"use client";

import { useEffect, type RefObject } from "react";
import { computeLockup } from "@/lib/lockup-math";
import { wordmarkConfig } from "@/lib/wordmark-config";

interface LockupRefs {
  innerRef: RefObject<HTMLDivElement | null>;
  wordmarkRef: RefObject<HTMLDivElement | null>;
  kickerRef: RefObject<HTMLElement | null>;
  taglineRef: RefObject<HTMLElement | null>;
  /** Measure only once the font is ready/settled — fallback metrics lie. */
  active: boolean;
}

/** Measures the rendered hero and applies the lockup; re-runs on resize. */
export function useHeroLockup({ innerRef, wordmarkRef, kickerRef, taglineRef, active }: LockupRefs): void {
  useEffect(() => {
    if (!active) return;
    const inner = innerRef.current;
    const wordmark = wordmarkRef.current;
    const kicker = kickerRef.current;
    const tagline = taglineRef.current;
    if (!inner || !wordmark || !kicker || !tagline) return;

    const apply = () => {
      /* reset to base sizes so measurements are idempotent */
      wordmark.style.fontSize = `${wordmarkConfig.sizeVw}vw`;
      kicker.style.fontSize = "";
      tagline.style.fontSize = "100px";
      tagline.style.width = "auto";

      const letters = wordmark.querySelectorAll<HTMLElement>("[data-letter]");
      if (letters.length < 4) return;
      const first = letters[0].getBoundingClientRect();
      const fourth = letters[3].getBoundingClientRect();
      const last = letters[letters.length - 1].getBoundingClientRect();

      const result = computeLockup({
        availPx: inner.clientWidth,
        wordmarkPx: last.right - first.left,
        wordmarkFontPx: parseFloat(getComputedStyle(wordmark).fontSize),
        jonoPx: fourth.right - first.left,
        kickerPx: kicker.getBoundingClientRect().width,
        kickerFontPx: parseFloat(getComputedStyle(kicker).fontSize),
        taglinePxAt100: tagline.scrollWidth,
      });

      wordmark.style.fontSize = `${result.wordmarkFontPx.toFixed(2)}px`;
      kicker.style.fontSize = `${result.kickerFontPx.toFixed(2)}px`;
      tagline.style.fontSize = `${result.taglineFontPx.toFixed(2)}px`;
    };

    apply();
    let raf = 0;
    const onResize = () => {
      /* coalesce resize storms into the shared gsap ticker's next frame is
         unnecessary here — a rAF-once debounce keeps this passive listener
         cheap without adding a persistent loop */
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [active, innerRef, wordmarkRef, kickerRef, taglineRef]);
}
```

- [ ] **Step 6: Wire into Hero** — in `hero.tsx`: add `innerRef`, `kickerRef`, `taglineRef` (`useRef`), attach to the inner div / kicker span / tagline span, and call `useHeroLockup({ innerRef, wordmarkRef, kickerRef, taglineRef, active: settled })`. In `hero.module.css`, give `.kicker` and `.tagline` `display: inline-block; white-space: nowrap;` (replace the existing `display: block` lines) so their widths are measurable, and wrap each in a block-level parent div in the JSX (`<div><span …/></div>`) so they still stack vertically.

- [ ] **Step 7: Visual verification** — kicker ends exactly at the JONO "O"; tagline is one line ending at the final "E"; both re-lock while resizing the window; wordmark shrinks (never grows) when the window is narrow.

- [ ] **Step 8: Gates, commit**

```bash
git add src/lib/lockup-math.ts src/lib/lockup-math.test.ts src/components/hero/use-hero-lockup.ts src/components/hero/hero.tsx src/components/hero/hero.module.css
git commit -m "feat: hero type lockup — kicker to JONO, one-line tagline, shrink-to-fit"
```

---

### Task 5: Carve hover engine

**Files:**
- Create: `src/lib/carve-engine.ts`
- Test: `src/lib/carve-engine.test.ts`
- Modify: `src/components/hero/hero.tsx` (wire pointer events + engine lifecycle)

**Interfaces:**
- Consumes: `rawInfluence(distPx, cfg: HoverConfig)`, `smoothingFactor(dtMs, lagMs)` from `@/lib/wordmark-engine` (parked engine's exported pure math — reused, not duplicated; `HoverConfig` type from `@/lib/hero-config`); `wordmarkConfig.hover`, `wordmarkFvs` (Task 2); `gsap` from `@/lib/gsap`.
- Produces: `carveWeight(influence: number): number` (pure, tested); `createCarveEngine(letterEls: HTMLElement[]): CarveEngine` where `CarveEngine = { start(): void; stop(): void; setPointer(x: number, y: number): void; clearPointer(): void; refreshRects(): void; setEnabled(enabled: boolean): void }`. Task 6 calls `setEnabled(false)` while the morph is in flight.

- [ ] **Step 1: Failing pure-math tests**

```ts
// src/lib/carve-engine.test.ts
import { describe, expect, it } from "vitest";
import { carveWeight } from "@/lib/carve-engine";
import { wordmarkConfig } from "@/lib/wordmark-config";

describe("carveWeight", () => {
  it("rests at the config weight with zero influence", () => {
    expect(carveWeight(0)).toBe(wordmarkConfig.axes.wght); // 274
  });
  it("carves toward carveToWght at full influence, scaled by strength", () => {
    // 274 - (274-100) * 1 * 0.65 = 274 - 113.1 = 160.9
    expect(carveWeight(1)).toBeCloseTo(160.9, 5);
  });
  it("is linear in influence", () => {
    expect(carveWeight(0.5)).toBeCloseTo((carveWeight(0) + carveWeight(1)) / 2, 5);
  });
  it("clamps influence into [0, 1]", () => {
    expect(carveWeight(2)).toBeCloseTo(carveWeight(1), 5);
    expect(carveWeight(-1)).toBe(carveWeight(0));
  });
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm test -- src/lib/carve-engine.test.ts` → module not found.

- [ ] **Step 3: Implement the engine**

```ts
// src/lib/carve-engine.ts

/**
 * Cursor weight-carve for the hero wordmark (spec §5): letters thin toward
 * carveToWght under the pointer with smooth distance falloff and lagged
 * easing. The influence math is REUSED from the parked TotalBlack engine
 * (spec §13) — same falloff, same exponential smoothing. Frame work rides
 * the shared gsap ticker (one-RAF-loop rule).
 */
import { gsap } from "@/lib/gsap";
import type { HoverConfig } from "@/lib/hero-config";
import { rawInfluence, smoothingFactor } from "@/lib/wordmark-engine";
import { wordmarkConfig, wordmarkFvs } from "@/lib/wordmark-config";

const { radiusPx, strengthPct, lagMs, carveToWght } = wordmarkConfig.hover;
const REST_WGHT = wordmarkConfig.axes.wght;

/** HoverConfig-shaped view of our carve settings for the reused math. */
const HOVER_CFG: HoverConfig = {
  mode: "carve",
  radius: radiusPx,
  strengthPct,
  lagMs,
  falloff: "smooth",
};

/** Letter weight for a smoothed influence value (pure; exported for tests). */
export function carveWeight(influence: number): number {
  const clamped = Math.min(1, Math.max(0, influence));
  return REST_WGHT - (REST_WGHT - carveToWght) * clamped * (strengthPct / 100);
}

export interface CarveEngine {
  start(): void;
  stop(): void;
  setPointer(x: number, y: number): void;
  clearPointer(): void;
  refreshRects(): void;
  setEnabled(enabled: boolean): void;
}

interface LetterState {
  el: HTMLElement;
  cx: number;
  cy: number;
  influence: number;
}

export function createCarveEngine(letterEls: HTMLElement[]): CarveEngine {
  const letters: LetterState[] = letterEls.map((el) => ({ el, cx: 0, cy: 0, influence: 0 }));
  let pointer: { x: number; y: number } | null = null;
  let enabled = true;
  let running = false;
  let lastTime = 0;

  function refreshRects(): void {
    for (const s of letters) {
      const r = s.el.getBoundingClientRect();
      s.cx = r.left + r.width / 2;
      s.cy = r.top + r.height / 2;
    }
  }

  /** gsap ticker time is SECONDS — convert to ms (house rule). */
  function tick(time: number): void {
    const now = time * 1000;
    const dt = Math.min(64, Math.max(0, now - lastTime));
    lastTime = now;
    const k = smoothingFactor(dt, lagMs);
    let anyActive = false;
    for (const s of letters) {
      const target =
        enabled && pointer ? rawInfluence(Math.hypot(pointer.x - s.cx, pointer.y - s.cy), HOVER_CFG) : 0;
      s.influence += (target - s.influence) * k;
      if (s.influence > 0.001 || target > 0) anyActive = true;
      s.el.style.fontVariationSettings = wordmarkFvs(carveWeight(s.influence));
    }
    /* settle detection: when nothing is influenced, stop writing styles */
    if (!anyActive && !pointer) {
      for (const s of letters) s.el.style.fontVariationSettings = wordmarkFvs(REST_WGHT);
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = gsap.ticker.time * 1000;
      refreshRects();
      gsap.ticker.add(tick);
    },
    stop() {
      if (!running) return;
      running = false;
      gsap.ticker.remove(tick);
    },
    setPointer(x, y) {
      pointer = { x, y };
    },
    clearPointer() {
      pointer = null;
    },
    refreshRects,
    setEnabled(value) {
      enabled = value;
      if (!value) pointer = null;
    },
  };
}
```

- [ ] **Step 4: Run to verify pass** — `pnpm test -- src/lib/carve-engine.test.ts` → PASS (plus the whole suite: the parked engine's tests must be untouched).

- [ ] **Step 5: Wire into Hero** — in `hero.tsx`, add an effect gated on `settled && fontState === "ready" && !reducedMotion`:

```tsx
useEffect(() => {
  if (!settled || fontState !== "ready" || reducedMotion) return;
  if (!window.matchMedia("(hover: hover)").matches) return; // touch: inert
  const letterEls = Array.from(
    wordmarkRef.current?.querySelectorAll<HTMLElement>("[data-letter]") ?? [],
  );
  if (letterEls.length === 0) return;
  const engine = createCarveEngine(letterEls);
  carveRef.current = engine;

  const io = new IntersectionObserver(([entry]) =>
    entry.isIntersecting ? engine.start() : engine.stop(),
  );
  if (sectionRef.current) io.observe(sectionRef.current);
  const onMove = (e: PointerEvent) => engine.setPointer(e.clientX, e.clientY);
  const onLeave = () => engine.clearPointer();
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("mouseleave", onLeave);
  const onResize = () => engine.refreshRects();
  window.addEventListener("resize", onResize);

  return () => {
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("mouseleave", onLeave);
    window.removeEventListener("resize", onResize);
    engine.stop();
    carveRef.current = null;
  };
}, [settled, fontState, reducedMotion]);
```

with `const carveRef = useRef<CarveEngine | null>(null);` (imported type). The lockup hook changes letter positions when it applies — call `carveRef.current?.refreshRects()` after lockup by having the carve effect depend on `settled` (lockup applies on settle before the carve effect's `refreshRects` runs via `start()`); the resize listener covers later changes.

- [ ] **Step 6: Visual verification** — sweep the cursor across JONOKANE: letters thin toward 100 under the pointer with a soft 240px falloff and lag; leaves settle back to 274. No effect with DevTools touch emulation or reduced motion.

- [ ] **Step 7: Gates, commit**

```bash
git add src/lib/carve-engine.ts src/lib/carve-engine.test.ts src/components/hero/hero.tsx
git commit -m "feat: cursor weight-carve on the hero wordmark (shared-ticker engine)"
```

---

### Task 6: Site header + wordmark morph + scroll-spy

**Files:**
- Create: `src/components/site-header.tsx`, `src/lib/use-scroll-spy.ts`, `src/components/hero/use-wordmark-morph.ts`
- Modify: `src/components/hero/hero.tsx` (fixed live wordmark layer + morph wiring), `src/components/hero/hero.module.css`, `src/app/globals.css` (header visibility rules), `src/app/page.tsx` (mount `<SiteHeader />`)

**Interfaces:**
- Consumes: Hero internals (Task 3–5), `siteContent.nav`, `ScrollTrigger`/`gsap` from `@/lib/gsap`, `useReducedMotionPref` (Task 3).
- Produces: `NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot"` and `SiteHeader` from `@/components/site-header`; `useScrollSpy(ids: string[]): string | null`; `useWordmarkMorph(opts: { liveRef, flowRef, active: boolean, onProgress?: (p: number) => void }): void`. Header visibility contract: the morph (or the reduced-motion fallback) toggles the `header-on` class on `<html>`.

- [ ] **Step 1: Scroll spy hook**

```ts
// src/lib/use-scroll-spy.ts
"use client";

import { useEffect, useState } from "react";

/** Which of `ids` currently occupies the viewport's focus band. */
export function useScrollSpy(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.intersectionRatio);
          else visible.delete(e.target.id);
        }
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        setActive(best);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps -- stable string key for the array
  return active;
}
```

- [ ] **Step 2: Site header**

```tsx
// src/components/site-header.tsx
"use client";

import { getLenis } from "@/components/smooth-scroll";
import { siteContent } from "@/lib/site-content";
import { WORDMARK_TEXT, wordmarkConfig } from "@/lib/wordmark-config";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useScrollSpy } from "@/lib/use-scroll-spy";

export const NAV_WORDMARK_SLOT_ID = "nav-wordmark-slot";

/**
 * The floating nav pill (spec §6). It has no opinion about when it shows:
 * the wordmark morph (or its reduced-motion fallback) toggles `header-on`
 * on <html>, and globals.css transitions the pill in. The slot span is the
 * morph's landing target — invisible except under reduced motion, where
 * the morph doesn't run and the slot itself displays the wordmark.
 */
export function SiteHeader() {
  const reducedMotion = useReducedMotionPref();
  const active = useScrollSpy(siteContent.nav.map((n) => n.target));

  const go = (target: string) => {
    const el = document.getElementById(target);
    if (!el) return;
    history.pushState(null, "", `#${target}`);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -96 });
    else el.scrollIntoView();
  };

  return (
    <header className="site-header slab fixed inset-x-[2vw] top-[14px] z-40 flex items-center gap-[3vw] !rounded-[15px] !px-6 !py-3">
      <button
        type="button"
        onClick={() => {
          history.pushState(null, "", location.pathname);
          getLenis()?.scrollTo(0);
        }}
        className="border-0 bg-transparent p-0 text-left"
        aria-label="Back to top"
      >
        <span
          id={NAV_WORDMARK_SLOT_ID}
          className="text-ink"
          style={{
            fontFamily: wordmarkConfig.family,
            fontSize: "1.05rem",
            letterSpacing: `${wordmarkConfig.trackEm}em`,
            opacity: reducedMotion ? 1 : 0,
          }}
        >
          {WORDMARK_TEXT}
        </span>
      </button>
      <nav aria-label="Site" className="ml-auto flex gap-7">
        {siteContent.nav.map(({ label, target }) => (
          <button
            key={target}
            type="button"
            onClick={() => go(target)}
            aria-current={active === target ? "true" : undefined}
            className={`border-0 bg-transparent p-0 text-sm tracking-wide transition-colors ${
              active === target ? "text-ink underline underline-offset-8" : "text-sub"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Expose Lenis** — in `src/components/smooth-scroll.tsx`, add a module-level singleton without changing the existing integration:

```tsx
import type Lenis from "lenis";

let lenisInstance: Lenis | null = null;

/** The app's Lenis instance (null before mount / after unmount). */
export function getLenis(): Lenis | null {
  return lenisInstance;
}
```

and inside the existing effect, after `if (!lenis) return;` add `lenisInstance = lenis;`, and in the cleanup add `lenisInstance = null;`.

- [ ] **Step 4: Header visibility CSS** — append to `src/app/globals.css` inside `@layer components`:

```css
  /* The nav pill rides in when the wordmark morph (or its reduced-motion
     fallback) sets `header-on` on <html>. */
  .site-header {
    opacity: 0;
    transform: translateY(-16px);
    visibility: hidden;
    transition:
      opacity 0.35s ease,
      transform 0.45s cubic-bezier(0.3, 0.8, 0.3, 1),
      visibility 0s 0.45s;
  }

  html.header-on .site-header {
    opacity: 1;
    transform: none;
    visibility: visible;
    transition-delay: 0s;
  }
```

- [ ] **Step 5: The morph hook**

```ts
// src/components/hero/use-wordmark-morph.ts
"use client";

import { useEffect, type RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { NAV_WORDMARK_SLOT_ID } from "@/components/site-header";

const HEADER_ON_AT = 0.85;

interface MorphOpts {
  /** The fixed live wordmark layer (what actually flies). */
  liveRef: RefObject<HTMLDivElement | null>;
  /** The in-flow wordmark (layout + measurement source). */
  flowRef: RefObject<HTMLDivElement | null>;
  /** settled && font ready && !reducedMotion */
  active: boolean;
  onProgress?: (p: number) => void;
}

/**
 * Scroll-scrubbed FLIP morph (spec §6): the wordmark flies from its hero
 * position into the header slot over the first ~0.85 viewport of scroll,
 * reversibly. Runs on ScrollTrigger (shared gsap ticker).
 */
export function useWordmarkMorph({ liveRef, flowRef, active, onProgress }: MorphOpts): void {
  useEffect(() => {
    if (!active) return;
    const live = liveRef.current;
    const flow = flowRef.current;
    const slot = document.getElementById(NAV_WORDMARK_SLOT_ID);
    if (!live || !flow || !slot) return;

    /* document-space start rect (flow wordmark) + viewport-space target
       (the header is position:fixed, so the slot rect is scroll-stable) */
    let start = { left: 0, top: 0, height: 1 };
    let target = { left: 0, top: 0, height: 1 };
    const measure = () => {
      const f = flow.getBoundingClientRect();
      start = { left: f.left, top: f.top + window.scrollY, height: f.height };
      const s = slot.getBoundingClientRect();
      target = { left: s.left, top: s.top, height: s.height };
    };

    const smooth = (t: number) => t * t * (3 - 2 * t);
    const apply = (p: number) => {
      const e = smooth(p);
      const startTopInViewport = start.top - window.scrollY;
      const x = gsap.utils.interpolate(start.left, target.left, e);
      const y = gsap.utils.interpolate(startTopInViewport, target.top, e);
      const scale = gsap.utils.interpolate(1, target.height / start.height, e);
      gsap.set(live, { x, y, scale });
      document.documentElement.classList.toggle("header-on", p > HEADER_ON_AT);
      onProgress?.(p);
    };

    measure();
    apply(0);
    const st = ScrollTrigger.create({
      start: 0,
      end: () => window.innerHeight * 0.85,
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefreshInit: measure,
      onRefresh: (self) => apply(self.progress),
    });

    return () => {
      st.kill();
      document.documentElement.classList.remove("header-on");
      gsap.set(live, { clearProps: "transform" });
    };
  }, [active, liveRef, flowRef, onProgress]);
}
```

- [ ] **Step 6: Restructure Hero for the fixed live layer** — in `hero.tsx`:

1. The existing in-flow wordmark div becomes the **flow copy**: keep its ref as `wordmarkRef` (lockup + measurement source) and add `data-wordmark-flow`; its letters stay the build-in/carve targets **only when the morph is inactive** — under the morph architecture the *live* layer is what animates, so: render the same letter markup twice via a small internal `WordmarkLetters` component (same file):

```tsx
function WordmarkLetters() {
  const kerns = wordmarkConfig.pairKernsMem;
  return (
    <>
      {[...WORDMARK_TEXT].map((ch, i) => (
        <span
          key={i}
          data-letter
          style={i > 0 && kerns[i - 1] ? { marginLeft: `${kerns[i - 1] / 1000}em` } : undefined}
        >
          {ch}
        </span>
      ))}
    </>
  );
}
```

2. Flow copy: `visibility: hidden` via module CSS class `.wordmarkFlow` (still measured by lockup; add `visibility: hidden;` to a new rule `.wordmarkFlow { visibility: hidden; }` and keep the shared `.wordmark` typography class on both copies). Its letters no longer need `data-letter` opacity animation — but keep markup identical (the `[data-letter]` opacity: 0 base style is fine on a hidden element).
3. Live copy: a new `<div ref={liveWordmarkRef} className={styles.wordmark + " " + styles.wordmarkLive} aria-hidden="true">` rendered as a sibling, with module CSS:

```css
.wordmarkLive {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 41; /* above the header pill (z-40) so it can land on the slot */
  transform-origin: top left;
  pointer-events: none;
}
```

The live copy gets the same inline style object (family/size/track/fvs) — extract that object into a `wordmarkStyle` const used by both. **Lockup applies font-size to BOTH copies** (in `use-hero-lockup.ts`, accept an extra optional `mirrorRef` and set the same `fontSize` on it). Build-in (Task 3 effect) and carve (Task 5 effect) retarget their letter queries to `liveWordmarkRef`. The morph positions the live copy over the flow copy at p=0 (`apply(0)` after `measure()` — exact overlay because both share typography and lockup size).
4. Wire the morph:

```tsx
useWordmarkMorph({
  liveRef: liveWordmarkRef,
  flowRef: wordmarkRef,
  active: settled && fontState === "ready" && !reducedMotion,
  onProgress: (p) => carveRef.current?.setEnabled(p === 0),
});
```

5. Reduced-motion header fallback (morph inactive): add to the same Hero file an effect:

```tsx
useEffect(() => {
  if (!reducedMotion) return;
  const onScroll = () => {
    document.documentElement.classList.toggle("header-on", window.scrollY > window.innerHeight * 0.5);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    document.documentElement.classList.remove("header-on");
  };
}, [reducedMotion]);
```

Under reduced motion the live copy is hidden (`gsap.set` never runs; add `.wordmarkLive { visibility: hidden }` override when `html` lacks the morph — simplest: in the Hero JSX, don't render the live copy at all when `reducedMotion` is true, and keep the flow copy visible instead: conditionally swap the `.wordmarkFlow` hidden class). Concretely: `className={reducedMotion ? styles.wordmark : `${styles.wordmark} ${styles.wordmarkFlow}`}` on the flow copy, and `{!reducedMotion && <div ref={liveWordmarkRef} …/>}` for the live copy — with the build-in/carve targeting whichever copy is visible: `const lettersHost = reducedMotion ? wordmarkRef : liveWordmarkRef;` used by both effects.

- [ ] **Step 7: Mount the header** — in `src/app/page.tsx`, import and render `<SiteHeader />` immediately after `<Sky>…</Sky>`.

- [ ] **Step 8: Visual verification** — scroll down slowly: the wordmark flies up-left and shrinks into the pill as it fades in around it (~85%); scroll back: fully reversible, header hides, wordmark returns; carve works at rest but not mid-flight; reduced motion: no flight, header fades in past half a viewport, slot shows JONOKANE. Nav links scroll to the placeholder anchors (Task 7 adds them — until then links no-op; note it).

- [ ] **Step 9: Gates, commit**

```bash
git add src/components/site-header.tsx src/lib/use-scroll-spy.ts src/components/hero/use-wordmark-morph.ts src/components/hero/hero.tsx src/components/hero/hero.module.css src/components/smooth-scroll.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat: site header with scroll-scrubbed wordmark morph and scroll-spy"
```

---

### Task 7: Anchor sections, page restructure, deep links, /work redirect

**Files:**
- Create: `src/components/anchor-section.tsx`, `src/components/hash-scroll.tsx`
- Modify: `src/app/page.tsx` (full restructure), `next.config.ts`
- Delete: `src/app/work/page.tsx`

**Interfaces:**
- Consumes: `siteContent` (Task 2), `getLenis` (Task 6), `SiteHeader`/`Hero` (Tasks 3/6).
- Produces: `AnchorSection({ id, title, children })`; `HashScroll` (renders null); section ids `about`/`work`/`contact` that the spy (Task 6) and deep links target.

- [ ] **Step 1: The placeholder section component**

```tsx
// src/components/anchor-section.tsx
import type { ReactNode } from "react";

/**
 * Placeholder anchor sections for the one-pager (spec §2): semantic
 * targets for nav/spy/deep-links until Phases 3–5 replace each with the
 * real section. Scene-token colored — this is also the night-legibility
 * bridge flagged in the Phase 1 review.
 */
export function AnchorSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="min-h-[70vh] scroll-mt-28 px-[7vw] py-[18vh]"
      style={{ background: "var(--scrim)" }}
    >
      <h2 id={`${id}-title`} className="heading-display text-4xl text-ink sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-[52ch] leading-relaxed text-sub">{children}</p>
    </section>
  );
}
```

- [ ] **Step 2: Deep-link scroll on load**

```tsx
// src/components/hash-scroll.tsx
"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/smooth-scroll";
import { ScrollTrigger } from "@/lib/gsap";

/** Scrolls to location.hash once layout has settled (spec §2 deep links). */
export function HashScroll() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      ScrollTrigger.refresh();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(el, { offset: -96, immediate: true });
      else el.scrollIntoView();
    }, 300); // after fonts/lockup/first ScrollTrigger measure
    return () => clearTimeout(timer);
  }, []);
  return null;
}
```

- [ ] **Step 3: Rewrite the page** — replace `src/app/page.tsx` entirely:

```tsx
import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { AnchorSection } from "@/components/anchor-section";
import { HashScroll } from "@/components/hash-scroll";
import { SceneProvider } from "@/components/sky/scene-provider";
import { Sky } from "@/components/sky/sky";
import { SunMoon } from "@/components/sky/sun-moon";
import { Rays } from "@/components/sky/rays";
import { Stars } from "@/components/sky/stars";
import { Clouds } from "@/components/sky/clouds";
import { Birds } from "@/components/sky/birds";
import { TimeScrubber } from "@/components/sky/time-scrubber";
import { SceneTunePanel } from "@/components/sky/scene-tune-panel";
import { siteContent } from "@/lib/site-content";

export default function Home() {
  return (
    <SceneProvider>
      <Sky>
        <SunMoon />
        <Rays />
        <Stars />
        <Clouds />
        <Birds />
      </Sky>
      <SiteHeader />
      <main>
        <Hero />
        <AnchorSection id="about" title="About">
          {siteContent.placeholders.about}
        </AnchorSection>
        <AnchorSection id="work" title="Selected Work">
          {siteContent.placeholders.work}
        </AnchorSection>
        <AnchorSection id="contact" title="Contact">
          {siteContent.placeholders.contact}
        </AnchorSection>
      </main>
      <HashScroll />
      <TimeScrubber />
      <SceneTunePanel />
    </SceneProvider>
  );
}
```

(The `motion` import, the zinc-colored copy, and the old scroll-reveal section are gone; the page is a server component again.)

- [ ] **Step 4: /work redirect** — delete `src/app/work/page.tsx` (the index; keep `src/app/work/[slug]/`). In `next.config.ts`, add to the returned config object:

```ts
    async redirects() {
      return [{ source: "/work", destination: "/#work", permanent: false }];
    },
```

- [ ] **Step 5: Verify** — `pnpm build` (must show `/work/[slug]` still generated, no `/work` index); `pnpm dev`: visiting `/work` lands on the homepage scrolled to Selected Work; `/#contact` on a cold load scrolls to Contact; header links scroll with Lenis and update `aria-current`; night scrub: section text legible (ink/sub over scrim).

- [ ] **Step 6: Gates, commit**

```bash
git add src/components/anchor-section.tsx src/components/hash-scroll.tsx src/app/page.tsx next.config.ts
git rm src/app/work/page.tsx
git commit -m "feat: anchor sections, deep links, /work redirect — one-pager skeleton"
```

---

### Task 8: Pre-hydration scene script + Mae fonts-loaded gating

**Files:**
- Create: `src/lib/pre-hydration-scene.ts`, `src/components/fonts-ready.tsx`
- Test: `src/lib/pre-hydration-scene.test.ts`
- Modify: `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Consumes: `SCENE_KEYFRAMES` (frozen Phase 1 module); `mixHex`, `sampleScene` (test comparison only).
- Produces: `preHydrationSceneScript: string` (inline-script source); `FontsReady` component (adds `fonts-mae` class to `<html>`); CSS scoped so Mae weights only apply once Mae is really rendering.

- [ ] **Step 1: Failing script test**

```ts
// src/lib/pre-hydration-scene.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { preHydrationSceneScript } from "@/lib/pre-hydration-scene";
import { sampleScene } from "@/lib/scene-engine";

describe("preHydrationSceneScript", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute("style");
  });

  function runAt(hour: number, minute: number) {
    vi.setSystemTime(new Date(2026, 6, 13, hour, minute));
    // eslint-disable-next-line no-eval -- executing the inline script exactly as a browser would
    eval(preHydrationSceneScript);
  }

  it("writes the five first-paint vars matching the engine's sample", () => {
    runAt(12, 30);
    const expected = sampleScene(12.5);
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--sky-top")).toBe(expected.top);
    expect(style.getPropertyValue("--sky-mid")).toBe(expected.mid);
    expect(style.getPropertyValue("--sky-hor")).toBe(expected.hor);
    expect(style.getPropertyValue("--ink")).toBe(expected.ink);
    expect(style.getPropertyValue("--sub")).toBe(expected.sub);
  });

  it("matches the engine across the midnight wrap", () => {
    runAt(23, 0);
    expect(document.documentElement.style.getPropertyValue("--sky-top")).toBe(sampleScene(23).top);
  });

  it("never throws even if document is odd (script is try/catch-wrapped)", () => {
    expect(preHydrationSceneScript).toContain("try{");
    expect(preHydrationSceneScript).toContain("catch");
  });
});
```

- [ ] **Step 2: Run to verify failure** — module not found.

- [ ] **Step 3: Implement the script source** (built FROM the real keyframes at import time, so it can never drift from `scene-config.ts`)

```ts
// src/lib/pre-hydration-scene.ts
import { SCENE_KEYFRAMES } from "@/lib/scene-config";

/**
 * Inline first-paint script (spec §14 punch list): before hydration, SSR
 * would otherwise paint the Midnight token defaults — a black flash for
 * daytime visitors. This tiny script (rendered into the document by
 * layout.tsx) computes the five gradient/ink vars from the visitor's clock
 * using the SAME keyframe data and smoothstep blend as the engine. The
 * table is serialized from SCENE_KEYFRAMES at build time — single source
 * of truth, no manual sync.
 */
const TABLE = SCENE_KEYFRAMES.map((k) => [k.h, k.top, k.mid, k.hor, k.ink, k.sub]);

export const preHydrationSceneScript = `(function(){try{
var T=${JSON.stringify(TABLE)};
var d=new Date(),h=d.getHours()+d.getMinutes()/60;
var a=T[T.length-1],b=T[0],i;
for(i=0;i<T.length;i++){if(T[i][0]<=h){a=T[i];b=T[(i+1)%T.length];}}
var span=(b[0]-a[0]+24)%24||24,t=(((h-a[0])+24)%24)/span;t=t*t*(3-2*t);
function px(s,o){return parseInt(s.slice(o,o+2),16)}
function m(x,y){var out="#",o,c;for(o=1;o<7;o+=2){c=Math.round(px(x,o)+(px(y,o)-px(x,o))*t).toString(16);out+=c.length<2?"0"+c:c}return out}
var e=document.documentElement.style,N=["--sky-top","--sky-mid","--sky-hor","--ink","--sub"],j;
for(j=0;j<5;j++){e.setProperty(N[j],m(a[j+1],b[j+1]))}
}catch(err){}})();`;
```

- [ ] **Step 4: Run to verify pass** — `pnpm test -- src/lib/pre-hydration-scene.test.ts` → PASS (the equality assertions prove the inline math matches `sampleScene` exactly).

- [ ] **Step 5: Fonts-ready gate**

```tsx
// src/components/fonts-ready.tsx
"use client";

import { useEffect } from "react";

const SPEC = '140 1rem "mae-variable"';
const DEADLINE_MS = 3000;

/**
 * Adds `fonts-mae` to <html> once Mae actually renders (spec §14 punch
 * list): the Mae axis weights (140/180) look near-Thin on the Geist
 * fallback, so font-variation-settings stay off until Mae is confirmed.
 * Retry-until-deadline: the Typekit stylesheet may not have parsed on the
 * first call (the parked hero's proven pattern).
 */
export function FontsReady() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = performance.now() + DEADLINE_MS;
    const attempt = () => {
      document.fonts
        .load(SPEC)
        .then((faces) => {
          if (cancelled) return;
          if (faces.length > 0) document.documentElement.classList.add("fonts-mae");
          else if (performance.now() < deadline) timer = setTimeout(attempt, 150);
        })
        .catch(() => {});
    };
    attempt();
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, []);
  return null;
}
```

- [ ] **Step 6: Gate the CSS** — in `src/app/globals.css`:
1. In the `body` rule, DELETE the `font-variation-settings: "wght" var(--bw);` line (keep the font-family).
2. In `.heading-display`, DELETE its `font-variation-settings` line; same for `.text-kicker`.
3. Append inside `@layer components`:

```css
  /* Mae axis weights apply only once Mae is confirmed rendering —
     the fallback face would render near-Thin at these values. */
  html.fonts-mae body {
    font-variation-settings: "wght" var(--bw);
  }

  html.fonts-mae .heading-display {
    font-variation-settings: "wght" calc(var(--dw) + 260);
  }

  html.fonts-mae .text-kicker {
    font-variation-settings: "wght" calc(var(--bw) + 150);
  }
```

- [ ] **Step 7: Wire the layout** — in `src/app/layout.tsx`: import both (`import { preHydrationSceneScript } from "@/lib/pre-hydration-scene";` and `import { FontsReady } from "@/components/fonts-ready";`), then make the script the FIRST child of `<body>` and mount `FontsReady` beside `SmoothScroll`:

```tsx
      <body className="min-h-full flex flex-col">
        <script
          id="scene-first-paint"
          dangerouslySetInnerHTML={{ __html: preHydrationSceneScript }}
        />
        <FontsReady />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
```

- [ ] **Step 8: Verify** — `pnpm build && pnpm start`: view-source shows the inline script; with DevTools network throttled to Slow 3G, first paint is already the correct time-of-day gradient (not black); blocking `use.typekit.net` in DevTools leaves body text at normal weight (no near-Thin).

- [ ] **Step 9: Gates, commit**

```bash
git add src/lib/pre-hydration-scene.ts src/lib/pre-hydration-scene.test.ts src/components/fonts-ready.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: first-paint scene vars + Mae fonts-loaded gating"
```

---

### Task 9: Documentation

**Files:**
- Modify: `CLAUDE.md`, `PLAN.md`

- [ ] **Step 1: CLAUDE.md** — three surgical edits:

1. In the intro paragraph (the one describing the hero), replace the sentence describing the TotalBlack hero with:

```markdown
The hero is JONOKANE set in Area (variable), built once on load, carving lighter under the cursor, and morphing into the site header on scroll — spec in `docs/superpowers/specs/2026-07-11-site-experience-design.md`. The previous TotalBlack living-wordmark system is parked (files retained, unmounted) per that spec's §13.
```

2. In the "Tuning (dev)" paragraph, replace the wordmark-panel mention: the `?tune` param now opens the scene palette panel only (values → `src/lib/scene-config.ts`); the wordmark recipe is code-locked in `src/lib/wordmark-config.ts` (no runtime panel).
3. In the Structure block, add:

```
src/components/hero/       JONOKANE hero: build-in, lockup + morph hooks, module CSS
src/components/site-header.tsx  floating nav pill (morph landing slot, scroll-spy)
src/lib/area-font.ts       area-full FontFace re-registration + gate
src/lib/wordmark-config.ts locked wordmark recipe (single source of truth)
src/lib/site-content.ts    all site copy (never in JSX)
src/lib/carve-engine.ts    cursor weight-carve (shared gsap ticker)
```

- [ ] **Step 2: PLAN.md** — update "Current state": hero v2 (Area JONOKANE) + site header shipped (Phase 2 of the site-experience spec, 2026-07-13); Phases 3–5 (collector/About, work shelf, contact/farewell) remain; `/work` index removed in favor of the one-pager anchor (case study pages unchanged).

- [ ] **Step 3: Gates, commit**

```bash
git add CLAUDE.md PLAN.md
git commit -m "docs: Phase 2 hero + header shipped; structure and tuning notes updated"
```

---

## Self-Review

**Spec coverage:** §5 hero — Tasks 2 (font/recipe), 3 (build-in, kerns, copy), 4 (lockup), 5 (carve, reused engine math). §6 header — Task 6 (pill, morph, spy; the expanding work row is Phase 4 with the shelf, per spec §6/§8 pairing). §2 routes — Task 7 (anchors, deep links, `/work` redirect; `/work/[slug]` untouched). §12 — reduced-motion paths in Tasks 3/5/6; carve pointer-only; one-RAF respected (ScrollTrigger + carve on gsap ticker; lockup's resize handler is a passive listener with rAF-once debounce, not a loop). §13 — old hero parked in Task 3, math reused in Task 5. §14 punch list — Tasks 1 (provider tests), 8 (first-paint script, fonts-mae gating); night-legibility bridge in Task 7's token-colored sections. §15 — config/copy modules (Task 2), hooks per concern, tested pure math (Tasks 2/4/5/8).

**Placeholder scan:** clean — every code step ships complete code; Task 6 Step 6's restructure enumerates each concrete edit with the code it introduces.

**Type consistency:** `loadAreaFont(): Promise<boolean>` (T2) consumed in T3; `wordmarkConfig`/`wordmarkFvs`/`WORDMARK_TEXT` (T2) consumed in T3/T5/T6; `CarveEngine.setEnabled` (T5) called by T6's `onProgress`; `NAV_WORDMARK_SLOT_ID` exported by T6's header and imported by T6's morph hook (same task — no cross-task gap); `getLenis()` (T6) consumed by T7's `HashScroll`; `computeLockup` input/output field names match between test and implementation; `useScrollSpy(ids)` consumed with `siteContent.nav` targets.
