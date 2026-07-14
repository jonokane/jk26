import { cleanup, render } from "@testing-library/react";
import type Lenis from "lenis";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The scroll-lock regression test (commit 723b0f9 made the whole site
 * unscrollable and every one of the 74 unit tests still passed).
 *
 * SmoothScroll must drive Lenis from the GSAP ticker. Its one hazard is a
 * lifecycle one: ReactLenis constructs Lenis inside its own effect and
 * publishes it a render LATER, so reading the instance off a ref in a
 * mount-only effect finds nothing, wires no ticker, and — with autoRaf: false —
 * nothing ever calls lenis.raf(). The site silently stops scrolling. Nothing
 * about the *math* is wrong, which is why only a lifecycle test catches it.
 */

/** What `useLenis()` returns right now — the test drives this. */
let currentLenis: Lenis | undefined;

vi.mock("lenis/react", () => ({
  ReactLenis: ({ children }: { children: ReactNode }) => children,
  useLenis: () => currentLenis,
}));

const ticker = { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() };
vi.mock("@/lib/gsap", () => ({
  gsap: { ticker: { add: (...a: unknown[]) => ticker.add(...a), remove: (...a: unknown[]) => ticker.remove(...a), lagSmoothing: (...a: unknown[]) => ticker.lagSmoothing(...a) } },
  ScrollTrigger: { update: vi.fn() },
}));

const { SmoothScroll, getLenis } = await import("@/components/smooth-scroll");

function fakeLenis() {
  return {
    raf: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Lenis;
}

beforeEach(() => {
  currentLenis = undefined;
  ticker.add.mockClear();
  ticker.remove.mockClear();
  ticker.lagSmoothing.mockClear();
});

afterEach(cleanup);

describe("SmoothScroll", () => {
  it("wires Lenis into the gsap ticker once the instance exists", () => {
    currentLenis = fakeLenis();
    render(createElement(SmoothScroll, null, "content"));

    expect(ticker.add).toHaveBeenCalledTimes(1);
    expect(typeof ticker.add.mock.calls[0][0]).toBe("function");
    expect(ticker.lagSmoothing).toHaveBeenCalledWith(0);
    expect(getLenis()).toBe(currentLenis);
  });

  it("still wires the ticker when the instance only arrives on a later render", () => {
    // the exact regression: nothing to read on the first render
    const { rerender } = render(createElement(SmoothScroll, null, "content"));
    expect(ticker.add).not.toHaveBeenCalled();
    expect(getLenis()).toBeNull();

    currentLenis = fakeLenis();
    rerender(createElement(SmoothScroll, null, "content"));

    expect(ticker.add).toHaveBeenCalledTimes(1);
    expect(getLenis()).toBe(currentLenis);
  });

  it("drives lenis.raf with ticker time converted to ms", () => {
    const lenis = fakeLenis();
    currentLenis = lenis;
    render(createElement(SmoothScroll, null, "content"));

    const update = ticker.add.mock.calls[0][0] as (time: number) => void;
    update(2); // gsap ticker time is SECONDS
    expect(lenis.raf).toHaveBeenCalledWith(2000);
  });

  it("removes the ticker callback and releases the instance on unmount", () => {
    const lenis = fakeLenis();
    currentLenis = lenis;
    const { unmount } = render(createElement(SmoothScroll, null, "content"));
    const update = ticker.add.mock.calls[0][0];

    unmount();

    expect(ticker.remove).toHaveBeenCalledWith(update);
    expect(lenis.off).toHaveBeenCalled();
    expect(getLenis()).toBeNull();
  });
});
