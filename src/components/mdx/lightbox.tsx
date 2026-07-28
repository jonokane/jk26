"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { useOverlayLock } from "@/lib/use-overlay-lock";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/lightbox.module.css";

export type LightboxOrigin = { top: number; left: number; width: number; height: number };

const TRANSITION = "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)";

function flipTransform(o: LightboxOrigin, t: DOMRect): string {
  const sx = o.width / t.width;
  const sy = o.height / t.height;
  const tx = o.left - t.left;
  const ty = o.top - t.top;
  return `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
}

/**
 * The zoomed image (spec: 2026-07-28 image zoom). FLIP-animates from the
 * clicked image's rect (`origin`) up to a full-viewport figure, over a stark
 * canvas backdrop. Esc / backdrop / image click dismiss it — playing the FLIP
 * in reverse, then calling `onClose` (which unmounts us). Reduced motion skips
 * the transform and just cross-fades.
 */
export function Lightbox({
  src,
  alt,
  caption,
  origin,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  origin: LightboxOrigin;
  onClose: () => void;
}) {
  const reduced = useReducedMotionPref();
  const dialogRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const flip = useRef("");
  const [phase, setPhase] = useState<"enter" | "open" | "exit">("enter");

  const dismiss = () => {
    if (phase === "exit") return;
    setPhase("exit");
    const fig = figureRef.current;
    if (reduced || !fig || !flip.current) {
      onClose();
      return;
    }
    fig.style.transition = TRANSITION;
    fig.style.transform = flip.current; // animate back to origin
  };

  useOverlayLock({ containerRef: dialogRef, onDismiss: dismiss });

  // ENTER FLIP: jump to the origin rect without transition, force a reflow so
  // that paints, then release to the natural (full-viewport) position so it
  // animates origin -> target.
  useEffect(() => {
    const fig = figureRef.current;
    if (reduced || !fig) {
      setPhase("open");
      return;
    }
    const target = fig.getBoundingClientRect();
    if (!target.width || !target.height) {
      setPhase("open"); // no measurable target (e.g. jsdom) — skip the FLIP
      return;
    }
    flip.current = flipTransform(origin, target);
    fig.style.transition = "none";
    fig.style.transform = flip.current;
    void fig.offsetWidth; // force reflow
    fig.style.transition = TRANSITION;
    fig.style.transform = "";
    setPhase("open");
  }, [reduced, origin]);

  const onFigureTransitionEnd = (event: React.TransitionEvent) => {
    if (phase === "exit" && event.propertyName === "transform") onClose();
  };

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.backdrop}
      data-phase={phase}
      role="dialog"
      aria-modal="true"
      aria-label={alt || caption || siteContent.work.zoomActionLabel}
      tabIndex={-1}
      onClick={dismiss}
    >
      <button
        type="button"
        className={styles.close}
        aria-label={siteContent.work.lightboxCloseLabel}
        onClick={dismiss}
      >
        {siteContent.work.lightboxCloseLabel}
      </button>
      <figure
        ref={figureRef}
        className={styles.figure}
        onTransitionEnd={onFigureTransitionEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- same lazy <img>
            treatment as the on-page figure; no intrinsic size for next/image. */}
        <img src={src} alt={alt} className={styles.image} />
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>
    </div>,
    document.body,
  );
}
