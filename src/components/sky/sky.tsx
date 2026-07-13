import type { ReactNode } from "react";
import styles from "@/components/sky/sky.module.css";

/**
 * The fixed full-viewport living background (spec §3). Layers mount as
 * children so each element family stays its own small component.
 */
export function Sky({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.sky} aria-hidden="true">
      <div className={styles.gradient} />
      {children}
    </div>
  );
}
