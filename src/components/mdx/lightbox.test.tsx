import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Lightbox } from "@/components/mdx/lightbox";

vi.mock("@/components/smooth-scroll", () => ({
  getLenis: () => ({ isStopped: true, stop: vi.fn(), start: vi.fn() }),
}));

const origin = { top: 100, left: 100, width: 200, height: 150 };

afterEach(cleanup);

describe("Lightbox", () => {
  it("renders an accessible dialog with the image and caption", () => {
    render(<Lightbox src="/x.jpg" alt="A screen" caption="The screen" origin={origin} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByAltText("A screen")).toBeTruthy();
    expect(screen.getByText("The screen")).toBeTruthy();
  });

  it("calls onClose on Escape", () => {
    const onClose = vi.fn();
    render(<Lightbox src="/x.jpg" alt="A screen" origin={origin} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    // reduced-motion path (jsdom) dismisses immediately
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<Lightbox src="/x.jpg" alt="A screen" origin={origin} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
