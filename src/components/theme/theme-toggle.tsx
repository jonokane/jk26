"use client";

import { siteContent } from "@/lib/site-content";
import { useTheme } from "@/components/theme/use-theme";
import { MoonStarIcon, SunIcon } from "@/components/icons";
import styles from "@/components/theme/theme-toggle.module.css";

/**
 * The theme control (spec §4). An icon that names the mode it switches TO — a
 * moon in light (→ dark), a sun in dark (→ light). The word itself is kept as
 * visually-hidden text so the button still has a correct accessible name (the
 * icon is decorative, spec §15).
 *
 * `useTheme()` returns "light" on SSR and the first client render (it only
 * corrects itself in an effect), so an icon picked from that post-mount state
 * is wrong for every dark-resolved visitor from first paint until hydration
 * commits — precisely the flash the pre-hydration script exists to prevent.
 * Instead we render BOTH icon+label pairs and let CSS pick one off `data-theme`,
 * which the inline script has already stamped on <html> before first paint:
 * `display: none` drops the other from the accessibility tree, so the accessible
 * name is always exactly one correct word, and both are always in the DOM so
 * there's no hydration mismatch to warn about.
 */
export function ThemeToggle() {
  const { setChoice } = useTheme();

  const onClick = () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setChoice(current === "dark" ? "light" : "dark");
  };

  return (
    <button type="button" className={styles.toggle} onClick={onClick}>
      <span className={styles.whenLight}>
        <MoonStarIcon className={styles.icon} />
        <span className={styles.srOnly}>{siteContent.labels.theme.toDark}</span>
      </span>
      <span className={styles.whenDark}>
        <SunIcon className={styles.icon} />
        <span className={styles.srOnly}>{siteContent.labels.theme.toLight}</span>
      </span>
    </button>
  );
}
