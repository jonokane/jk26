import Link from "next/link";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-next.module.css";

/**
 * The "Next: {study} →" teaser (spec §8) at the foot of a case study's vertical
 * read (and the earlier-item modal), from one definition. A real link, not a
 * scroll trick: it goes to the next study's page, so it works with JS off,
 * opens in a new tab, and copies.
 */
export function CaseStudyNext({ title, url }: { title: string; url: string }) {
  return (
    <p className={styles.next} data-case-study-panel="next">
      <Link href={url}>
        {siteContent.work.nextLabel}: {title}
      </Link>
    </p>
  );
}
