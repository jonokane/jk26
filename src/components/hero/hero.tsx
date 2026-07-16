import { siteContent } from "@/lib/site-content";
import styles from "@/components/hero/hero.module.css";

/**
 * Phase 1 stub. The letters are already split into spans so Phase 2's
 * per-letter build-in and living gradient have somewhere to land (spec §6).
 *
 * The accessible name sits on the <h1> itself, never on a copy that motion
 * can hide. The prototype puts it on the fly copy, which is display:none
 * under reduced motion — leaving the wordmark with no accessible name at all
 * (spec §6, bug 2). Keep it here when Phase 2 adds the fly copy.
 */
export function Hero() {
  return (
    <section className={styles.hero} id="welcome">
      <p className={styles.kicker}>{siteContent.kicker}</p>
      <h1 className={styles.wordmark} aria-label={siteContent.wordmark}>
        {siteContent.wordmark.split("").map((letter, i) => (
          <span key={i} className={styles.letter} aria-hidden="true">
            {letter}
          </span>
        ))}
      </h1>
      <p className={styles.tagline}>{siteContent.tagline}</p>
      <p className={styles.scrollCue}>{siteContent.labels.scrollCue}</p>
    </section>
  );
}
