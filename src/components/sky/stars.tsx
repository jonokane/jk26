import type { CSSProperties } from "react";
import { mulberry32 } from "@/lib/seeded-random";
import styles from "@/components/sky/sky.module.css";

const STAR_COUNT = 110;
const SPARKLE_COUNT = 9;
const SEED = 20260711;

interface Star {
  leftVw: number;
  topVh: number;
  sizePx: number;
  durS: number;
  delayS: number;
}

function makeField(): { stars: Star[]; sparkles: Star[] } {
  const rnd = mulberry32(SEED);
  const make = (size: () => number, topMax: number): Star => ({
    leftVw: rnd() * 100,
    topVh: rnd() * topMax,
    sizePx: size(),
    durS: 2 + rnd() * 4,
    delayS: -rnd() * 5,
  });
  return {
    stars: Array.from({ length: STAR_COUNT }, () => make(() => 1 + rnd() * 1.8, 72)),
    sparkles: Array.from({ length: SPARKLE_COUNT }, () => make(() => 8 + rnd() * 8, 60)),
  };
}

const FIELD = makeField(); // module-level: computed once, identical on server & client

const starStyle = (s: Star): CSSProperties =>
  ({
    left: `${s.leftVw}vw`,
    top: `${s.topVh}vh`,
    width: s.sizePx,
    height: s.sizePx,
    "--d": `${s.durS.toFixed(1)}s`,
    "--dl": `${s.delayS.toFixed(1)}s`,
  }) as CSSProperties;

export function Stars() {
  return (
    <div className={styles.stars}>
      {FIELD.stars.map((s, i) => (
        <span key={i} className={styles.star} style={starStyle(s)} />
      ))}
      {FIELD.sparkles.map((s, i) => (
        <span key={i} className={styles.sparkle} style={starStyle(s)}>
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path
              d="M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z"
              fill="#fff"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
