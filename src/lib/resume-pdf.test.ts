// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PDFDict, PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { siteContent } from "@/lib/site-content";
import { stampResumePdf } from "@/lib/resume-pdf";

const FRAME_NAME = "jonokane-resume-11-2026-1col";
const META = { title: "Jono Kane Résumé", author: "Jono Kane" };

/** The XMP block Figma writes, trimmed: the frame name as dc:title, plus the
 *  PDF/UA marker that must survive the stamp. */
const FIGMA_XMP = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      <xmp:CreatorTool>Figma</xmp:CreatorTool>
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">${FRAME_NAME}</rdf:li>
        </rdf:Alt>
      </dc:title>
    </rdf:Description>
    <rdf:Description xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/">
      <pdfuaid:part>1</pdfuaid:part>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;

/** A one-page PDF shaped like a Figma export: the frame name as its title in
 *  both places, and (optionally) the XMP block. */
async function figmaExport({ xmp = true } = {}) {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage([612, 2273]);
  doc.setTitle(FRAME_NAME, { showInWindowTitleBar: true });
  doc.setProducer("Figma");
  doc.setCreator("Figma");
  if (xmp) {
    const stream = doc.context.stream(FIGMA_XMP, { Type: "Metadata", Subtype: "XML" });
    doc.catalog.set(PDFName.of("Metadata"), doc.context.register(stream));
  }
  return doc.save();
}

async function readXmp(bytes: Uint8Array): Promise<string | null> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const ref = doc.catalog.get(PDFName.of("Metadata"));
  const stream = ref ? doc.context.lookup(ref) : undefined;
  if (!(stream instanceof PDFRawStream)) return null;
  return new TextDecoder().decode(decodePDFRawStream(stream).decode());
}

describe("stampResumePdf", () => {
  it("replaces the frame name with the résumé title and sets the author", async () => {
    const out = await stampResumePdf(await figmaExport(), META);
    const doc = await PDFDocument.load(out, { updateMetadata: false });
    expect(doc.getTitle()).toBe("Jono Kane Résumé");
    expect(doc.getAuthor()).toBe("Jono Kane");
  });

  it("rewrites the XMP title too (Firefox reads that one), keeping the rest", async () => {
    const xmp = await readXmp(await stampResumePdf(await figmaExport(), META));
    expect(xmp).not.toContain(FRAME_NAME);
    expect(xmp).toContain('<rdf:li xml:lang="x-default">Jono Kane Résumé</rdf:li>');
    expect(xmp).toContain("<rdf:li>Jono Kane</rdf:li>"); // dc:creator
    expect(xmp).toContain("<pdfuaid:part>1</pdfuaid:part>"); // still marked accessible
    expect(xmp).toContain("<xmp:CreatorTool>Figma</xmp:CreatorTool>");
  });

  it("asks viewers to show the title, not the filename, in the tab", async () => {
    const doc = await PDFDocument.load(await stampResumePdf(await figmaExport(), META));
    const prefs = doc.catalog.lookupMaybe(PDFName.of("ViewerPreferences"), PDFDict);
    expect(prefs?.get(PDFName.of("DisplayDocTitle"))?.toString()).toBe("true");
  });

  it("leaves the page and the rest of the metadata alone", async () => {
    const doc = await PDFDocument.load(await stampResumePdf(await figmaExport(), META), {
      updateMetadata: false,
    });
    expect(doc.getPageCount()).toBe(1);
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 2273 });
    expect(doc.getProducer()).toBe("Figma");
  });

  it("stamps a PDF that has no XMP block", async () => {
    const out = await stampResumePdf(await figmaExport({ xmp: false }), META);
    const doc = await PDFDocument.load(out, { updateMetadata: false });
    expect(doc.getTitle()).toBe("Jono Kane Résumé");
    expect(await readXmp(out)).toBeNull();
  });

  it("escapes the title for XML", async () => {
    const xmp = await readXmp(await stampResumePdf(await figmaExport(), { title: "A & <B>", author: "C" }));
    expect(xmp).toContain('<rdf:li xml:lang="x-default">A &amp; &lt;B&gt;</rdf:li>');
  });
});

/* The résumé the site links to went through `pnpm resume`. A Figma export
   copied straight into public/ still carries the frame name as its title,
   which is what a visitor's browser tab would show. */
describe("the published résumé", () => {
  it("carries the résumé title, not a Figma frame name", async () => {
    const file = path.join(process.cwd(), "public", siteContent.links.resume);
    const doc = await PDFDocument.load(await readFile(file), { updateMetadata: false });
    expect(doc.getTitle()).toBe(siteContent.resumePdf.title);
    expect(await readXmp(await readFile(file))).toContain(siteContent.resumePdf.title);
  });
});
