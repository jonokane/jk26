import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ back }) }));

const stop = vi.fn();
const start = vi.fn();
vi.mock("@/components/smooth-scroll", () => ({ getLenis: () => ({ stop, start }) }));

let reduced = false;
vi.mock("@/lib/use-reduced-motion", () => ({ useReducedMotionPref: () => reduced }));

const { CaseStudyModal } = await import("@/components/work/case-study-modal");

afterEach(() => {
  cleanup();
  back.mockClear();
  stop.mockClear();
  start.mockClear();
  reduced = false;
});

describe("CaseStudyModal", () => {
  it("locks Lenis on open and releases it on close/unmount", () => {
    const { unmount } = render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    expect(stop).toHaveBeenCalledOnce();
    unmount();
    expect(start).toHaveBeenCalledOnce();
  });

  it("is a labelled modal dialog", () => {
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-label")).toBe("Alpha");
  });

  it("navigates back after the close slide finishes", () => {
    const { container } = render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.click(screen.getByRole("button"));
    // The slide-down runs first; back() waits for the transform transition end.
    expect(back).not.toHaveBeenCalled();
    const sheet = container.querySelector('[role="dialog"]') as HTMLElement;
    fireEvent.transitionEnd(sheet, { propertyName: "transform" });
    expect(back).toHaveBeenCalledOnce();
  });

  it("closes immediately under reduced motion (no slide to wait on)", () => {
    reduced = true;
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.click(screen.getByRole("button"));
    expect(back).toHaveBeenCalledOnce();
  });

  it("closes on Escape", () => {
    reduced = true; // immediate path keeps the assertion synchronous
    render(<CaseStudyModal label="Alpha">body</CaseStudyModal>);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(back).toHaveBeenCalledOnce();
  });
});
