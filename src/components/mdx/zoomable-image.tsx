"use client";

import { useRef, useState } from "react";
import { Lightbox, type LightboxOrigin } from "@/components/mdx/lightbox";
import { useZoomEnabled } from "@/components/mdx/zoom-context";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/zoomable-image.module.css";

/**
 * The click-to-zoom trigger (spec: 2026-07-28 image zoom). Wraps a case-study
 * body image in a button; on activate it measures the image's rect and opens
 * the Lightbox, which FLIP-zooms from there. The button carries the accessible
 * name (the image alt, or a generic fallback) + aria-haspopup="dialog"; the
 * inner <img> is decorative (alt="") so the name isn't announced twice.
 *
 * Inside a <Breakout> (ZoomDisabled) the image is already displayed at or
 * beyond full-screen size, so zoom could only shrink it — there we render a
 * plain figure image with no trigger.
 */
export function ZoomableImage({
  src,
  alt,
  caption,
  imgClassName,
}: {
  src: string;
  alt: string;
  caption?: string;
  imgClassName?: string;
}) {
  const zoomEnabled = useZoomEnabled();
  const imgRef = useRef<HTMLImageElement>(null);
  const [origin, setOrigin] = useState<LightboxOrigin | null>(null);

  const open = () => {
    const r = imgRef.current?.getBoundingClientRect();
    if (r) setOrigin({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  // Zoom suppressed (e.g. inside a Breakout): a plain figure image, no trigger.
  // The alt lives on the <img> itself here — there's no button to carry it.
  if (!zoomEnabled) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- lazy <img>: no
      // intrinsic size for next/image.
      <img src={src} alt={alt} loading="lazy" decoding="async" className={imgClassName} />
    );
  }

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={alt || siteContent.work.zoomActionLabel}
        aria-haspopup="dialog"
        onClick={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- lazy <img>: no
            intrinsic size for next/image. alt="" — the button carries the name. */}
        <img ref={imgRef} src={src} alt="" loading="lazy" decoding="async" className={imgClassName} />
      </button>
      {origin ? (
        <Lightbox src={src} alt={alt} caption={caption} origin={origin} onClose={() => setOrigin(null)} />
      ) : null}
    </>
  );
}
