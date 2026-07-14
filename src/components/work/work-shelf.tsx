"use client";

import type { ReactNode } from "react";
import type { ShelfPanelMeta, ShelfStudyMeta } from "@/components/work/shelf-panels";
import { ShelfStage } from "@/components/work/shelf-stage";
import { useShelfMode } from "@/components/work/use-shelf-mode";

/**
 * Which Work the reader gets (spec §8, §12) — and nothing else. Both forms
 * arrive already rendered from the server, so this decides, it does not build:
 *
 * - `document` — reduced motion, no JS, and the server's own markup: the case
 *   studies as a plain vertical read. Not a degraded copy of the shelf, the
 *   same `CaseStudyArticle` that `/work/[slug]` renders.
 * - `swipe` / `pin` — the shelf.
 *
 * The choice is recomputed from live media queries on every render, so it
 * survives the reader flipping the OS reduced-motion switch mid-visit, in
 * either direction: turn it on and the whole document is back, because the
 * document is simply what this component returns when `mode` is `document`.
 * Nothing here reveals content from an effect, which is how this codebase once
 * erased a hero for good.
 */
export function WorkShelf({
  panels,
  studies,
  fallback,
  children,
}: {
  panels: readonly ShelfPanelMeta[];
  studies: readonly ShelfStudyMeta[];
  /** The vertical read — the reduced-motion and no-JS path. */
  fallback: ReactNode;
  /** The panels, server-rendered. */
  children: ReactNode;
}) {
  const mode = useShelfMode();

  if (mode === "document") return <>{fallback}</>;

  return (
    <ShelfStage mode={mode} panels={panels} studies={studies}>
      {children}
    </ShelfStage>
  );
}
