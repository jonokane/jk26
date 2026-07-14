"use client";

import { useRef } from "react";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { collectorCopy } from "@/components/about/collector-copy";
import { useCollector } from "@/components/about/use-collector";
import styles from "@/components/about/about.module.css";

/**
 * The About section (spec §7).
 *
 * What is written here is the plain vertical document: heading + lede, the
 * four beats as a 2×2 wall of slabs, the CTA row. That is what the server
 * sends, what a visitor without JavaScript reads, and what a visitor who asked
 * for reduced motion keeps (spec §12).
 *
 * `useCollector` then upgrades exactly this markup, in place, into the
 * scroll-driven collector — the beats rise, hold center stage, pocket into a
 * tray and unpack into the wall. It owns the `data-collector` attribute that
 * switches the layout, so the choreography can only ever be *added* to the
 * document below, never subtracted from it.
 */
export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  const reduced = useReducedMotionPref();
  useCollector({ sectionRef, stageRef, introRef, footerRef, hintRef, active: !reduced });

  return (
    <section
      id="about"
      ref={sectionRef}
      aria-labelledby="about-title"
      className={`${styles.section} scrim-ramp scroll-mt-28`}
      /* The collector's travel is a function of how many beats there are; the
         CSS does that arithmetic (see .section[data-collector]). */
      style={{ "--collector-beats": siteContent.beats.length } as React.CSSProperties}
    >
      <div ref={stageRef} className={styles.stage}>
        <div ref={introRef} className={styles.intro}>
          <h2 id="about-title" className={`heading-display text-ink text-4xl sm:text-5xl ${styles.heading}`}>
            {siteContent.titles.about}
          </h2>
          <p className={`text-sub ${styles.lede}`}>{siteContent.about.lede}</p>
        </div>

        <div className={styles.wall}>
          {siteContent.beats.map((beat) => (
            <div key={beat.title} data-beat className={`slab ${styles.beat}`}>
              <h3 className={`text-kicker text-sm ${styles.beatTitle}`}>{beat.title}</h3>
              <p className={styles.statement}>{beat.statement}</p>
            </div>
          ))}
        </div>

        <div ref={footerRef} className={styles.footer}>
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
        </div>

        {/* Motion chrome: the tray only exists inside the collector, so the
            static document hides this (display: none) rather than dropping it
            from the tree on a reduced-motion toggle. */}
        <p ref={hintRef} aria-hidden="true" className={`text-kicker ${styles.trayHint}`}>
          {collectorCopy.trayHint}
        </p>
      </div>
    </section>
  );
}
