"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { publishedWork, sortedEarlierWork } from "@/components/work/work-data";
import { attributeParts } from "@/components/work/earlier-work";
import { isViewUrl } from "@/components/work/url-label";
import {
  NO_FILTER,
  applyFilter,
  facetValues,
  isFilterActive,
} from "@/components/work/work-filters";
import type { Facet, WorkFilter } from "@/components/work/work-filters";
import { formatStudyNumber } from "@/components/work/work-lists";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/work/work.module.css";

/**
 * One facet's row of pills. Jono chose these over native <select>s; the filter
 * bar is speced in §9 but exists in no prototype, so it borrows the card's tag
 * pill rather than inventing a fifth thing.
 *
 * Buttons with `aria-pressed`, not links and not a listbox: each pill is an
 * independent on/off, which is exactly what aria-pressed describes. Clicking a
 * pressed pill clears it — the same gesture that set it, so the clear button is
 * a convenience and never the only way out.
 */
function FacetRow({
  facet,
  label,
  values,
  chosen,
  onChoose,
}: {
  facet: Facet;
  label: string;
  values: string[];
  chosen: string | null;
  onChoose: (value: string | null) => void;
}) {
  return (
    <div className={styles.facet}>
      <span className={styles.filterLabel}>{label}</span>
      {values.map((value) => {
        const pressed = chosen === value;
        return (
          <button
            key={`${facet}-${value}`}
            type="button"
            className={styles.pill}
            aria-pressed={pressed}
            /* The pill shows the bare value; the accessible name carries the
               facet too, or a screen reader hears "Music" with no idea what it
               filters. */
            aria-label={`${label}${siteContent.work.filters.pillPrefix}${value}`}
            onClick={() => onChoose(pressed ? null : value)}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The vertical index (spec §9): every study as a row, filterable by Sector and
 * Discipline, both derived from frontmatter.
 *
 * Also the automatic fallback — under ~900px and under reduced motion the
 * gallery collapses to this, which is why it must stand on its own.
 *
 * A row's number is its position in `publishedWork`, NOT its position in the
 * filtered list: the number is the study's identity and it must read the same
 * here, on a card, and on /work/[slug].
 */
export function WorkIndex({ toggle }: { toggle?: ReactNode }) {
  const [filter, setFilter] = useState<WorkFilter>(NO_FILTER);

  const sectors = useMemo(() => facetValues(publishedWork, "sector"), []);
  const disciplines = useMemo(() => facetValues(publishedWork, "discipline"), []);
  const shown = useMemo(() => applyFilter(publishedWork, filter), [filter]);

  return (
    <div className={styles.index}>
      {/* The index owns #work-title when it is the shown view — under reduced
          motion or on a narrow viewport the gallery (which normally pins the
          title) is not rendered at all, so aria-labelledby must resolve here. */}
      <div className={styles.indexHead}>
        <h2 className={styles.indexTitle} id="work-title">
          {siteContent.titles.work}
        </h2>
        {toggle}
      </div>

      <div className={styles.filters} role="group" aria-label={siteContent.work.filters.region}>
        <FacetRow
          facet="sector"
          label={siteContent.work.filters.sector}
          values={sectors}
          chosen={filter.sector}
          onChoose={(value) => setFilter((f) => ({ ...f, sector: value }))}
        />
        <FacetRow
          facet="discipline"
          label={siteContent.work.filters.discipline}
          values={disciplines}
          chosen={filter.discipline}
          onChoose={(value) => setFilter((f) => ({ ...f, discipline: value }))}
        />
        {isFilterActive(filter) && (
          <button type="button" className={styles.clear} onClick={() => setFilter(NO_FILTER)}>
            {siteContent.work.filters.clear}
          </button>
        )}
      </div>

      {/* The two facets AND (see work-filters), so they can narrow to nothing —
          and not rarely: with the studies published today, 4 of the 20 two-facet
          combinations match no study. Without this the rows just vanish and the
          index reads as broken rather than as empty. `role="status"` so the
          result is announced: a screen reader user pressing a pill otherwise
          gets silence and no way to know why. The clear control is already on
          screen beside it, since isFilterActive is necessarily true here. */}
      {shown.length === 0 && (
        <p className={styles.empty} role="status">
          {siteContent.work.filters.empty}
        </p>
      )}

      <ol className={styles.rows}>
        {shown.map((study) => (
          <li key={study.slug} className={styles.row} data-work-row>
            <Link href={study.url} className={styles.rowLink}>
              <span className={styles.rowNum}>
                {formatStudyNumber(publishedWork.indexOf(study) + 1)}
              </span>
              <span className={styles.rowTitle}>{study.title}</span>
              <span className={styles.rowMeta}>{study.year}</span>
            </Link>
            {/* Decoration, not copy: the arrow is CSS `content` (see .rowArrow),
                not a text node, so it reaches neither the clipboard nor a screen
                reader (spec §15) — the same treatment as the card's arrow. */}
            <span className={styles.rowArrow} aria-hidden="true" />
          </li>
        ))}
      </ol>

      {/* The earlier work — the gallery's last panel, brought into the index as a
          separate, smaller list so the index does not lose it. Not part of the
          filtered set above (it is a distinct "and older work" section), so it is
          always shown. The title is the link when the project has a live URL. */}
      <section className={styles.earlier} aria-labelledby="index-earlier-title">
        <h3 id="index-earlier-title" className={styles.earlierHeading}>
          {siteContent.work.earlierTitle}
        </h3>
        <ul className={styles.earlierRows}>
          {sortedEarlierWork.map((entry) => (
            <li key={entry.title} className={styles.earlierRow} data-work-earlier-row>
              <h4 className={styles.earlierRowTitle}>
                {isViewUrl(entry.view) ? (
                  <a
                    href={entry.view}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.earlierRowLink}
                  >
                    {entry.title}
                  </a>
                ) : (
                  entry.title
                )}
              </h4>
              <p className={styles.earlierRowMeta}>
                {attributeParts(entry).map((part, i) => (
                  <span key={i}>{part}</span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
