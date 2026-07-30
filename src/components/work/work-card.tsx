import Image from "next/image";
import Link from "next/link";
import type { CaseStudy } from "#site/content";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work-card.module.css";

/**
 * One study, as a gallery card (spec §9).
 *
 * Dumb on purpose: it is handed its number rather than deriving one, because
 * the number is a property of the whole published list and must be identical
 * here, in the index, and on /work/[slug]. `work-lists.ts` owns that.
 *
 * The card IS the link — a link nested inside a card would give a small target
 * inside a large clickable-looking area.
 */
export function WorkCard({ study, number }: { study: CaseStudy; number: number }) {
  return (
    /* next/link, not <a href>: §10's slide-up modal is an intercepting route,
       and Next only intercepts a client-side Link navigation — a raw anchor does
       a full page load and forecloses it. The codebase already uses Link in
       site-header, case-study-next and /work/[slug]. */
    <Link
      href={study.url}
      className={styles.card}
      data-work-card
      data-slug={study.slug}
      style={{ opacity: 1 }}
    >
      {/* The perimeter stroke the gallery traces while this card holds at the
          focus (spec §9): the moving proof that a still card is still catching
          the scroll. use-gallery drives `stroke-dashoffset` on the rect; the
          card owns none of that logic. `pathLength={1}` normalizes the perimeter
          so the offset is a plain 0..1 fraction whatever the card's real size,
          and non-scaling-stroke keeps it a crisp 2px. Decorative — aria-hidden. */}
      <svg className={styles.trace} preserveAspectRatio="none" aria-hidden="true">
        <rect
          data-trace
          className={styles.traceRect}
          x="0"
          y="0"
          width="100%"
          height="100%"
          pathLength={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className={styles.text}>
        <div className={styles.top}>
          <span className={styles.num}>{formatStudyNumber(number)}</span>
          <span className={styles.year}>{study.year}</span>
        </div>
        <h3 className={styles.title}>{study.title}</h3>
        <p className={styles.impact}>{study.impact}</p>
        {study.tags.length > 0 && (
          <ul className={styles.tags} data-tags>
            {study.tags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <span className={styles.view}>{siteContent.work.viewLabel}</span>
      </div>
      <div className={styles.shot} data-has-cover={study.cover ? "" : undefined}>
        {study.cover ? (
          <Image
            src={study.cover.src}
            alt={study.title}
            fill
            /* Covers are UI screenshots — fine text and flat gradients that the
               default quality (75) mushes into visible WebP/AVIF artifacts. 90
               keeps them crisp for a modest size bump. */
            quality={90}
            /* The shot box is PORTRAIT but covers are landscape (~2:1), so
               object-fit:cover scales the image up to fill the box HEIGHT and
               crops the sides — the image renders ~box-height × 2 wide (~950px),
               far wider than the ~290px box. Hinting the box width (320px) made
               next/image serve a ~320px variant that then upscaled ~3× into the
               crop, reading as low-fi. Hint the cover-crop's true render width so
               a sharp variant is served (height-driven, so a flat value). */
            sizes="1000px"
            placeholder="blur"
            blurDataURL={study.cover.blurDataURL}
            className={styles.cover}
          />
        ) : (
          <span className={styles.shotCaption}>{siteContent.work.shotPending}</span>
        )}
      </div>
    </Link>
  );
}
