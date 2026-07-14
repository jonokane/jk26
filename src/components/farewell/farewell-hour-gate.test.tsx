import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `useScene().hour` is null until the SceneProvider has sampled the
 * visitor's clock (SSR / first paint — see scene-provider.tsx). A real
 * SceneProvider always finishes that sampling inside the mount effect that
 * `render()` flushes synchronously, so there's no way to observe the
 * transient null state through it. Mocking the hook is the only way to
 * assert the guard this file exists to check: Farewell must render nothing
 * in that window rather than guess a word and flash the wrong one.
 */
vi.mock("@/components/sky/scene-provider", () => ({
  useScene: () => ({
    hour: null,
    live: true,
    scrub: vi.fn(),
    resume: vi.fn(),
    keyframes: [],
    setKeyframes: vi.fn(),
  }),
}));

const { Farewell } = await import("@/components/farewell/farewell");

afterEach(cleanup);

describe("Farewell — before the clock has sampled (spec §11)", () => {
  it("renders nothing rather than guessing a word", () => {
    render(<Farewell />);
    expect(document.getElementById("farewell")).toBeNull();
    expect(document.querySelector("[data-farewell-word]")).toBeNull();
  });
});
