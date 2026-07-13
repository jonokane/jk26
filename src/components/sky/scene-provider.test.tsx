import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SceneProvider, useScene } from "@/components/sky/scene-provider";

function Probe() {
  const { hour, live, scrub, resume } = useScene();
  return (
    <div>
      <span data-testid="hour">{hour === null ? "null" : hour.toFixed(2)}</span>
      <span data-testid="live">{String(live)}</span>
      <button onClick={() => scrub(3)}>scrub</button>
      <button onClick={resume}>resume</button>
    </div>
  );
}

describe("SceneProvider clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 13, 10, 0));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.documentElement.removeAttribute("style");
  });

  it("samples the visitor clock on mount and writes tokens to <html>", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    expect(screen.getByTestId("hour").textContent).toBe("10.00");
    expect(document.documentElement.style.getPropertyValue("--sky-top")).toMatch(/^#/);
  });

  it("ticks once a minute while live", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    act(() => {
      // advanceTimersByTime advances the mocked Date with the timers,
      // so 30 minutes of advancement lands the last tick at 10:30 exactly
      vi.advanceTimersByTime(30 * 60_000);
    });
    expect(screen.getByTestId("hour").textContent).toBe("10.50");
  });

  it("skips interval ticks while the tab is hidden", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      vi.setSystemTime(new Date(2026, 6, 13, 11, 0));
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByTestId("hour").textContent).toBe("10.00");
    hidden.mockRestore();
  });

  it("scrub freezes the clock; resume re-samples it", () => {
    render(<SceneProvider><Probe /></SceneProvider>);
    act(() => { screen.getByText("scrub").click(); });
    expect(screen.getByTestId("hour").textContent).toBe("3.00");
    expect(screen.getByTestId("live").textContent).toBe("false");
    act(() => {
      vi.advanceTimersByTime(180_000); // interval fires while scrubbed…
    });
    expect(screen.getByTestId("hour").textContent).toBe("3.00"); // …but the clock stays frozen
    act(() => {
      vi.setSystemTime(new Date(2026, 6, 13, 12, 0)); // set WITHOUT advancing timers
      screen.getByText("resume").click();
    });
    expect(screen.getByTestId("hour").textContent).toBe("12.00");
    expect(screen.getByTestId("live").textContent).toBe("true");
  });
});
