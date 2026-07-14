import { shelfCaption, shelfCaptionRest, shelfLabels } from "@/components/work/shelf-labels";

/**
 * The shelf's panel model (spec §8) — pure, and generic over the study type,
 * so it never imports `#site/content` and stays unit-testable (the
 * `work-lists.ts` house style, spec §15).
 *
 * Four panels per study: an intro, then the body's `## ` sections grouped by
 * PANEL_GROUPS. Nothing here knows about scroll, DOM, or React — it turns
 * content into a flat, indexable list of panels, which is exactly what the
 * track, the dots, the caption and the header row all read.
 */

/** A compiled `## ` section of a case study body (see `case-study-sections.ts`). */
export interface ShelfSection {
  heading: string;
  /** Compiled MDX function body, ready for `<MDXContent code=… />`. */
  body: string;
}

/** The minimum a study must be for the shelf to panel it. */
export interface PanelSource {
  slug: string;
  title: string;
  sections: readonly ShelfSection[];
}

/**
 * Which body sections share a panel (spec §8): Overview and The challenge ride
 * together, then one panel each. Matched against the MDX heading text, so this
 * is a *selector* — the label a panel prints is the heading itself, from the
 * content. A section no group claims (a later `## Selected screens`, say) gets
 * a panel of its own at the end rather than vanishing.
 */
export const PANEL_GROUPS: readonly (readonly string[])[] = [
  ["Overview", "The challenge"],
  ["What I did"],
  ["Outcome"],
];

export interface ShelfPanel<T extends PanelSource = PanelSource> {
  /** Stable React key and DOM id fragment. */
  key: string;
  study: T;
  /** 0-based position of the study in the shelf; `number` is its 1-based display number. */
  studyIndex: number;
  number: number;
  /** 0-based position of this panel in the whole shelf — the index everything scrubs to. */
  index: number;
  /** 1-based position within its own study, and how many panels that study has ("2/4"). */
  position: number;
  panelsInStudy: number;
  /** First panel of its study: the dot that starts a new group, the header's name re-pop. */
  firstOfStudy: boolean;
  kind: "intro" | "sections";
  /** "Intro", "Overview & The challenge", "Outcome" — printed by the caption and header row. */
  label: string;
  /** Empty on the intro panel, whose content is the study's own title/impact/meta/cover. */
  sections: ShelfSection[];
  /** "Fluence — Outcome (4/4)" — the panel's accessible name. */
  caption: string;
  /** " — Outcome (4/4)" — the caption after the study name, which is set apart. */
  captionRest: string;
}

const sameHeading = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Group a study's sections into panel-sized bundles, in PANEL_GROUPS order, then the leftovers. */
function groupSections(sections: readonly ShelfSection[]): ShelfSection[][] {
  const claimed = new Set<ShelfSection>();
  const groups: ShelfSection[][] = [];

  for (const headings of PANEL_GROUPS) {
    const group = sections.filter((section) =>
      headings.some((heading) => sameHeading(heading, section.heading)),
    );
    for (const section of group) claimed.add(section);
    if (group.length > 0) groups.push(group);
  }
  for (const section of sections) {
    if (!claimed.has(section)) groups.push([section]);
  }
  return groups;
}

/** Every panel of every study, flat and in shelf order — index `i` is the i-th panel across. */
export function buildShelfPanels<T extends PanelSource>(studies: readonly T[]): ShelfPanel<T>[] {
  const panels: ShelfPanel<T>[] = [];

  studies.forEach((study, studyIndex) => {
    const groups = groupSections(study.sections);
    const panelsInStudy = groups.length + 1; // + the intro panel

    const push = (kind: ShelfPanel["kind"], label: string, sections: ShelfSection[]) => {
      const position = panels.filter((p) => p.study === study).length + 1;
      panels.push({
        key: `${study.slug}-${position}`,
        study,
        studyIndex,
        number: studyIndex + 1,
        index: panels.length,
        position,
        panelsInStudy,
        firstOfStudy: position === 1,
        kind,
        label,
        sections,
        caption: shelfCaption(study.title, label, position, panelsInStudy),
        captionRest: shelfCaptionRest(label, position, panelsInStudy),
      });
    };

    push("intro", shelfLabels.introPanel, []);
    for (const group of groups) {
      push(
        "sections",
        group.map((section) => section.heading).join(shelfLabels.headingJoin),
        group,
      );
    }
  });

  return panels;
}

/**
 * The index of a study's intro panel — where a study pill in the header jumps
 * to. Takes the two fields it reads, so the client can call it with the panel
 * *meta* it holds rather than a shelf full of compiled MDX.
 */
export function firstPanelOfStudy(
  panels: readonly { index: number; studyIndex: number }[],
  studyIndex: number,
): number {
  return panels.find((panel) => panel.studyIndex === studyIndex)?.index ?? 0;
}

/**
 * The slice of a panel the *client* needs — the dots, the caption, the header's
 * work row. Deliberately not the panel itself: a `ShelfPanel` carries the whole
 * study, including every section's compiled MDX, and handing that to a client
 * component would serialize all of it into the RSC payload for no reason. The
 * panels themselves render on the server.
 */
export interface ShelfPanelMeta {
  key: string;
  index: number;
  studyIndex: number;
  slug: string;
  title: string;
  label: string;
  caption: string;
  captionRest: string;
  firstOfStudy: boolean;
}

export interface ShelfStudyMeta {
  slug: string;
  title: string;
}

export function toPanelMeta(panels: readonly ShelfPanel[]): ShelfPanelMeta[] {
  return panels.map((panel) => ({
    key: panel.key,
    index: panel.index,
    studyIndex: panel.studyIndex,
    slug: panel.study.slug,
    title: panel.study.title,
    label: panel.label,
    caption: panel.caption,
    captionRest: panel.captionRest,
    firstOfStudy: panel.firstOfStudy,
  }));
}

export function toStudyMeta(studies: readonly PanelSource[]): ShelfStudyMeta[] {
  return studies.map(({ slug, title }) => ({ slug, title }));
}
