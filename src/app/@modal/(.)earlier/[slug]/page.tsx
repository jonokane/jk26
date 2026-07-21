import { notFound } from "next/navigation";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { CaseStudyModal } from "@/components/work/case-study-modal";
import { nextBySlug } from "@/components/work/work-lists";
import { sortedEarlierWork } from "@/components/work/work-data";

/**
 * Intercepts a client-side navigation to /earlier/[slug] from the one-pager and
 * renders the earlier item over it in the shared CaseStudyModal (spec 2026-07-20).
 * `(.)` is the same-level matcher, exactly as (.)work/[slug]. A hard load falls
 * through to /earlier/[slug].
 */
export default async function InterceptedEarlier({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) notFound();

  const next = nextBySlug(sortedEarlierWork, slug);

  return (
    <CaseStudyModal label={item.title}>
      <EarlierDetail
        item={item}
        headingLevel={1}
        next={next ? { title: next.title, url: next.url } : undefined}
      />
    </CaseStudyModal>
  );
}
