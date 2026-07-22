/**
 * Theme resolution (spec §4). Pure, so the pre-hydration script and the
 * hydrated app cannot drift apart — a test pins them together.
 *
 * v3 has no clock: the visitor's OS preference decides, and an explicit
 * choice overrides it. Two locked palettes, never interpolated.
 */

export type Theme = "light" | "dark";

/** What the visitor chose. "system" means "follow the OS", the default. */
export type ThemeChoice = Theme | "system";

/** Namespaced: localhost is shared with every other project on this machine. */
export const THEME_STORAGE_KEY = "jk-theme";

export const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme actually painted, from the stored choice and the OS preference. */
export function resolveTheme(choice: ThemeChoice | null, systemPrefersDark: boolean): Theme {
  if (choice === "light" || choice === "dark") return choice;
  return systemPrefersDark ? "dark" : "light";
}

/** Narrow an untrusted localStorage value. Anything unrecognized follows the OS. */
export function parseThemeChoice(raw: string | null): ThemeChoice {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}

/** Stamp the theme onto <html>, where the palettes key off it. Idempotent. */
export function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = theme;
  }
}
