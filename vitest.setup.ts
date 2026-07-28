// Stub ResizeObserver for jsdom, which has none. Anything that measures an
// element observes it (use-gallery, use-header-height), so a component test
// that renders one throws on mount before it can assert anything.
//
// It never fires: jsdom lays nothing out, so every box it could report is 0×0.
// Tests here assert structure — that the cards, counter and panel are rendered
// off the data — and the geometry those callbacks would drive is unit-tested,
// pure and DOM-free, in gallery-engine.test.ts. Real measurement is verified in
// a real browser, because that is the only place it means anything.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// Mock window.matchMedia for jsdom (needed by GSAP ScrollTrigger)
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
}

// Shim the `inert` IDL attribute for jsdom, which doesn't implement it
// (`'inert' in HTMLElement.prototype` is false — confirmed against jsdom
// 29.1.1). use-overlay-lock (and anything built on it) reads and sets
// `el.inert` to freeze the rest of the page; without this, a freshly created
// element's `.inert` reads back as `undefined` instead of the real-DOM
// default `false`, breaking prior-state save/restore assertions for reasons
// that have nothing to do with the hook under test. Reflects the boolean
// content attribute, same as a real browser.
if (
  typeof window !== "undefined" &&
  !("inert" in window.HTMLElement.prototype)
) {
  Object.defineProperty(window.HTMLElement.prototype, "inert", {
    get(this: HTMLElement) {
      return this.hasAttribute("inert");
    },
    set(this: HTMLElement, value: boolean) {
      if (value) this.setAttribute("inert", "");
      else this.removeAttribute("inert");
    },
    configurable: true,
  });
}
