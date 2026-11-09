/**
 * pnpm resume <figma-export.pdf>
 *
 * Publishes a résumé exported from Figma: copies it to the file the site links
 * to (public/ + siteContent.links.resume) and stamps the title and author from
 * siteContent.resumePdf, so a visitor's browser tab reads "Jono Kane Résumé"
 * rather than the Figma frame name. The export itself is never modified.
 *
 * Runs under Node's built-in type stripping (Node 23.6+), hence the explicit
 * .ts extensions and no `@/` imports.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { siteContent } from "../src/lib/site-content.ts";
import { stampResumePdf } from "../src/lib/resume-pdf.ts";

const fail = (message: string): never => {
  console.error(`resume: ${message}`);
  process.exit(1);
};

const arg = process.argv[2];
if (!arg) fail("pass the exported PDF, e.g. pnpm resume ~/Downloads/jonokane-resume-11-2026-1col.pdf");

const href = siteContent.links.resume;
if (!href.startsWith("/")) fail(`links.resume (${JSON.stringify(href)}) is not a file on this site`);

/* pnpm runs scripts from the repo root; INIT_CWD is where the command was
   typed, so a relative path means what it looks like it means. */
const source = path.resolve(process.env.INIT_CWD ?? process.cwd(), arg);
const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dest = path.join(repoRoot, "public", href);

const bytes = await readFile(source).catch(() => fail(`can't read ${source}`));
if (new TextDecoder().decode(bytes.subarray(0, 5)) !== "%PDF-") fail(`${source} is not a PDF`);

const stamped = await stampResumePdf(bytes, siteContent.resumePdf);
await writeFile(dest, stamped);

const kb = (n: number) => `${Math.round(n / 1024)} KB`;
console.log(`resume: ${path.basename(source)} -> ${path.relative(repoRoot, dest)} (${kb(stamped.length)})`);
console.log(`        title "${siteContent.resumePdf.title}", author "${siteContent.resumePdf.author}"`);
