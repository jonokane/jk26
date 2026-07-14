"use client";

import { useEffect, useRef, useState } from "react";
import { siteContent } from "@/lib/site-content";
import { farewellWordKey } from "@/lib/farewell-word";
import { useScene } from "@/components/sky/scene-provider";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import styles from "@/components/farewell/farewell.module.css";

/**
 * The farewell (spec §11): the site's last word, near-full-viewport, on the
 * scrim. The word comes from the visitor's own clock via `useScene()` — the
 * same source the sky reads — so it can never disagree with the sky, and it
 * tracks the scrubber live because it re-renders whenever that hour changes.
 *
 * `hour` is null until the provider has sampled (SSR / first paint); this
 * renders nothing until then, exactly like `TimeScrubber` — the alternative
 * (guessing a default word) is how a visitor would see the wrong one flash.
 */
export function Farewell() {
  const sectionRef = useRef<HTMLElement>(null);
  const { hour } = useScene();
  const reduced = useReducedMotionPref();
  const [revealed, setRevealed] = useState(false);
  /* The section itself doesn't render until `hour` resolves (below) — so on
     the very render that first mounts it, the ref is still attached to
     nothing. Keying the observer effect on this boolean (rather than `[]`)
     makes it re-run exactly once more, right after the section actually
     exists, instead of firing once against a null ref and never again. */
  const sampled = hour !== null;

  /* Tracks arrival independently of the reduced-motion preference — see the
     CSS: [data-static] overrides the animated state unconditionally, so this
     effect never needs to know about `reduced` and a live toggle can never
     leave it stuck. (By the time a visitor reaches System Settings the
     section has almost always already intersected once, so even the
     transition from static back to animated rarely has anything to animate
     from.) */
  useEffect(() => {
    if (!sampled) return;
    const el = sectionRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no observer support in this browser: show it rather than staying hidden forever
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [sampled]);

  if (hour === null) return null;

  const word = siteContent.farewell.words[farewellWordKey(hour)];

  return (
    <section
      id="farewell"
      ref={sectionRef}
      aria-label={siteContent.farewell.lead}
      className={`${styles.section} on-scrim`}
    >
      <div
        data-farewell-message
        className={styles.message}
        data-visible={revealed || undefined}
        data-static={reduced || undefined}
      >
        <p className={`heading-display ${styles.lead}`}>{siteContent.farewell.lead}</p>
        <p className={`heading-display ${styles.wish}`}>
          {siteContent.farewell.wishPrefix}
          <span data-farewell-word>{word}</span>
          {siteContent.farewell.wishSuffix}
        </p>
        <p className={`text-kicker ${styles.signature}`}>{siteContent.farewell.signature}</p>
      </div>
    </section>
  );
}
