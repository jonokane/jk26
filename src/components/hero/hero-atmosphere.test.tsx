import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { HeroAtmosphere } from "@/components/hero/hero-atmosphere";

/* No global afterEach is registered (vitest.config.ts has no test.globals) — every
   render-based test in this repo cleans up explicitly. */
afterEach(cleanup);

describe("HeroAtmosphere", () => {
  it("mounts without throwing when canvas is unavailable (jsdom returns no 2d context)", () => {
    const { container } = render(<HeroAtmosphere />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("renders two canvases, a lane, and a fade", () => {
    const { container } = render(<HeroAtmosphere />);
    expect(container.querySelectorAll("canvas")).toHaveLength(2);
    // lane + fade are the two non-canvas decorative divs inside the root
    expect(container.querySelectorAll('[aria-hidden="true"] > div')).toHaveLength(2);
  });
});
