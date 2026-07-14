/**
 * TEMPORARY home for the collector's one new string.
 *
 * Copy belongs in `src/lib/site-content.ts` (spec §15) — this pass does not own
 * that file. Move it and delete this module:
 *
 *   about: {
 *     lede: "...",
 *     trayHint: "Collected ↓",
 *     ...
 *   }
 *
 * ...then read it as `siteContent.about.trayHint` in about.tsx.
 */
export const collectorCopy = {
  /** Caption under the tray of pocketed beats, while the reader is still reading. */
  trayHint: "Collected ↓",
} as const;
