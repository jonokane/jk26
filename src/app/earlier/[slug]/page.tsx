import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EarlierDetail } from "@/components/work/earlier-detail";
import { nextBySlug } from "@/components/work/work-lists";
import { sortedEarlierWork } from "@/components/work/work-data";
import { SiteHeader } from "@/components/site-header";
import { siteContent } from "@/lib/site-content";

export function generateStaticParams() {
  return sortedEarlierWork.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) return {};
  return { title: item.title };
}

/**
 * The standalone earlier-project page (spec 2026-07-20): the share/SEO/no-JS
 * surface the intercepting modal falls through to, mirroring /work/[slug].
 */
export default async function EarlierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = sortedEarlierWork.find((i) => i.slug === slug);
  if (!item) notFound();

  const next = nextBySlug(sortedEarlierWork, slug);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1000px] px-[6vw] pt-24">
          <Link href="/#work" className="font-mono text-sm text-mute transition-colors hover:text-ink">
            {siteContent.labels.allWork}
          </Link>
        </div>
        <EarlierDetail
          item={item}
          headingLevel={1}
          next={next ? { title: next.title, url: next.url } : undefined}
        />
      </main>
    </>
  );
}
