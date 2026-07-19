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
      {/* eslint-disable-next-line @next/next/no-img-element -- markdown images
          carry no intrinsic width/height, which next/image needs (or a sized
          fill container, wrong for a flowing figure). A lazy <img> is correct
          here; covers, which do have dimensions, use next/image. */}
      <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className={styles.image} />
      {title ? <figcaption className={styles.caption}>{title}</figcaption> : null}
    </figure>
  );
}
