"use client";

import { useSyncExternalStore } from "react";
import type { ShelfPanelMeta, ShelfStudyMeta } from "@/components/work/shelf-panels";

/**
 * What the shelf is currently showing, published for the header (spec §6).
 *
 * A module-level store rather than React context because the header and the
 * shelf are siblings under `app/page.tsx` — there is no component that wraps
 * both, and a page that exists to compose sections is the wrong place to grow
 * a provider. This is the same shape as `getLenis()`: one instance, published
 * by whoever owns it, read by whoever needs it.
 *
 * `useSyncExternalStore` (not a `useState` + event bus) so the header cannot
 * tear: it always renders the panel the shelf is actually on, and its server
 * snapshot is the empty state, which is exactly what the server renders.
 */
export interface ShelfState {
  /** In Work: the header's second row is open. False on `/work/[slug]`, under reduced motion. */
  active: boolean;
  /** The panel the shelf has settled on — an index into `panels`. */
  index: number;
  panels: readonly ShelfPanelMeta[];
  studies: readonly ShelfStudyMeta[];
  /** Jump to a study's intro panel. Registered by the shelf; a no-op when it is unmounted. */
  jumpToStudy: (studyIndex: number) => void;
}

const noop = () => {};

export const EMPTY_SHELF: ShelfState = {
  active: false,
  index: 0,
  panels: [],
  studies: [],
  jumpToStudy: noop,
};

let state: ShelfState = EMPTY_SHELF;
const listeners = new Set<() => void>();

function publish(next: ShelfState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_SHELF;

/** The shelf, on mount: what it holds and how to drive it. Clear with `clearShelf()`. */
export function setShelf(shelf: {
  panels: readonly ShelfPanelMeta[];
  studies: readonly ShelfStudyMeta[];
  jumpToStudy: (studyIndex: number) => void;
}): void {
  publish({ ...state, ...shelf });
}

export function setShelfActive(active: boolean): void {
  if (state.active !== active) publish({ ...state, active });
}

export function setShelfIndex(index: number): void {
  if (state.index !== index) publish({ ...state, index });
}

/** The shelf, on unmount (a live switch to reduced motion is exactly this). */
export function clearShelf(): void {
  publish(EMPTY_SHELF);
}

export function useShelfState(): ShelfState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
