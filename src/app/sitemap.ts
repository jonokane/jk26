import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { publishedWork, sortedEarlierWork } from "@/components/work/work-data";

/**
 * /sitemap.xml — the home one-pager, every published case study, and every
 * earlier project. Derived from the same published-content lists the routes
 * use, so drafting a study drops it from the sitemap too. `url`s are
 * study/earlier `/work|/earlier/<slug>` paths, made absolute against SITE_URL.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const work: MetadataRoute.Sitemap = publishedWork.map((study) => ({
    url: `${SITE_URL}${study.url}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const earlier: MetadataRoute.Sitemap = sortedEarlierWork.map((item) => ({
    url: `${SITE_URL}${item.url}`,
    changeFrequency: "yearly",
    priority: 0.4,
  }));
  return [{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }, ...work, ...earlier];
}
