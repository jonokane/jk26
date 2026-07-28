import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Pin } from "@/components/mdx/pin";

afterEach(cleanup);

describe("Pin", () => {
  it("puts the first child in the media panel and the rest in the text panel", () => {
    const { container } = render(
      <Pin>
        <figure data-testid="media" />
        <p>first</p>
        <p>second</p>
      </Pin>,
    );
    const media = container.querySelector('[data-pin-panel="media"]');
    const text = container.querySelector('[data-pin-panel="text"]');
    expect(media?.querySelector('[data-testid="media"]')).toBeTruthy();
    expect(text?.textContent).toBe("firstsecond");
    // the held media must not leak into the scrolling text column
    expect(text?.querySelector('[data-testid="media"]')).toBeNull();
  });

  it("renders a lone child plainly — no empty sticky column", () => {
    const { container } = render(
      <Pin>
        <figure data-testid="only" />
      </Pin>,
    );
    expect(container.querySelector("[data-pin-panel]")).toBeNull();
    expect(container.querySelector('[data-testid="only"]')).toBeTruthy();
  });
});
