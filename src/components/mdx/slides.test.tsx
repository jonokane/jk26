import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Slides } from "@/components/mdx/slides";

afterEach(cleanup);

const three = () => (
  <Slides>
    <figure data-testid="s1">one</figure>
    <figure data-testid="s2">two</figure>
    <figure data-testid="s3">three</figure>
  </Slides>
);

const activeIndex = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-slide]")].findIndex(
    (s) => s.getAttribute("data-active") === "true",
  );

describe("Slides", () => {
  it("shows the first slide active and the rest inactive, with a counter", () => {
    const { container } = render(three());
    expect(activeIndex(container)).toBe(0);
    expect(container.querySelectorAll('[data-slide][data-active="true"]')).toHaveLength(1);
    expect(screen.getByText(/1\s*\/\s*3/)).toBeTruthy();
  });

  it("advances on Next and wraps past the end", () => {
    const { container } = render(three());
    const next = screen.getByRole("button", { name: "Next screen" });
    fireEvent.click(next);
    expect(activeIndex(container)).toBe(1);
    fireEvent.click(next);
    fireEvent.click(next); // 3 → wraps → 1
    expect(activeIndex(container)).toBe(0);
  });

  it("goes back on Prev and wraps before the start", () => {
    const { container } = render(three());
    fireEvent.click(screen.getByRole("button", { name: "Previous screen" }));
    expect(activeIndex(container)).toBe(2);
  });

  it("advances when the image area (stack) is clicked", () => {
    const { container } = render(three());
    fireEvent.click(container.querySelector("[data-slides-stack]")!);
    expect(activeIndex(container)).toBe(1);
  });

  it("steps with the arrow keys", () => {
    const { container } = render(three());
    const group = container.querySelector("[data-slides]")!;
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(activeIndex(container)).toBe(1);
    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(activeIndex(container)).toBe(0);
  });

  it("marks the direction and the exiting slide so CSS can run the filmstrip", () => {
    const { container } = render(three());
    const group = container.querySelector("[data-slides]")!;
    const slides = container.querySelectorAll("[data-slide]");
    expect(group.getAttribute("data-dir")).toBe("next"); // first step enters from the right
    expect(container.querySelector('[data-slide][data-exiting="true"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Next screen" }));
    expect(group.getAttribute("data-dir")).toBe("next");
    expect(slides[0].getAttribute("data-exiting")).toBe("true");
    expect(slides[1].getAttribute("data-active")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Previous screen" }));
    expect(group.getAttribute("data-dir")).toBe("prev");
    expect(slides[1].getAttribute("data-exiting")).toBe("true");
    expect(slides[0].getAttribute("data-exiting")).toBe("false");
  });

  it("wrapping follows the button pressed, not the index order", () => {
    const { container } = render(three());
    const group = container.querySelector("[data-slides]")!;
    fireEvent.click(screen.getByRole("button", { name: "Previous screen" })); // 1 → wraps → 3
    expect(activeIndex(container)).toBe(2);
    expect(group.getAttribute("data-dir")).toBe("prev"); // slide 3 enters from the left
  });

  it("ignores whitespace text between slides — a newline is not a slide", () => {
    // MDX compiles images authored on consecutive lines inside <Slides> (no
    // blank lines) to `img, "\n", img, "\n", img`. Only the images are slides.
    const { container } = render(
      <Slides>
        <figure data-testid="a">a</figure>
        {"\n"}
        <figure data-testid="b">b</figure>
        {"\n"}
        <figure data-testid="c">c</figure>
      </Slides>,
    );
    expect(container.querySelectorAll("[data-slide]")).toHaveLength(3);
    expect(screen.getByText(/1\s*\/\s*3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next screen" }));
    expect(activeIndex(container)).toBe(1);
    expect(container.querySelector('[data-slide][data-active="true"]')?.textContent).toBe("b");
  });

  it("renders a lone child plainly — no stepper chrome", () => {
    render(
      <Slides>
        <figure data-testid="only">just one</figure>
      </Slides>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("only")).toBeTruthy();
  });
});
