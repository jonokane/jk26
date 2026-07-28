import { describe, it, expect } from "vitest";
import { remarkStandaloneImages } from "@/lib/remark-standalone-images";

/* Hand-built mdast fragments — the plugin walks `type`/`children`, so these are
   enough to exercise it without pulling in a full remark parse. */
type Node = { type: string; value?: string; children?: Node[]; position?: { start?: { line?: number } }; name?: string };

const run = (tree: Node, path = "content/work/x.mdx") =>
  remarkStandaloneImages()(tree, { path });

const root = (children: Node[]): Node => ({ type: "root", children });
const para = (children: Node[], line = 1): Node => ({ type: "paragraph", position: { start: { line } }, children });
const img: Node = { type: "image", value: "" };
const text = (value: string): Node => ({ type: "text", value });

describe("remarkStandaloneImages", () => {
  it("passes an image that is its own paragraph", () => {
    expect(() => run(root([para([img]), para([text("Some prose.")])]))).not.toThrow();
  });

  it("throws when an image is glued to text in one paragraph, naming the line", () => {
    expect(() => run(root([para([img, text("\nGlued prose.")], 48)]))).toThrow(/line 48/);
  });

  it("throws when the image sits beside another element (e.g. bold)", () => {
    expect(() => run(root([para([img, { type: "strong", children: [text("x")] }])]))).toThrow();
  });

  it("recurses into <Pin>/<Breakout> (mdxJsxFlowElement) children", () => {
    const pin: Node = { type: "mdxJsxFlowElement", name: "Pin", children: [para([img, text("\nglued")], 10)] };
    expect(() => run(root([pin]))).toThrow(/line 10/);
  });

  it("allows sibling images separated only by whitespace", () => {
    expect(() => run(root([para([img, text(" "), img])]))).not.toThrow();
  });

  it("names the offending file in the error", () => {
    expect(() => run(root([para([img, text("x")])]), "content/work/collaya.mdx")).toThrow(/collaya\.mdx/);
  });
});
