/**
 * The Welcome build-in's choreography (spec §6). Tunables, not literals —
 * Jono adjusts these by feel, and that must stay a one-line edit in one file.
 * Values are the Portfolio v2 prototype's verbatim.
 */
export const HERO_BUILD = {
  /** Delay before the first letter starts. */
  letterLeadMs: 300,
  /** Added per letter index. */
  letterStaggerMs: 80,
  /** Slack after the last letter starts, before the tagline follows. */
  settleMs: 600,
  /** When the tagline and scroll cue may appear: 0.3 + n*0.08 + 0.6. */
  totalMs(letters: number): number {
    return this.letterLeadMs + letters * this.letterStaggerMs + this.settleMs;
  },
} as const;
