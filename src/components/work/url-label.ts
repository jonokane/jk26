/**
 * The `view` field (spec §9) is either an http(s) URL or plain text ("Under
 * NDA", "Archived"). These two helpers decide which, and turn a URL into a
 * readable label instead of a raw href.
 */

/** Whether `view` is a link, as opposed to safe plain text like "Under NDA". */
export function isViewUrl(view: string): boolean {
  return /^https?:\/\//.test(view);
}

/** "https://amazon.com/key/" → "amazon.com/key" — a URL is not a label. */
export function urlLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
