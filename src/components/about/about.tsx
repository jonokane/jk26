import { siteContent } from "@/lib/site-content";
import styles from "@/components/about/about.module.css";

/**
 * The About section (spec §7): heading + lede, the four-beat "About wall"
 * (2x2 grid, single column under ~760px), and the CTA row below it.
 *
 * This is deliberately the plain vertical document — no motion. It is also
 * the required reduced-motion path (spec §12): the scrubbed collector
 * choreography (beats -> tray -> wall) lands in a later pass ON TOP of this
 * markup, so each beat carries a stable class (`.beat`) and a `data-beat`
 * hook rather than being a nameless nested div — something for that pass to
 * address directly instead of re-deriving structure.
 */
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className={`${styles.section} scroll-mt-28`}>
      <h2 id="about-title" className={`heading-display text-ink text-4xl sm:text-5xl ${styles.heading}`}>
        {siteContent.titles.about}
      </h2>
      <p className={`text-sub ${styles.lede}`}>{siteContent.about.lede}</p>

      <div className={styles.wall}>
        {siteContent.beats.map((beat) => (
          <div key={beat.title} data-beat className={`slab ${styles.beat}`}>
            <h3 className={`text-kicker text-sm ${styles.beatTitle}`}>{beat.title}</h3>
            <p className={styles.statement}>{beat.statement}</p>
          </div>
        ))}
      </div>

      <div className={styles.ctas}>
        <a href="#work" className="pill">
          {siteContent.about.ctas.work}
        </a>
        <a href="#contact" className="pill">
          {siteContent.about.ctas.contact}
        </a>
      </div>

      <div className={styles.secondary}>
        {siteContent.about.secondary.map(({ label, key }) => {
          const href = siteContent.links[key];
          if (!href) return null; // no URL yet (spec §7) — the pill stays hidden by design
          const external = href.startsWith("http");
          return (
            <a
              key={key}
              href={href}
              className="pill pill-secondary"
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
