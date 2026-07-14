/**
 * Shelf copy (spec §8) — the strings the shelf needs that `siteContent.work`
 * does not have yet.
 *
 * THIS BELONGS IN `src/lib/site-content.ts`, under `work.shelf`. It is a
 * separate module only because `site-content.ts` was owned by another
 * workstream during this pass and a concurrent edit there would have been a
 * merge conflict. Moving it is a copy/paste and a change of import — nothing
 * reads these except the shelf.
 *
 * The rule it does honor (spec §15): copy never lives in JSX. Every word and
 * every separator the shelf prints comes from here, and the case study prose
 * comes only from MDX.
 */
export const shelfLabels = {
  /** The first panel of every study. The MDX headings name the others. */
  introPanel: "Intro",
  /** Joins the headings of a panel that carries more than one section. */
  headingJoin: " & ",
  /** Between the study title and the panel label in the shelf caption. */
  captionSeparator: " — ",
  /** The shelf's own landmark name. */
  region: "Case studies",
  /** The header's expanding work row (spec §6): the study-pill list's name. */
  studyPills: "Jump to a case study",
} as const;

/**
 * " — Overview & The challenge (2/4)" — the caption after the study's name.
 * Split out because the caption sets the study name in display type: the shelf
 * renders `<b>{title}</b>{rest}` and so must never assemble punctuation in JSX
 * (spec §15).
 */
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
