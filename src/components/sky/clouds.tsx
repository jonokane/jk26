import type { CSSProperties } from "react";
import styles from "@/components/sky/sky.module.css";

/** Crisp vector cloud: single silhouette, semi-transparent as a whole (group
 *  opacity — never per-ellipse, which would show overlap seams). */
function CloudShape() {
  return (
    <svg width="240" height="100" viewBox="0 0 240 100">
      <g fill="#fff" opacity="0.82">
        <ellipse cx="60" cy="66" rx="52" ry="24" />
        <ellipse cx="112" cy="46" rx="46" ry="30" />
        <ellipse cx="168" cy="64" rx="50" ry="24" />
        <ellipse cx="120" cy="70" rx="80" ry="22" />
      </g>
    </svg>
  );
}

/** scale, top (vh), drift duration (s), negative delay (s), base x-position (vw)
 *  — from the approved prototype. The base x-position is the resting spot
 *  under `prefers-reduced-motion: reduce` (animation disabled, so the
 *  `drift` keyframes never run); it also gives clouds a natural spread
 *  instead of stacking at left:0 before the drift animation kicks in. */
const CLOUDS: Array<[number, number, number, number, number]> = [
  [0.9, 10, 150, -40, 8],
  [0.65, 24, 205, -120, 30],
  [1.25, 16, 110, -70, 55],
  [0.5, 34, 175, -20, 74],
  [1.0, 6, 240, -180, 88],
];

export function Clouds() {
  return (
    <div className={styles.clouds}>
      {CLOUDS.map(([scale, topVh, durS, delayS, xVw], i) => (
        <div
          key={i}
          className={styles.cloud}
          style={
            {
              top: `${topVh}vh`,
              "--s": scale,
              "--d": `${durS}s`,
              "--dl": `${delayS}s`,
              "--x": `${xVw}vw`,
            } as CSSProperties
          }
        >
          <CloudShape />
        </div>
      ))}
    </div>
  );
}
