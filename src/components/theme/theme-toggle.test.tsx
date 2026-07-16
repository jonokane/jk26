import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY } from "@/lib/theme-engine";
import { siteContent } from "@/lib/site-content";

function setSystemPrefersDark(dark: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: dark,
    media: q,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("offers dark when the OS prefers light", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toDark })).toBeTruthy();
  });

  it("offers light when the OS prefers dark", async () => {
    setSystemPrefersDark(true);
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toLight })).toBeTruthy();
  });

  it("applies and persists the chosen theme", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    const button = await screen.findByRole("button", { name: siteContent.labels.theme.toDark });
    button.click();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  /* An explicit choice must survive a reload that disagrees with the OS —
     that is the entire reason the choice is persisted. */
  it("honours a stored choice over the OS preference", async () => {
    setSystemPrefersDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    expect(await screen.findByRole("button", { name: siteContent.labels.theme.toLight })).toBeTruthy();
  });
});
