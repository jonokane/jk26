import { afterEach, describe, expect, it } from "vitest";
import { preHydrationThemeScript } from "@/lib/pre-hydration-theme";
import { resolveTheme, THEME_STORAGE_KEY } from "@/lib/theme-engine";

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

// Test-only: `eval` here executes our own generated inline script — never
// user input — exactly as a browser would before hydration, mirroring the
// deleted pre-hydration-scene.test.ts's discipline.
function run() {
  eval(preHydrationThemeScript);
}

describe("preHydrationThemeScript", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("paints the OS preference when nothing is stored", () => {
    setSystemPrefersDark(true);
    run();
    expect(document.documentElement.dataset.theme).toBe(resolveTheme(null, true));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("paints light when the OS prefers light and nothing is stored", () => {
    setSystemPrefersDark(false);
    run();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  /* The case that matters: an explicit choice must beat the OS before first
     paint, or a dark-choosing visitor on a light OS gets a white flash — the
     exact failure the deleted scene script existed to prevent. */
  it("honours an explicit choice over the OS, matching the engine", () => {
    setSystemPrefersDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    run();
    expect(document.documentElement.dataset.theme).toBe(resolveTheme("dark", false));
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("ignores a stored value the engine would reject", () => {
    setSystemPrefersDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    run();
    expect(document.documentElement.dataset.theme).toBe("dark"); // fell back to the OS
  });

  it("uses the same storage key as the engine", () => {
    expect(preHydrationThemeScript).toContain(THEME_STORAGE_KEY);
  });

  /* It runs before anything else and must never break the page: a visitor
     with localStorage disabled would otherwise get a blank site. */
  it("is try/catch wrapped", () => {
    expect(preHydrationThemeScript).toContain("try{");
    expect(preHydrationThemeScript).toContain("catch");
  });
});
