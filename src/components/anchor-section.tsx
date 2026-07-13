import type { ReactNode } from "react";

/**
 * Placeholder anchor sections for the one-pager (spec §2): semantic
 * targets for nav/spy/deep-links until Phases 3–5 replace each with the
 * real section. Scene-token colored — this is also the night-legibility
 * bridge flagged in the Phase 1 review.
 */
export function AnchorSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="min-h-[70vh] scroll-mt-28 px-[7vw] py-[18vh]"
      style={{ background: "var(--scrim)" }}
    >
      <h2 id={`${id}-title`} className="heading-display text-4xl text-ink sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 max-w-[52ch] leading-relaxed text-sub">{children}</p>
    </section>
  );
}
