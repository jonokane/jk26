import { defineConfig, defineCollection, s } from "velite";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { splitMarkdownSections } from "./src/components/work/case-study-sections";

/**
 * The case study body, a second time, split into its `## ` sections (spec §8,
 * §9). The shelf renders one panel per section group and cannot split the
 * compiled body (it is a minified function body), so each section is compiled
 * to its own MDX component here, from the same raw markdown that produces
 * `body`. `s.mdx()` compiles the string it is handed — the raw file content
 * only when handed nothing — so feeding it a section's markdown Just Works,
 * and `ctx.meta` (the file) flows down the parse context into it.
 *
 * The heading line itself is left out of each section's markdown: the shelf
 * renders the heading as a panel label, the vertical read renders it from
 * `body`. Neither surface prints it twice.
 */
const sections = () =>
  s.preprocess(
    /* `.min(1)` below turns an empty or section-less body into a loud build
       failure rather than a study that silently arrives on the shelf with
       nothing but an intro panel. */
    (_value, ctx) =>
      splitMarkdownSections(ctx.meta.content ?? "").map(({ heading, markdown }) => ({
        heading,
        // the key must be `body`, and it must be a string: `s.mdx()` compiles
        // the whole file when handed `undefined`, which would silently give
        // every panel the entire case study
        body: markdown,
      })),
    s.array(s.object({ heading: s.string(), body: s.mdx() })).min(1),
  );

const work = defineCollection({
  name: "CaseStudy",
  pattern: "work/**/*.mdx",
  schema: s
    .object({
      title: s.string().max(120),
      summary: s.string().max(320),
      year: s.number().int().min(1990).max(2100),
      role: s.string(),
      client: s.string(),
      sector: s.array(s.string()).min(1),
      discipline: s.array(s.string()).min(1),
      platform: s.array(s.string()).min(1),
      timeframe: s.string(),
      view: s.string(),
      impact: s.string().max(240),
      order: s.number().int(),
      draft: s.boolean().default(false),
      cover: s.string().optional(),
      tags: s.array(s.string()).default([]),
      featured: s.boolean().default(false),
      path: s.path(),
      body: s.mdx(),
      sections: sections(),
    })
    .transform((data) => {
      const slug = data.path.replace(/^work\//, "");
      return { ...data, slug, url: `/work/${slug}` };
    }),
});

const earlier = defineCollection({
  name: "EarlierProject",
  pattern: "earlier/**/*.mdx",
  schema: s.object({
    title: s.string().max(120),
    sector: s.array(s.string()).min(1),
    discipline: s.array(s.string()).min(1),
    platform: s.array(s.string()).default([]),
    role: s.string(),
    timeframe: s.string(),
    view: s.string(),
    order: s.number().int(),
    path: s.path(),
    body: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { work, earlier },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
});
