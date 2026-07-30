/**
 * Single source of truth for the production origin and site name.
 *
 * Consumed by `metadataBase`, canonical URLs, the sitemap, robots, and the
 * generated OG image. The domain was previously a bare literal in `layout.tsx`
 * (and again in the contact route); the SEO wiring (sitemap/robots/canonical)
 * needs one shared value so those can never drift.
 */
export const SITE_URL = "https://jonokane.com";
export const SITE_NAME = "Jono Kane";
