"use client";

import { siteContent } from "@/lib/site-content";
import { useTheme } from "@/components/theme/use-theme";
import styles from "@/components/theme/theme-toggle.module.css";

/**
 * The theme control (spec §4). Type, not an icon — the design is type-only.
 * The button names the mode it switches TO, so the label is never ambiguous.
 */
export function ThemeToggle() {
  const { theme, setChoice } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? siteContent.labels.theme.toDark : siteContent.labels.theme.toLight;

  return (
    <button type="button" className={styles.toggle} onClick={() => setChoice(next)}>
      {label}
    </button>
  );
}
