import { defineConfig, defineCollection, s } from "velite";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeUnwrapImages from "rehype-unwrap-images";
import { tokeniseStatements } from "./src/components/about/statement-tokens";

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
      /* A content-relative image (e.g. `./media/foo.jpg`); velite copies it to
         /static hashed and resolves it to { src, width, height, blurDataURL, … }
         — the dimensions and blur placeholder the cover components use. */
      cover: s.image().optional(),
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
            /* Set on every word of a [text](href) link. Consecutive words
               sharing an href render as one <a>. */
            href: s.string().optional(),
          }),
        ),
      )
      .min(1),
  );

const earlier = defineCollection({
  name: "EarlierProject",
  pattern: "earlier/**/*.mdx",
  schema: s
    .object({
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
    })
    .transform((data) => {
      const slug = data.path.replace(/^earlier\//, "");
      return { ...data, slug, url: `/earlier/${slug}` };
    }),
});

const site = defineCollection({
  name: "SitePage",
  pattern: "site/**/*.mdx",
  schema: s.object({
    title: s.string(),
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
      /* Lift a standalone body image out of the <p> remark wraps it in, so the
         figure component (mdx-content.tsx) renders <figure> as a block sibling
         of the prose, not an invalid <figure> nested inside a <p>. */
      rehypeUnwrapImages,
    ],
  },
});
