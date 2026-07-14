import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { work } from "#site/content";
import { MDXContent } from "@/components/mdx-content";
import { SiteHeader } from "@/components/site-header";
import { siteContent } from "@/lib/site-content";

/** "https://amazon.com/key/" → "amazon.com/key" — a URL is not a label. */
function linkLabel(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Draft studies (spec §9) are excluded from static params, lookup, and metadata alike. */
const published = work.filter((study) => !study.draft);

export function generateStaticParams() {
  return published.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = published.find((s) => s.slug === slug);
  if (!study) return {};
  return { title: study.title, description: study.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = published.find((s) => s.slug === slug);
  if (!study) notFound();

  const meta: { label: string; value: string }[] = [
    { label: "Client", value: study.client },
    { label: "Sector", value: study.sector.join(", ") },
    { label: "Discipline", value: study.discipline.join(", ") },
    { label: "Platform", value: study.platform.join(", ") },
    { label: "Role", value: study.role },
    { label: "Timeframe", value: study.timeframe },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-6 py-32 sm:px-10 lg:px-16">
        <article className="mx-auto w-full max-w-2xl">
          {/* straight to the section, not via the /work redirect: a client-side
              <Link> navigation to "/work" drops the fragment the redirect adds,
              landing the visitor at the top of the home page instead of #work */}
          <Link
            href="/#work"
            className="font-mono text-sm text-sub transition-colors hover:text-ink"
          >
            {siteContent.labels.allWork}
          </Link>

          <header className="mt-8 border-b border-card-border pb-8">
            <h1 className="heading-display text-4xl text-ink sm:text-5xl">{study.title}</h1>
            <p className="mt-4 text-lg text-sub">{study.impact}</p>

            <dl className="slab mt-8 flex flex-wrap gap-3">
              {meta.map(({ label, value }) => (
                <div key={label} className="pill">
                  <dt className="text-kicker text-xs">{label}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
              <div className="pill">
                <dt className="text-kicker text-xs">View the work</dt>
                <dd className="text-ink">
                  {study.view.startsWith("http") ? (
                    <a
                      href={study.view}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {linkLabel(study.view)}
                    </a>
                  ) : (
                    study.view
                  )}
                </dd>
              </div>
            </dl>
          </header>

          <div className="mt-10 space-y-5 text-lg leading-8 text-ink">
            <MDXContent code={study.body} />
          </div>
        </article>
      </main>
    </>
  );
}
