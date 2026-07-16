import { defineConfig, defineCollection, s } from "velite";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { splitMarkdownSections } from "./src/components/work/case-study-sections";
import { tokeniseStatements } from "./src/components/about/statement-tokens";

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
    /* `.min(1)` turns an empty or section-less body into a loud build failure
       rather than a study that silently reaches the page with nothing in it.
       That is only true because `strict: true` is set below — without it velite
       logs the violation as `info` and writes the bad data anyway, which is
       exactly what this comment wrongly promised from Phase 1 until 2026-07-16. */
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

/**
 * The About statements (spec §5). Jono authors them as ordinary markdown
 * paragraphs and marks the heavy words with `**bold**`; the tokeniser turns
 * that into the role-tagged words the teleprompter animates. Editing the copy,
 * or which words land, never touches a component.
 *
 * `.min(1)` turns an empty body into a loud build failure rather than an About
 * section that silently renders nothing.
 *
 * `ctx.meta.content` is the body with frontmatter already stripped — velite's
 * matter loader does `value.slice(match[0].length).trim()` — so paragraph
 * splitting is safe here.
 */
const statements = () =>
  s.preprocess(
    (_value, ctx) => tokeniseStatements(ctx.meta.content ?? ""),
    s
      .array(
        s.array(
          s.object({
            text: s.string(),
            role: s.enum(["ambient", "emphasis", "italic"]),
          }),
        ),
      )
      .min(1),
  );

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

const site = defineCollection({
  name: "SitePage",
  pattern: "site/**/*.mdx",
  schema: s.object({
    title: s.string(),
    lede: s.string(),
    statements: statements(),
  }),
});

export default defineConfig({
  /* Velite logs schema violations as non-fatal `info` and writes the bad data
     anyway unless this is set — "throws error and terminates process if any
     schema validation fails", per its own docs, default false.
     Without it every `.min(1)` in this file is decoration: emptying a body
     logged one info line, exited 0, and wrote `"statements":[]`. Two comments
     here claimed a "loud build failure" that could not happen. The schemas ARE
     this project's content gate — the site has no CMS, so a missing `impact`
     or a section-less study would otherwise reach the page as `undefined`. */
  strict: true,
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { work, earlier, site },
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
  },
});
