import { describe, expect, it } from "vitest";
import {
  applyTheme,
  parseThemeChoice,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "@/lib/theme-engine";

describe("resolveTheme", () => {
  it("honours an explicit choice over the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("follows the system preference when the choice is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  /* First visit: nothing stored. The OS decides — never a hardcoded default. */
  it("follows the system preference when nothing is stored", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });
});

describe("parseThemeChoice", () => {
  it("accepts the three valid choices", () => {
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("system")).toBe("system");
  });

  /* localStorage is user-writable and survives deploys. Garbage must not
     paint a broken theme; it must fall back to following the OS. */
  it("falls back to system for anything else", () => {
    expect(parseThemeChoice(null)).toBe("system");
    expect(parseThemeChoice("")).toBe("system");
    expect(parseThemeChoice("DARK")).toBe("system");
    expect(parseThemeChoice("midnight")).toBe("system");
  });
});

describe("applyTheme", () => {
  it("stamps the theme onto the document element", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});

describe("THEME_STORAGE_KEY", () => {
  it("is namespaced so it cannot collide on localhost", () => {
    expect(THEME_STORAGE_KEY).toMatch(/^jk-/);
  });
});
