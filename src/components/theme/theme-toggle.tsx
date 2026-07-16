"use client";

import { siteContent } from "@/lib/site-content";
import { useTheme } from "@/components/theme/use-theme";
import styles from "@/components/theme/theme-toggle.module.css";

/**
 * The theme control (spec §4). Type, not an icon — the design is type-only.
 * The button names the mode it switches TO, so the label is never ambiguous.
 *
 * `useTheme()` returns "light" on SSR and the first client render (it only
 * corrects itself in an effect), so a label picked from that post-mount state
 * is wrong for every dark-resolved visitor from first paint until hydration
 * commits — precisely the flash the pre-hydration script exists to prevent.
 * Instead we render BOTH labels and let CSS pick one off `data-theme`, which
 * the inline script has already stamped on <html> before first paint:
 * `display: none` drops the other label from the accessibility tree, so the
 * accessible name is always exactly one correct word, and both spans are
 * always in the DOM so there's no hydration mismatch to warn about.
 */
export function ThemeToggle() {
  const { setChoice } = useTheme();

  const onClick = () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setChoice(current === "dark" ? "light" : "dark");
  };

  return (
    <button type="button" className={styles.toggle} onClick={onClick}>
      <span className={styles.whenLight}>{siteContent.labels.theme.toDark}</span>
      <span className={styles.whenDark}>{siteContent.labels.theme.toLight}</span>
    </button>
  );
}
