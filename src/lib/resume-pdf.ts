import { PDFDocument, PDFName, PDFRawStream, PDFRef, decodePDFRawStream } from "pdf-lib";

/**
 * Stamp the résumé's title and author into a PDF, for `pnpm resume`.
 *
 * Figma writes the frame's name into an exported PDF as its title, and Jono
 * names frames after his local files (jonokane-resume-11-2026-1col) so Figma
 * and his versions line up. A browser shows that title in the tab when the PDF
 * opens, so the copy the site ships gets a reader's title instead. Only the
 * shipped copy changes; the frame and the local files keep their names.
 *
 * A PDF stores its title twice, and readers disagree on which to trust:
 * Chrome and Safari read the document info, Firefox prefers the XMP block.
 * Both are set. The XMP is edited in place, not dropped, because Figma's
 * carries the PDF/UA marker that tells assistive tech the file is tagged.
 *
 * No `@/` imports and nothing but erasable TypeScript: scripts/resume.ts runs
 * this under Node's own type stripping, outside the Next.js build.
 */
export interface ResumePdfMeta {
  title: string;
  author: string;
}

const escapeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Set dc:title and dc:creator in an XMP packet, adding either if missing. */
function stampXmp(xmp: string, { title, author }: ResumePdfMeta): string {
  const titleXml = `<dc:title>\n        <rdf:Alt>\n          <rdf:li xml:lang="x-default">${escapeXml(title)}</rdf:li>\n        </rdf:Alt>\n      </dc:title>`;
  const creatorXml = `<dc:creator>\n        <rdf:Seq>\n          <rdf:li>${escapeXml(author)}</rdf:li>\n        </rdf:Seq>\n      </dc:creator>`;

  let out = xmp.replace(/<dc:creator>[\s\S]*?<\/dc:creator>\s*/, "");
  if (/<dc:title>[\s\S]*?<\/dc:title>/.test(out)) {
    out = out.replace(/<dc:title>[\s\S]*?<\/dc:title>/, `${titleXml}\n      ${creatorXml}`);
  } else {
    /* No title yet: add both to the first rdf:Description, declaring the dc
       namespace on it if it isn't already. */
    out = out.replace(/<rdf:Description\b([^>]*)>/, (_m, attrs: string) => {
      const ns = attrs.includes("xmlns:dc=") ? "" : ' xmlns:dc="http://purl.org/dc/elements/1.1/"';
      return `<rdf:Description${attrs}${ns}>\n      ${titleXml}\n      ${creatorXml}`;
    });
  }
  return out;
}

export async function stampResumePdf(bytes: Uint8Array, meta: ResumePdfMeta): Promise<Uint8Array> {
  /* updateMetadata: false, or pdf-lib would also overwrite the producer and
     dates with its own. */
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  doc.setTitle(meta.title, { showInWindowTitleBar: true });
  doc.setAuthor(meta.author);

  const ref = doc.catalog.get(PDFName.of("Metadata"));
  const stream = ref instanceof PDFRef ? doc.context.lookup(ref) : undefined;
  if (ref instanceof PDFRef && stream instanceof PDFRawStream) {
    const xmp = new TextDecoder().decode(decodePDFRawStream(stream).decode());
    /* Written back uncompressed, as XMP is meant to be, under the same object
       number so nothing else that points at it changes. Encoded as UTF-8
       first: handed a string, pdf-lib writes one byte per character, which
       garbles the é in Résumé. */
    const utf8 = new TextEncoder().encode(stampXmp(xmp, meta));
    doc.context.assign(ref, doc.context.stream(utf8, { Type: "Metadata", Subtype: "XML" }));
  }

  return doc.save();
}
