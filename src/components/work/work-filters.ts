import type { CaseStudy } from "#site/content";

/**
 * The index's filtering (spec §9) — pure, and with no `#site/content` value
 * import, so it stays unit-testable without the generated content module (the
 * `work-lists.ts` house style, spec §15).
 *
 * Both facets are derived from frontmatter, so adding a study or drafting one
 * changes the filter bar with no code edit and no new content.
 */

/** The frontmatter arrays the index filters on. Spec §9 names exactly these two. */
export type Facet = "sector" | "discipline";

/** `null` means "not filtered by this facet". */
export interface WorkFilter {
  sector: string | null;
  discipline: string | null;
}

export const NO_FILTER: WorkFilter = { sector: null, discipline: null };

/** Every distinct value of `facet` across `studies`, sorted for a stable bar. */
export function facetValues(studies: readonly CaseStudy[], facet: Facet): string[] {
  const values = new Set<string>();
  for (const study of studies) {
    for (const value of study[facet]) values.add(value);
  }
  return [...values].sort();
}

/**
 * The studies matching every chosen facet.
 *
 * The two facets AND rather than OR: choosing Music and Front-end asks for a
 * study that is both. An OR would return studies matching neither choice fully,
 * which reads as the filter being ignored.
 *
 * Order is preserved — it is `publishedWork`'s order, which is the study
 * numbering, and a filtered row must keep the number it has everywhere else.
 */
export function applyFilter(studies: readonly CaseStudy[], filter: WorkFilter): CaseStudy[] {
  return studies.filter(
    (study) =>
      (filter.sector === null || study.sector.includes(filter.sector)) &&
      (filter.discipline === null || study.discipline.includes(filter.discipline)),
  );
}

/** True once either facet is chosen — the "clear" control's visibility. */
export function isFilterActive(filter: WorkFilter): boolean {
  return filter.sector !== null || filter.discipline !== null;
}
