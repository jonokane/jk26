import type { CaseStudy } from "#site/content";

/**
 * Pure list logic for the Work section (spec §8, §9) — no `#site/content`
 * import here on purpose, so this stays unit-testable without depending on
 * the generated content module (the wordmark-engine.ts / scene-engine.ts
 * house style, spec §15). `work-data.ts` is the thin glue that feeds real
 * content through these functions.
 */

/** Draft studies (spec §9) are excluded everywhere; the rest sort by `order` ascending. */
export function selectPublishedWork(studies: readonly CaseStudy[]): CaseStudy[] {
  return studies.filter((study) => !study.draft).sort((a, b) => a.order - b.order);
}

/** Order-sorted, for collections (like `earlier`) that have no draft flag to filter. */
export function sortByOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/** The study immediately after `slug` in `published`, for the "Next: {title}" teaser. */
export function nextStudy(published: readonly CaseStudy[], slug: string): CaseStudy | undefined {
  const index = published.findIndex((study) => study.slug === slug);
  return index === -1 ? undefined : published[index + 1];
}

/** 1-based position of `slug` in `published` — the case study's display number (spec §8). */
export function studyNumber(published: readonly CaseStudy[], slug: string): number {
  return published.findIndex((study) => study.slug === slug) + 1;
}

/** "1" → "01" — the intro block's numeral (spec §8). */
export function formatStudyNumber(number: number): string {
  return String(number).padStart(2, "0");
}
