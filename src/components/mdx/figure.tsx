import { ZoomableImage } from "@/components/mdx/zoomable-image";
import styles from "@/components/mdx/figure.module.css";

/**
 * Body images inside a case study, rendered from markdown `![alt](src "caption")`.
 * Velite has already copied the file and rewritten `src` to `/static/…-<hash>.ext`
 * (velite.config.ts); `rehype-unwrap-images` lifts the image out of the paragraph
 * remark wraps it in, so this <figure> is a valid block sibling of the prose.
 *
 * The markdown TITLE (the quoted string) becomes the visible caption; the ALT
 * stays the accessible description. Omit the title for an uncaptioned image.
 */
export function MdxImage({ src, alt, title }: { src?: string; alt?: string; title?: string }) {
  if (!src) return null;
  return (
    <figure className={styles.figure}>
      <ZoomableImage src={src} alt={alt ?? ""} caption={title} imgClassName={styles.image} />
      {title ? <figcaption className={styles.caption}>{title}</figcaption> : null}
    </figure>
  );
}
