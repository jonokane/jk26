import type { Metadata } from "next";
import Link from "next/link";
import { work } from "#site/content";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected case studies by Jono Kane.",
};

export default function WorkIndex() {
  const studies = [...work].sort((a, b) => b.year - a.year);

  return (
    <main className="flex-1 px-6 py-32 sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Selected work
        </h1>

        <ul className="mt-16 divide-y divide-black/10 dark:divide-white/10">
          {studies.map((study) => (
            <li key={study.slug}>
              <Link
                href={study.url}
                className="group flex flex-col gap-2 py-8 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div className="max-w-xl">
                  <h2 className="text-2xl font-medium tracking-tight transition-opacity group-hover:opacity-60">
                    {study.title}
                  </h2>
                  <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                    {study.summary}
                  </p>
                </div>
                <div className="shrink-0 font-mono text-sm text-zinc-500">
                  {study.role} · {study.year}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
