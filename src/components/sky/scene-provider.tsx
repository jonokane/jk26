"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SCENE_KEYFRAMES, type SceneKeyframe } from "@/lib/scene-config";
import { applySceneToRoot, hourFromDate } from "@/lib/scene-engine";

interface SceneContextValue {
  /** Current scene hour; null until mounted (the server cannot know the visitor's clock). */
  hour: number | null;
  /** True while following the real clock (false while the visitor scrubs). */
  live: boolean;
  scrub: (hour: number) => void;
  resume: () => void;
  /** Live keyframes — replaceable by the dev tune panel. */
  keyframes: readonly SceneKeyframe[];
  setKeyframes: (keyframes: SceneKeyframe[]) => void;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useScene must be used inside <SceneProvider>");
  return ctx;
}

/**
 * Owns the scene clock. Samples the visitor's local time once a minute
 * (skipping ticks while the tab is hidden) and writes the scene tokens to
 * <html> via applySceneToRoot. No RAF, no per-frame work (spec §12).
 */
export function SceneProvider({ children }: { children: ReactNode }) {
  const [hour, setHour] = useState<number | null>(null);
  const [live, setLive] = useState(true);
  const [keyframes, setKeyframes] = useState<readonly SceneKeyframe[]>(SCENE_KEYFRAMES);
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration guard: the clock is client-only
    setHour(hourFromDate(new Date()));
    const tick = () => {
      if (liveRef.current && !document.hidden) setHour(hourFromDate(new Date()));
    };
    const id = setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    if (hour !== null) applySceneToRoot(document.documentElement, hour, keyframes);
  }, [hour, keyframes]);

  return (
    <SceneContext.Provider
      value={{
        hour,
        live,
        keyframes,
        scrub: (h) => {
          setLive(false);
          setHour(h);
        },
        resume: () => {
          setLive(true);
          setHour(hourFromDate(new Date()));
        },
        setKeyframes: (k) => setKeyframes(k),
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}
