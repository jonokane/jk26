import { siteContent } from "@/lib/site-content";
import styles from "@/components/site-footer.module.css";

/**
 * The site sign-off (one line, the very bottom of the one-pager). Distinct from
 * the Contact section's own footer (email + links); this is the closing note.
 * Copy lives in site-content (spec §15).
 */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.line}>{siteContent.footer}</p>
    </footer>
  );
}
