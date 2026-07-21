import Image from "next/image";
import type { CaseStudy } from "#site/content";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-cover.module.css";

/**
 * The case study's wide image slot (spec §10, the prototype's `.dshot`): a full-
 * width band at the foot of the article. Hatched placeholder + a mono caption
 * until `cover` is set in frontmatter, at which point a real screen drops in with
 * no code change — the same treatment the gallery card's shot uses.
 */
export function CaseStudyCover({ study }: { study: CaseStudy }) {
  return (
    <div className={styles.shot} data-case-study-panel="cover">
      {study.cover ? (
        <Image
          src={study.cover.src}
          alt={study.title}
          fill
          /* The cover sits in the max-width:1000px article (6vw padding), so it
             tops out ~880px, never the full viewport. */
          sizes="(min-width: 1000px) 880px, 88vw"
          placeholder="blur"
          blurDataURL={study.cover.blurDataURL}
          className={styles.cover}
        />
      ) : (
        <span className={styles.caption}>{siteContent.work.detailShotCaption}</span>
      )}
    </div>
  );
}
