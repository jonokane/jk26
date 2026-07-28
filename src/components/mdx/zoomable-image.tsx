"use client";

import { useRef, useState } from "react";
import { Lightbox, type LightboxOrigin } from "@/components/mdx/lightbox";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/mdx/zoomable-image.module.css";

/**
 * The click-to-zoom trigger (spec: 2026-07-28 image zoom). Wraps a case-study
 * body image in a button; on activate it measures the image's rect and opens
 * the Lightbox, which FLIP-zooms from there. The button carries the accessible
 * name (the image alt, or a generic fallback) + aria-haspopup="dialog"; the
 * inner <img> is decorative (alt="") so the name isn't announced twice.
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
  const imgRef = useRef<HTMLImageElement>(null);
  const [origin, setOrigin] = useState<LightboxOrigin | null>(null);

  const open = () => {
    const r = imgRef.current?.getBoundingClientRect();
    if (r) setOrigin({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

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
