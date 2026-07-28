import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { ZoomableImage } from "@/components/mdx/zoomable-image";
import { ZoomDisabled } from "@/components/mdx/zoom-context";

vi.mock("@/components/smooth-scroll", () => ({
  getLenis: () => ({ isStopped: true, stop: vi.fn(), start: vi.fn() }),
}));

afterEach(cleanup);

describe("ZoomableImage", () => {
  it("renders a dialog-popup button wrapping the image, named by alt", () => {
    render(<ZoomableImage src="/x.jpg" alt="A screen" />);
    const button = screen.getByRole("button", { name: "A screen" });
    expect(button.getAttribute("aria-haspopup")).toBe("dialog");
    expect(button.querySelector("img")).toBeTruthy();
  });

  it("falls back to the generic label when alt is empty", () => {
    render(<ZoomableImage src="/x.jpg" alt="" />);
    expect(screen.getByRole("button", { name: "Enlarge image" })).toBeTruthy();
  });

  it("opens the lightbox on click", () => {
    render(<ZoomableImage src="/x.jpg" alt="A screen" caption="The screen" />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "A screen" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("renders a plain, non-zoomable image inside a ZoomDisabled boundary", () => {
    render(
      <ZoomDisabled>
        <ZoomableImage src="/x.jpg" alt="A breakout screen" />
      </ZoomDisabled>,
    );
    // No zoom trigger — a breakout is already the full-size view.
    expect(screen.queryByRole("button")).toBeNull();
    // The alt now lives on the <img> itself (no button to carry it).
    const img = screen.getByAltText("A breakout screen");
    expect(img.tagName).toBe("IMG");
    // Clicking it opens nothing.
    fireEvent.click(img);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
