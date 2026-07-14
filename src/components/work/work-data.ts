import { earlier, work } from "#site/content";
import { selectPublishedWork, sortByOrder } from "@/components/work/work-lists";

/**
 * The thin glue between `#site/content` and the pure list logic in
 * `work-lists.ts` (spec §15's wordmark-engine.ts pattern: keep the
 * content-module dependency out of what's unit-tested). Both the home Work
 * section and `/work/[slug]` read from these so numbering and "next study"
 * stay identical wherever a case study renders.
 */
export const publishedWork = selectPublishedWork(work);

export const sortedEarlierWork = sortByOrder(earlier);
