import styles from "@/components/sky/sky.module.css";

export function SunMoon() {
  return (
    <>
      <div className={styles.sunLayer}>
        <div className={styles.sun} />
      </div>
      <div className={styles.moonLayer}>
        <div className={styles.moon} />
      </div>
    </>
  );
}
