import { defineConfig, defineCollection, s } from "velite";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

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
