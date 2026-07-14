import { act, cleanup, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneProvider, useScene } from "@/components/sky/scene-provider";
import { Farewell } from "@/components/farewell/farewell";
import { siteContent } from "@/lib/site-content";

// No @testing-library/jest-dom in this repo (see other *.test.tsx files) —
// assertions below stick to plain DOM/vitest matchers.

/* jsdom has no IntersectionObserver. This stub records every instance so a
   test can fire its callback the way a real scroll-into-view would. */
class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/* A reduced-motion setting the test can toggle at runtime, the way a visitor
   can toggle it in System Settings while the page is open — same pattern as
   about.test.tsx. Everything else the page asks matchMedia about answers false. */
const realMatchMedia = window.matchMedia;
let reduced = false;
const reducedListeners = new Set<(e: MediaQueryListEvent) => void>();

function setSystemReducedMotion(next: boolean) {
  reduced = next;
  act(() => {
    for (const listener of reducedListeners) listener({ matches: next } as MediaQueryListEvent);
  });
}

/* Captures the live `scrub` function from inside the provider so tests can
   drive the clock to arbitrary hours, the way the visitor-facing scrubber
   (time-scrubber.tsx) does. */
function ScrubCapture({ scrubRef }: { scrubRef: { current: (hour: number) => void } }) {
  const { scrub } = useScene();
  useEffect(() => {
    scrubRef.current = scrub;
  });
  return null;
}

function renderFarewell() {
  const scrubRef: { current: (hour: number) => void } = { current: () => {} };
  const utils = render(
    <SceneProvider>
      <Farewell />
      <ScrubCapture scrubRef={scrubRef} />
    </SceneProvider>,
  );
  return { ...utils, scrub: (hour: number) => act(() => scrubRef.current(hour)) };
}

function wordText(): string | null {
  return document.querySelector("[data-farewell-word]")?.textContent ?? null;
}

function message(): HTMLElement {
  return document.querySelector("[data-farewell-message]") as HTMLElement;
}

beforeEach(() => {
  reduced = false;
  reducedListeners.clear();
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  window.matchMedia = ((query: string) => {
    const isReduceQuery = query.includes("prefers-reduced-motion");
    return {
      get matches() {
        return isReduceQuery ? reduced : false;
      },
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        if (isReduceQuery) reducedListeners.add(listener);
      },
      removeEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) => {
        reducedListeners.delete(listener);
      },
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
  vi.unstubAllGlobals();
});

describe("Farewell — the word (spec §11)", () => {
  it("renders the correct word at every hour boundary (5, 12, 17, 21)", () => {
    const { scrub } = renderFarewell();
    const cases: Array<[number, keyof typeof siteContent.farewell.words]> = [
      [4.999, "night"],
      [5, "morning"],
      [11.999, "morning"],
      [12, "afternoon"],
      [16.999, "afternoon"],
      [17, "evening"],
      [20.999, "evening"],
      [21, "night"],
    ];
    for (const [hour, key] of cases) {
      scrub(hour);
      expect(wordText()).toBe(siteContent.farewell.words[key]);
    }
  });

  it("wraps correctly past midnight", () => {
    const { scrub } = renderFarewell();
    scrub(24);
    expect(wordText()).toBe(siteContent.farewell.words.night);
    scrub(29); // 29 % 24 === 5
    expect(wordText()).toBe(siteContent.farewell.words.morning);
  });

  it("tracks the scrubber live: dragging to 3am says night", () => {
    const { scrub } = renderFarewell();
    scrub(14); // afternoon first
    expect(wordText()).toBe(siteContent.farewell.words.afternoon);
    scrub(3);
    expect(wordText()).toBe(siteContent.farewell.words.night);
  });

  it("changes the rendered word when the scrubbed hour changes", () => {
    const { scrub } = renderFarewell();
    scrub(8);
    const first = wordText();
    scrub(19);
    const second = wordText();
    expect(first).not.toBe(second);
    expect(first).toBe(siteContent.farewell.words.morning);
    expect(second).toBe(siteContent.farewell.words.evening);
  });

  it("uses siteContent for every visible string (no copy hardcoded in JSX)", () => {
    renderFarewell();
    expect(screen.getByText(siteContent.farewell.lead)).toBeTruthy();
    expect(screen.getByText(siteContent.farewell.signature)).toBeTruthy();
    // The wish line is split across nodes (wishPrefix + word + wishSuffix);
    // assert the parent paragraph's full text reassembles it.
    const word = wordText();
    const wishParagraph = document.querySelector("[data-farewell-word]")?.parentElement;
    expect(wishParagraph?.textContent).toBe(
      `${siteContent.farewell.wishPrefix}${word}${siteContent.farewell.wishSuffix}`,
    );
  });

  it("exposes an accessible name from the existing lead copy, with no invented heading", () => {
    renderFarewell();
    expect(screen.getByRole("region", { name: siteContent.farewell.lead })).toBeTruthy();
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("Farewell — arrival + reduced motion (spec §12)", () => {
  it("does not mark itself visible until it has intersected the viewport", () => {
    renderFarewell();
    expect(message().hasAttribute("data-visible")).toBe(false);
    act(() => {
      MockIntersectionObserver.instances[0]?.trigger(true);
    });
    expect(message().hasAttribute("data-visible")).toBe(true);
  });

  it("under reduced motion the closing statement is simply present — no rise/fade wait", () => {
    reduced = true;
    renderFarewell();
    expect(message().hasAttribute("data-static")).toBe(true);
    // Content is fully readable immediately, regardless of intersection state.
    expect(message().textContent).toContain(siteContent.farewell.lead);
  });

  /* The bug this repo has already paid for twice: a live OS toggle left
     something erased, because what was visible had been decided by an effect
     that never ran again. The word and the rest of the copy must survive
     both directions. */
  it("survives a live reduced-motion toggle, in both directions", () => {
    const { scrub } = renderFarewell();
    scrub(9); // pin a known, stable word for the whole test

    expect(message().hasAttribute("data-static")).toBe(false);

    setSystemReducedMotion(true);
    expect(message().hasAttribute("data-static")).toBe(true);
    expect(message().textContent).toContain(siteContent.farewell.lead);
    expect(wordText()).toBe(siteContent.farewell.words.morning);

    setSystemReducedMotion(false);
    expect(message().hasAttribute("data-static")).toBe(false);
    expect(message().textContent).toContain(siteContent.farewell.lead);
    expect(wordText()).toBe(siteContent.farewell.words.morning);

    setSystemReducedMotion(true);
    expect(message().hasAttribute("data-static")).toBe(true);
    expect(wordText()).toBe(siteContent.farewell.words.morning);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderFarewell();
    const instance = MockIntersectionObserver.instances[0];
    unmount();
    expect(instance?.disconnect).toHaveBeenCalled();
  });
});
