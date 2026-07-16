import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY } from "@/lib/theme-engine";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/theme/theme-toggle.module.css";

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

/**
 * The button always renders BOTH labels — theme-toggle.module.css picks one
 * with `display: none`, keyed off `:root[data-theme]`. jsdom never applies
 * that stylesheet (CSS Modules are class-name-scoped here but the rules
 * themselves are not injected/evaluated), so both spans are always visible
 * to Testing Library and the button's accessible name reads "Dark Light" —
 * `findByRole("button", { name: "Dark" })` can no longer distinguish them.
 *
 * These tests instead assert the two things the CSS rule actually keys off:
 * `data-theme` resolves to the right value, and the span the stylesheet
 * would reveal for that value — identified by the exact class it selects on,
 * imported from the same module the component renders — carries the right
 * copy. That's an honest test of the real contract; it does not (and cannot,
 * under jsdom) assert that the *other* span is actually hidden on screen.
 */
function shownLabel(theme: "light" | "dark"): { className: string; text: string } {
  return theme === "dark"
    ? { className: styles.whenDark, text: siteContent.labels.theme.toLight }
    : { className: styles.whenLight, text: siteContent.labels.theme.toDark };
}

function expectShownLabel(theme: "light" | "dark") {
  const expected = shownLabel(theme);
  const span = document.querySelector(`.${expected.className}`);
  expect(span?.textContent).toBe(expected.text);
}

describe("ThemeToggle", () => {
  it("resolves data-theme to light, with the Dark-labeled span the OS-light case, when the OS prefers light", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    await screen.findByRole("button");
    expect(document.documentElement.dataset.theme).toBe("light");
    expectShownLabel("light");
  });

  it("resolves data-theme to dark, with the Light-labeled span shown, when the OS prefers dark", async () => {
    setSystemPrefersDark(true);
    render(<ThemeToggle />);
    await screen.findByRole("button");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expectShownLabel("dark");
  });

  /* An explicit choice must survive a reload that disagrees with the OS —
     that is the entire reason the choice is persisted. */
  it("honours a stored choice over the OS preference", async () => {
    setSystemPrefersDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    render(<ThemeToggle />);
    await screen.findByRole("button");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expectShownLabel("dark");
  });

  it("clicking flips data-theme, persists it, and actually changes what would render — not just storage", async () => {
    setSystemPrefersDark(false);
    render(<ThemeToggle />);
    const button = await screen.findByRole("button");

    expect(document.documentElement.dataset.theme).toBe("light");
    expectShownLabel("light");

    button.click();

    /* The click handler reads document.documentElement.dataset.theme live
       (not the hook's post-mount React state) so it stays correct even if
       state and the DOM ever disagree. Asserting data-theme here — not just
       localStorage — is the coverage that was missing: it proves the state
       that actually drives which label CSS shows changed, not merely that a
       side-effect fired. */
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expectShownLabel("dark");

    /* Round-trip: a second click must reverse it. This would fail if the
       handler ever regressed to computing "next" from stale closure state
       instead of the live DOM value. */
    button.click();

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expectShownLabel("light");
  });
});
