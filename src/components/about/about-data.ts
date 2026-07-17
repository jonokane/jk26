import { site } from "#site/content";
import type { Statement } from "@/components/about/statement-tokens";

/**
 * The thin glue between `#site/content` and the About component (spec §15's
 * wordmark-engine.ts pattern: keep the content-module dependency out of
 * what's unit-tested — work-data.ts exists for the same reason). About is the
 * only page in the `site` collection so far.
 */
export interface AboutPage {
  title: string;
  lede: string;
  statements: Statement[];
}

export const aboutPage: AboutPage = site[0];
