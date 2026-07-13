import { mulberry32 } from "@/lib/seeded-random";
import styles from "@/components/sky/sky.module.css";

/** Irregular conic wedges, generated once from a fixed seed (hydration-safe). */
function washGradient(): string {
  const rnd = mulberry32(19790608);
  const wedges: string[] = [];
  let acc = 0;
  while (acc < 360) {
    const w = 4 + rnd() * 7;
    const gap = 6 + rnd() * 11;
    wedges.push(
      `rgba(255,216,150,.20) ${acc}deg ${acc + w}deg, rgba(255,216,150,0) ${acc + w}deg ${acc + w + gap}deg`,
    );
    acc += w + gap;
  }
  return `radial-gradient(circle, rgba(255,240,205,.55) 0 7%, rgba(255,240,205,0) 34%), conic-gradient(${wedges.join(",")})`;
}

const WASH_BACKGROUND = washGradient();

export function Rays() {
  return (
    <div className={styles.rays}>
      <div className={styles.raysAnchor}>
        <div className={styles.wash} style={{ background: WASH_BACKGROUND }} />
      </div>
    </div>
  );
}
