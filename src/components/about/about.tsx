import { siteContent } from "@/lib/site-content";
import styles from "@/components/about/about.module.css";

/**
 * Phase 1 stub. The four beats render as plain paragraphs — the same copy
 * Phase 3's teleprompter animates word by word (spec §8). The statements move
 * to content/site/about.mdx in Phase 3; they stay in site-content.ts until then
 * so this phase changes presentation only.
 */
export function About() {
  return (
    <section className={styles.about} id="about" aria-labelledby="about-title">
      <h2 className={styles.title} id="about-title">
        {siteContent.titles.about}
      </h2>
      <p className={styles.lede}>{siteContent.about.lede}</p>
      {siteContent.beats.map((beat) => (
        <p key={beat.title} className={styles.statement}>
          {beat.statement}
        </p>
      ))}
    </section>
  );
}
