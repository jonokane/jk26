/**
 * Remark guard: every markdown image must be its own paragraph.
 *
 * An image on its own line (blank line before and after) parses to a paragraph
 * whose only child is that image, which `rehype-unwrap-images` lifts out so
 * `MdxImage` can render a block `<figure>`. But an image glued to adjacent text
 * — no blank line, very easy to do inside `<Pin>`/`<Breakout>` — stays in a
 * paragraph alongside that text, is never unwrapped, and renders its
 * `<figure>`/`<figcaption>` INSIDE a `<p>`. That is invalid HTML: the browser
 * auto-closes the `<p>`, the client tree no longer matches the server's, and
 * hydration fails at runtime with a cryptic console error.
 *
 * This turns that runtime crash into a clear build-time error that names the
 * file and line. Added to Velite's `remarkPlugins` (velite.config.ts), it runs
 * on the mdast — including the markdown inside JSX flow elements like `<Pin>`.
 */

/** Minimal mdast shape. Extra fields optional so a bare unified `Node` (just a
 *  `type`) is assignable — keeps this compatible with Velite's plugin types. */
type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  position?: { start?: { line?: number } };
};

type VFileLike = { path?: string };

/** A paragraph child that means the image is NOT standalone: real text, or any
 *  non-image element (bold, link, break, …). Whitespace-only text and sibling
 *  images (e.g. two images with a space) are fine — those still get unwrapped. */
function isMeaningfulSibling(child: MdastNode): boolean {
  if (child.type === "image") return false;
  if (child.type === "text") return (child.value ?? "").trim() !== "";
  return true;
}

export function remarkStandaloneImages() {
  return (tree: MdastNode, file: VFileLike) => {
    const visit = (node: MdastNode) => {
      if (
        node.type === "paragraph" &&
        node.children?.some((c) => c.type === "image") &&
        node.children.some(isMeaningfulSibling)
      ) {
        const line = node.position?.start?.line;
        const where = file.path ?? "a content file";
        throw new Error(
          `Image must be on its own line: an image is mixed with other content ` +
            `in a paragraph in ${where}${line ? ` (line ${line})` : ""}. Put a blank ` +
            `line before AND after the image — especially inside <Pin>/<Breakout> — ` +
            `so it becomes its own figure. Otherwise its <figure> renders inside a ` +
            `<p>, which crashes hydration at runtime.`,
        );
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
