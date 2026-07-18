/**
 * The index's filtering (spec §9) — pure, and with no `#site/content` value
 * import, so it stays unit-testable without the generated content module (the
 * `work-lists.ts` house style, spec §15).
 *
 * Both facets are derived from frontmatter, so adding a study or drafting one
 * changes the filter bar with no code edit and no new content.
 *
 * Typed against the minimal shape it reads — the two facet arrays — rather than
 * `CaseStudy`, so the same filter drives both the case studies AND the earlier
 * work (which share those two frontmatter fields but are otherwise different
 * shapes). The generics keep each call's element type flowing through.
 */

/** The frontmatter arrays the index filters on. Spec §9 names exactly these two. */
export type Facet = "sector" | "discipline";

/** The minimum an item needs to be filtered: the two facet arrays. */
export interface Filterable {
  readonly sector: readonly string[];
  readonly discipline: readonly string[];
}

/** `null` means "not filtered by this facet". */
export interface WorkFilter {
  sector: string | null;
  discipline: string | null;
}

export const NO_FILTER: WorkFilter = { sector: null, discipline: null };

/** Every distinct value of `facet` across `items`, sorted for a stable bar. */
export function facetValues(items: readonly Filterable[], facet: Facet): string[] {
  const values = new Set<string>();
  for (const item of items) {
    for (const value of item[facet]) values.add(value);
  }
  return [...values].sort();
}

/**
 * The items matching every chosen facet.
 *
 * The two facets AND rather than OR: choosing Music and Front-end asks for an
 * item that is both. An OR would return items matching neither choice fully,
 * which reads as the filter being ignored.
 *
 * Order is preserved — for the case studies that is `publishedWork`'s order (the
 * study numbering, which a filtered row must keep), and for the earlier work its
 * own sorted order.
 */
export function applyFilter<T extends Filterable>(items: readonly T[], filter: WorkFilter): T[] {
  return items.filter(
    (item) =>
      (filter.sector === null || item.sector.includes(filter.sector)) &&
      (filter.discipline === null || item.discipline.includes(filter.discipline)),
  );
}

/** True once either facet is chosen — the "clear" control's visibility. */
export function isFilterActive(filter: WorkFilter): boolean {
  return filter.sector !== null || filter.discipline !== null;
}
