import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** top (vh), flight duration (s), negative delay (s). */
const BIRDS: Array<[number, number, number]> = [
  [24, 30, -6],
  [33, 42, -22],
];

export function Birds() {
  return (
    <div className={styles.birds}>
      {BIRDS.map(([topVh, durS, delayS], i) => (
        <div
          key={i}
          className={styles.bird}
          style={{ top: `${topVh}vh`, "--d": `${durS}s`, "--dl": `${delayS}s` } as CSSProperties}
        >
          <svg width="26" height="12" viewBox="0 0 26 12">
            <path
              d="M1 9 Q7 1 13 9 Q19 1 25 9"
              stroke="currentColor"
              strokeWidth="1.7"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
