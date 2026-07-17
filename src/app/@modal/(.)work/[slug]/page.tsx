import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/work/case-study-article";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";

/**
 * Intercepts a client-side navigation to /work/[slug] from the one-pager and
 * renders the study over it (spec §10). `(.)` is the same-level matcher: the
 * @modal slot is not a path segment, so /work/[slug] sits one level up from it,
 * which is level-adjacent — the canonical Next "photo modal" shape. A hard load
 * or refresh is not intercepted and falls through to /work/[slug].
 */
export default async function InterceptedCaseStudy({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = publishedWork.find((s) => s.slug === slug);
  if (!study) notFound();

  const next = nextStudy(publishedWork, slug);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, overflowY: "auto", background: "var(--canvas)" }}>
      <CaseStudyArticle
        study={study}
        headingLevel={1}
        next={next ? { title: next.title, url: next.url } : undefined}
      />
    </div>
  );
}
