import type { ComponentType, HTMLAttributes } from "react";

/**
 * A case study renders at two heading depths — h1 on `/work/[slug]` and in the
 * modal (it is the page's subject), h3 in the home Work document — and the
 * *only* thing that changes is the tag. Shared here so no surface invents its
 * own mapping.
 *
 * Module scope, defined once: picking a heading at render time must never
 * create a new component type, which would remount the subtree
 * (react-hooks/static-components).
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5;

export const HEADING_TAGS: Record<
  HeadingLevel,
  ComponentType<HTMLAttributes<HTMLHeadingElement>>
> = {
  1: (props) => <h1 {...props} />,
  2: (props) => <h2 {...props} />,
  3: (props) => <h3 {...props} />,
  4: (props) => <h4 {...props} />,
  5: (props) => <h5 {...props} />,
};

/** The level a case study's own `##` body headings render at: one below its title. */
export const BODY_HEADING_LEVEL: Record<HeadingLevel, HeadingLevel> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 5,
};
