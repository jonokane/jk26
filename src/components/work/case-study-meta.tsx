import type { ReactNode } from "react";
import type { CaseStudy } from "#site/content";
import { isViewUrl, urlLabel } from "@/components/work/url-label";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/case-study-meta.module.css";

const { metaLabels } = siteContent.work;

/**
 * The attribute grid (spec §10): Client / Sector / Discipline / Platform /
 * Role / Timeframe / View the work, as a bordered dt/dd `dl`. Split out
 * from CaseStudyArticle so it stays one component, one purpose (spec §15).
 */
export function CaseStudyMeta({ study }: { study: CaseStudy }) {
  const rows: { key: string; label: string; value: ReactNode }[] = [
    { key: "client", label: metaLabels.client, value: study.client },
    { key: "sector", label: metaLabels.sector, value: study.sector.join(", ") },
    { key: "discipline", label: metaLabels.discipline, value: study.discipline.join(", ") },
    { key: "platform", label: metaLabels.platform, value: study.platform.join(", ") },
    { key: "role", label: metaLabels.role, value: study.role },
    { key: "timeframe", label: metaLabels.timeframe, value: study.timeframe },
    {
      key: "view",
      label: metaLabels.view,
      value: isViewUrl(study.view) ? (
        <a href={study.view} target="_blank" rel="noreferrer" className={styles.link}>
          {urlLabel(study.view)}
        </a>
      ) : (
        study.view
      ),
    },
  ];

  return (
    <dl className={styles.meta} data-case-study-panel="meta">
      {rows.map(({ key, label, value }) => (
        <div key={key}>
          <dt className={styles.label}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
