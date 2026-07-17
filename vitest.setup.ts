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
