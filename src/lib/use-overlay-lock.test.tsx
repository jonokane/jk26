import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";
import { useRef } from "react";
import { useOverlayLock } from "@/lib/use-overlay-lock";

const lenis = { isStopped: false, stop: vi.fn(), start: vi.fn() };
vi.mock("@/components/smooth-scroll", () => ({ getLenis: () => lenis }));

function Harness({ onDismiss }: { onDismiss: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlayLock({ containerRef: ref, onDismiss });
  return (
    <div ref={ref} tabIndex={-1} data-testid="overlay">
      <button>inside</button>
    </div>
  );
}

afterEach(() => {
  cleanup();
  lenis.isStopped = false;
  lenis.stop.mockClear();
  lenis.start.mockClear();
  document.body.querySelectorAll("[data-sib]").forEach((n) => n.remove());
});

describe("useOverlayLock", () => {
  it("stops Lenis on open and starts it on close when it wasn't already stopped", () => {
    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(lenis.stop).toHaveBeenCalledTimes(1);
    unmount();
    expect(lenis.start).toHaveBeenCalledTimes(1);
  });

  it("does NOT restart Lenis if it was already stopped (nesting)", () => {
    lenis.isStopped = true;
    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(lenis.stop).not.toHaveBeenCalled();
    unmount();
    expect(lenis.start).not.toHaveBeenCalled();
  });

  it("inerts other body children and restores their PRIOR inert state", () => {
    const normal = document.body.appendChild(document.createElement("div"));
    normal.setAttribute("data-sib", "");
    const already = document.body.appendChild(document.createElement("div"));
    already.setAttribute("data-sib", "");
    already.inert = true;

    const { unmount } = render(<Harness onDismiss={() => {}} />);
    expect(normal.inert).toBe(true);
    expect(already.inert).toBe(true);

    unmount();
    expect(normal.inert).toBe(false); // restored to prior (false)
    expect(already.inert).toBe(true); // restored to prior (true) — not clobbered
  });

  it("calls onDismiss on Escape", () => {
    const onDismiss = vi.fn();
    render(<Harness onDismiss={onDismiss} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("on Escape, only the overlay that owns focus dismisses (nesting)", () => {
    const outerDismiss = vi.fn();
    const innerDismiss = vi.fn();
    function Overlay({ id, onDismiss }: { id: string; onDismiss: () => void }) {
      const ref = useRef<HTMLDivElement>(null);
      useOverlayLock({ containerRef: ref, onDismiss });
      return (
        <div ref={ref} tabIndex={-1} data-testid={id}>
          <button>x</button>
        </div>
      );
    }
    render(
      <>
        <Overlay id="outer" onDismiss={outerDismiss} />
        <Overlay id="inner" onDismiss={innerDismiss} />
      </>,
    );
    // The inner overlay mounts last and moves focus into itself, so only it
    // should respond to Escape.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(innerDismiss).toHaveBeenCalledTimes(1);
    expect(outerDismiss).not.toHaveBeenCalled();
  });
});
