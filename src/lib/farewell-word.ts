/**
 * Farewell word math (spec §11). Pure hour → word-key mapping, no DOM, no
 * copy — the actual strings live in `siteContent.farewell.words` (spec §15),
 * keyed by exactly these four names. House style follows scene-engine.ts:
 * framework-agnostic, unit-tested at every boundary.
 *
 * morning 5–12, afternoon 12–17, evening 17–21, night otherwise. Wraps across
 * midnight the same way scene-engine's sampling does, so any real or
 * scrubbed hour — including values outside the nominal 0–24 range, like a
 * scrub sitting exactly on 24 or a negative hour — resolves correctly.
 */
export type FarewellWordKey = "morning" | "afternoon" | "evening" | "night";

export function farewellWordKey(hour: number): FarewellWordKey {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}
