import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Breakout } from "@/components/mdx/breakout";

afterEach(cleanup);

describe("Breakout", () => {
  it("wraps its children in a breakout band", () => {
    const { container } = render(
      <Breakout>
        <figure data-testid="fig" />
      </Breakout>,
    );
    const band = container.querySelector("[data-mdx-breakout]");
    expect(band).toBeTruthy();
    expect(band?.querySelector('[data-testid="fig"]')).toBeTruthy();
  });
});
