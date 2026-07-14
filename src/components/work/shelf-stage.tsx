"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { shelfLabels } from "@/components/work/shelf-labels";
import {
  firstPanelOfStudy,
  type ShelfPanelMeta,
  type ShelfStudyMeta,
} from "@/components/work/shelf-panels";
import { clearShelf, setShelf, setShelfActive, setShelfIndex } from "@/components/work/shelf-store";
import type { ShelfMode } from "@/components/work/use-shelf-mode";
import { useShelfScroll } from "@/components/work/use-shelf-scroll";
import { useShelfSwipe } from "@/components/work/use-shelf-swipe";
import styles from "@/components/work/shelf-stage.module.css";

/** The panel a node lives on, or -1. The panels carry their own index in the DOM. */
function panelIndexOf(node: EventTarget | null): number {
  const panel = (node as HTMLElement | null)?.closest?.("[data-shelf-panel]");
  const index = Number(panel?.getAttribute("data-shelf-panel"));
  return Number.isInteger(index) ? index : -1;
}

/**
 * The shelf's client shell (spec §8): it holds the stage and the track, wires
 * whichever driver the mode calls for, and renders the wayfinding. It renders
 * no case study content — the panels arrive already rendered, from the server.
 *
 * The one piece of React state is the current panel, and it changes on a panel
 * *change*: a discrete event, a dozen times per shelf. Nothing here runs per
 * frame — the track is moved by `gsap.quickSetter`, straight to the DOM.
 */
export function ShelfStage({
  mode,
  panels,
  studies,
  children,
}: {
  mode: Exclude<ShelfMode, "document">;
  panels: readonly ShelfPanelMeta[];
  studies: readonly ShelfStudyMeta[];
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onPanelChange = useCallback((next: number) => {
    setIndex(next);
    setShelfIndex(next);
  }, []);

  /* Both drivers are always mounted, and `active` decides which one is wired.
     Not a formality: it keeps the mode a plain function of state, so a live
     flip to reduced motion — or a phone rotating past 760px — tears one down
     and builds the other, in that order, every time. */
  const scrollTo = useShelfScroll({
    stageRef,
    trackRef,
    panelCount: panels.length,
    active: mode === "pin",
    onPanelChange,
  });
  const swipeTo = useShelfSwipe({
    trackRef,
    active: mode === "swipe",
    onPanelChange,
  });

  /* "In Work" — what opens the header's work row (spec §6). Deliberately not
     the pin's own active flag: at the exact scroll position where the pin
     starts, ScrollTrigger reports itself inactive, so a study pill that jumped
     the reader to the first panel landed with the row shut. Whether the shelf
     is on screen is the question the header is really asking, it is true in
     both modes, and it has no boundary to be wrong at. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShelfActive(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(stage);
    return () => {
      observer.disconnect();
      setShelfActive(false);
    };
  }, []);

  const goToPanel = useCallback(
    (next: number) => {
      const target = Math.min(panels.length - 1, Math.max(0, next));
      if (mode === "pin") scrollTo(target);
      else swipeTo(target);
    },
    [mode, panels.length, scrollTo, swipeTo],
  );

  /* Publish to the header (spec §6). Clearing on unmount is what collapses the
     work row when the reader switches to reduced motion halfway down the page. */
  useEffect(() => {
    const jumpToStudy = (studyIndex: number) => goToPanel(firstPanelOfStudy(panels, studyIndex));
    setShelf({ panels, studies, jumpToStudy });
    return clearShelf;
  }, [panels, studies, goToPanel]);

  /* Arrow keys move the shelf (spec §12). Left/right scroll nothing on a page
     that only scrolls vertically, so taking them costs the reader nothing. */
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      goToPanel(index + step);
    },
    [goToPanel, index],
  );

  /* Tabbing into a link on a panel that is off to the right: bring the shelf to
     it, rather than leaving focus on something the reader cannot see. */
  const onFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const focused = panelIndexOf(event.target);
      if (focused >= 0 && focused !== index) goToPanel(focused);
    },
    [goToPanel, index],
  );

  /* …and undo the container scroll the browser does on the way there. In `pin`
     mode the track is transformed, never scrolled, so any scrollLeft on the
     stage is the browser trying to reveal a focused child — it would slide the
     panels out from under the transform. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reset = () => {
      if (stage.scrollLeft !== 0) stage.scrollLeft = 0;
      if (stage.scrollTop !== 0) stage.scrollTop = 0;
    };
    stage.addEventListener("scroll", reset);
    return () => stage.removeEventListener("scroll", reset);
  }, []);

  const current = panels[index];

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-mode={mode}
      role="region"
      aria-label={shelfLabels.region}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <div ref={trackRef} className={styles.track}>
        {children}
      </div>

      <div className={styles.hud}>
        {/* Decorative wayfinding: the caption below carries the same information
            to assistive tech, and announces it. */}
        <ol className={styles.dots} aria-hidden="true">
          {panels.map((panel) => (
            <li
              key={panel.key}
              className={styles.dot}
              data-on={panel.index === index ? "" : undefined}
              data-newgroup={panel.firstOfStudy && panel.index > 0 ? "" : undefined}
            />
          ))}
        </ol>
        {current && (
          <p className={styles.caption} aria-live="polite">
            <b className={`heading-display ${styles.captionStudy}`}>{current.title}</b>
            {current.captionRest}
          </p>
        )}
      </div>
    </div>
  );
}
