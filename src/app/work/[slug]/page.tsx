import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyArticle } from "@/components/work/case-study-article";
import { nextStudy } from "@/components/work/work-lists";
import { publishedWork } from "@/components/work/work-data";
import { SiteHeader } from "@/components/site-header";
import { siteContent } from "@/lib/site-content";

export function generateStaticParams() {
  return publishedWork.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = publishedWork.find((s) => s.slug === slug);
  if (!study) return {};
  /* The cover is this study's share card — it's already ~2:1, so it crops
     cleanly to the OG frame. When a study has no cover yet, omit images and the
     root opengraph-image (the designed default) is inherited. Root-relative
     `src`/`url` resolve against metadataBase to absolutes. */
  const images = study.cover
    ? [{ url: study.cover.src, width: study.cover.width, height: study.cover.height, alt: study.title }]
    : undefined;
  return {
    title: study.title,
    description: study.summary,
    alternates: { canonical: study.url },
    openGraph: {
      type: "article",
      url: study.url,
      title: study.title,
      description: study.summary,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: study.title,
      description: study.summary,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

/**
 * The dedicated case study page (spec §2, §9): the canonical share/SEO
 * surface and the reduced-motion-friendly reading surface, rendering the
 * exact same MDX — through the exact same CaseStudyArticle — as the home
 * Work section. `headingLevel={1}` is the only difference: on its own page a
 * case study is the subject, not a panel nested under a "Selected Work" h2.
 */
export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = publishedWork.find((s) => s.slug === slug);
  if (!study) notFound();

  const next = nextStudy(publishedWork, slug);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Straight to the section, not via the /work redirect: a client-side
            <Link> to "/work" drops the fragment the redirect adds, landing the
            visitor at the top of the home page instead of #work. */}
        <div className="mx-auto w-full max-w-[1000px] px-[6vw] pt-24">
          <Link href="/#work" className="font-mono text-sm text-mute transition-colors hover:text-ink">
            {siteContent.labels.allWork}
          </Link>
        </div>

        <CaseStudyArticle
          study={study}
          headingLevel={1}
          next={next ? { title: next.title, url: next.url } : undefined}
        />
      </main>
    </>
  );
}
