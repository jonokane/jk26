import { Children, type ReactNode } from "react";
import styles from "@/components/mdx/pin.module.css";

/**
 * A held case-study image (spec: 2026-07-28 scroll visuals). The FIRST block
 * child is the media; it holds in view (CSS position: sticky) while the
 * remaining children — the prose — scroll past it in a side column.
 *
 * Dead-still by design: no ScrollTrigger, no RAF, no scroll listener. The hold
 * is pure CSS, so it behaves identically on the full page and inside the
 * modal's own scroller.
 *
 * Authored as:
 *   <Pin>
 *
 *   ![alt](./media/…/shot.png "Caption")
 *
 *   Paragraph that scrolls past…
 *
 *   Another paragraph…
 *
 *   </Pin>
 *
 * Fail-safe: a Pin with only one child (no prose to scroll past) is just a
 * figure — render it plainly rather than stranding it in an empty sticky slot.
 */
export function Pin({ children }: { children: ReactNode }) {
  const [media, ...rest] = Children.toArray(children);

  if (rest.length === 0) return <>{media}</>;

  return (
    <div className={styles.pin}>
      <div className={styles.media} data-pin-panel="media">
        {media}
      </div>
      <div className={styles.text} data-pin-panel="text">
        {rest}
      </div>
    </div>
  );
}
