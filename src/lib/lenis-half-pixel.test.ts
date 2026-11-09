import { afterEach, describe, expect, it } from "vitest";
import Lenis from "lenis";

/**
 * Pins patches/lenis@1.3.25.patch: Lenis must finish a smooth scroll whose
 * target ends in exactly half a pixel.
 *
 * On a 2x screen the browser parks window.scrollY on half pixels, and Lenis
 * seeds its target from scrollY whenever it comes to rest (after a nav click,
 * a scrollbar drag, any native scroll). A wheel step adds a whole number to
 * that, so the target is N.5. Unpatched, Lenis decides a smooth scroll is done
 * when Math.round(value) === Math.round(target), and a value easing UP toward
 * N.5 stays below it forever: it rounds to N, the target rounds to N + 1, so
 * the scroll never completes. Lenis then sits in "smooth" mode indefinitely,
 * re-applying its own position every frame, so a scrollbar drag, the keyboard
 * or find-in-page gets pulled straight back. Measured on jonokane.com at DPR 2:
 * Work nav link, then one wheel notch down.
 *
 * Upstream (1.3.27 and main) still has the rounding test. If a Lenis upgrade
 * drops the patch, this fails until it is re-applied or upstream fixes it.
 */

/** A scroller that snaps like a DPR-2 screen: to the nearest half pixel. */
function halfPixelScroller() {
  const wrapper = document.createElement("div");
  const content = document.createElement("div");
  wrapper.appendChild(content);
  document.body.appendChild(wrapper);

  let top = 0;
  Object.defineProperties(wrapper, {
    clientHeight: { value: 900 },
    clientWidth: { value: 1440 },
    scrollHeight: { value: 10_000 },
    scrollWidth: { value: 1440 },
    scrollTop: {
      get: () => top,
      set: (v: number) => {
        top = Math.round(v * 2) / 2;
      },
    },
  });
  /* jsdom has no Element.scrollTo; Lenis writes positions through it. */
  wrapper.scrollTo = ((opts: ScrollToOptions) => {
    wrapper.scrollTop = opts.top ?? top;
  }) as typeof wrapper.scrollTo;

  return { wrapper, content };
}

/** Run Lenis's frame loop for `seconds` of simulated 60fps time. */
function runFrames(lenis: Lenis, seconds: number) {
  const frame = 1000 / 60;
  for (let t = 0; t <= seconds * 1000; t += frame) lenis.raf(t);
}

let lenis: Lenis | null = null;
afterEach(() => {
  lenis?.destroy();
  lenis = null;
  document.body.innerHTML = "";
});

describe("Lenis settling on half-pixel targets (patched)", () => {
  it("finishes a wheel scroll that starts from a half-pixel resting point", () => {
    const { wrapper, content } = halfPixelScroller();
    lenis = new Lenis({ wrapper, content, lerp: 0.1, autoResize: false });

    /* A native scroll (a scrollbar drag, say) comes to rest on a half pixel,
       and Lenis seeds its target from it. */
    wrapper.scrollTop = 1500.5;
    wrapper.dispatchEvent(new Event("scroll"));
    expect(lenis.targetScroll).toBe(1500.5);

    /* One wheel notch down: the target becomes 1600.5. */
    wrapper.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, cancelable: true }));
    expect(lenis.isScrolling).toBe("smooth");

    runFrames(lenis, 3);

    expect(lenis.isScrolling).toBe(false);
    expect(wrapper.scrollTop).toBe(1600.5);
  });

  it("finishes a programmatic smooth scroll to a half-pixel target", () => {
    const { wrapper, content } = halfPixelScroller();
    lenis = new Lenis({ wrapper, content, lerp: 0.1, autoResize: false });

    let completed = false;
    lenis.scrollTo(2000.5, { onComplete: () => (completed = true) });
    runFrames(lenis, 3);

    expect(completed).toBe(true);
    expect(lenis.isScrolling).toBe(false);
  });

  it("still settles whole-pixel targets exactly as before", () => {
    const { wrapper, content } = halfPixelScroller();
    lenis = new Lenis({ wrapper, content, lerp: 0.1, autoResize: false });

    lenis.scrollTo(2000);
    runFrames(lenis, 3);

    expect(lenis.isScrolling).toBe(false);
    expect(wrapper.scrollTop).toBe(2000);
  });
});
