import { siteContent } from "@/lib/site-content";

/**
 * The shelf's caption builders. The strings themselves live in
 * `siteContent.work.shelf` (spec §15: copy never lives in JSX, and never in a
 * component module either). These exist because the caption sets the study name
 * in display type — the shelf renders `<b>{title}</b>{rest}`, so it must never
 * assemble the punctuation itself.
 */
export const shelfLabels = siteContent.work.shelf;

/** " — Overview & The challenge (2/4)" — the caption after the study's name. */
export function shelfCaptionRest(panelLabel: string, position: number, total: number): string {
  return `${shelfLabels.captionSeparator}${panelLabel} (${position}/${total})`;
}

/** "Fluence — Overview & The challenge (2/4)" — the whole caption, for labels. */
export function shelfCaption(
  title: string,
  panelLabel: string,
  position: number,
  total: number,
): string {
  return `${title}${shelfCaptionRest(panelLabel, position, total)}`;
}
