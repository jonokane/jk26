import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { work } from "#site/content";
import { MDXContent } from "@/components/mdx-content";

export function generateStaticParams() {
  return work.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = work.find((s) => s.slug === slug);
  if (!study) return {};
  return { title: study.title, description: study.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = work.find((s) => s.slug === slug);
  if (!study) notFound();

  return (
    <main className="flex-1 px-6 py-32 sm:px-10 lg:px-16">
      <article className="mx-auto w-full max-w-2xl">
        <Link
          href="/work"
          className="font-mono text-sm text-zinc-500 hover:text-foreground"
        >
          ← All work
        </Link>

        <header className="mt-8 border-b border-black/10 pb-8 dark:border-white/10">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {study.title}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {study.summary}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-zinc-500">
            <div>
              <dt className="inline">Role — </dt>
              <dd className="inline text-foreground">{study.role}</dd>
            </div>
            {study.client && (
              <div>
                <dt className="inline">Client — </dt>
                <dd className="inline text-foreground">{study.client}</dd>
              </div>
            )}
            <div>
              <dt className="inline">Year — </dt>
              <dd className="inline text-foreground">{study.year}</dd>
            </div>
          </dl>
        </header>

        <div className="prose-case mt-10 space-y-5 text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          <MDXContent code={study.body} />
        </div>
      </article>
    </main>
  );
}
