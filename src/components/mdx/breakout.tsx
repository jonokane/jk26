import type { ReactNode } from "react";
import styles from "@/components/mdx/breakout.module.css";

/**
 * A case-study body image that escapes the reading measure (spec:
 * 2026-07-28 scroll visuals). Wraps a single markdown image — rendered by
 * MdxImage — in a centred band wider than the 62ch text column, using the
 * side whitespace. Collapses to inline width on narrow screens.
 *
 * Authored in MDX as:
 *   <Breakout>
 *
 *   ![alt](./media/…/shot.png "Caption")
 *
 *   </Breakout>
 * The blank lines are required — they let MDX parse the inside as Markdown,
 * which keeps Velite's src rewriting and the caption convention working.
 */
export function Breakout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.breakout} data-mdx-breakout>
      {children}
    </div>
  );
}
