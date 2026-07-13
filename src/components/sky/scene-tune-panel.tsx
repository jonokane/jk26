"use client";

import { useEffect, useState } from "react";
import { useScene } from "@/components/sky/scene-provider";

const COLOR_FIELDS = ["top", "mid", "hor", "ink", "sub"] as const;

/**
 * Dev-only palette editor for the scene keyframes. Only rendered behind a
 * NODE_ENV === "development" gate AND an explicit `?tune` URL param (the
 * same opt-in pattern as wordmark-tune-panel.tsx, documented in CLAUDE.md).
 * "copy scenes JSON" → paste into src/lib/scene-config.ts to persist.
 */
export function SceneTunePanel() {
  const { hour, scrub, keyframes, setKeyframes } = useScene();
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tuneRequested, setTuneRequested] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is client-only
    setTuneRequested(new URLSearchParams(window.location.search).has("tune"));
  }, []);

  if (process.env.NODE_ENV !== "development" || !tuneRequested || hour === null) {
    return null;
  }

  const kf = keyframes[selected];

  function updateColor(field: (typeof COLOR_FIELDS)[number], value: string) {
    const next = keyframes.map((k, i) => (i === selected ? { ...k, [field]: value } : k));
    setKeyframes(next);
    scrub(next[selected].h); // jump to the edited keyframe so the change is visible
  }

  return (
    <div className="slab fixed left-4 bottom-4 z-50 w-64 space-y-2 text-xs text-ink">
      <p className="text-kicker text-[10px]">Scene tune</p>
      <select
        value={selected}
        onChange={(e) => {
          const i = Number(e.target.value);
          setSelected(i);
          scrub(keyframes[i].h);
        }}
        className="w-full rounded border border-card-border bg-transparent px-1 py-0.5"
      >
        {keyframes.map((k, i) => (
          <option key={k.name} value={i}>
            {k.name} ({k.h}h)
          </option>
        ))}
      </select>
      {COLOR_FIELDS.map((field) => (
        <label key={field} className="flex items-center justify-between">
          <span>{field}</span>
          <input
            type="color"
            value={kf[field]}
            onChange={(e) => updateColor(field, e.target.value)}
          />
        </label>
      ))}
      <button
        type="button"
        className="pill w-full justify-center px-2 py-1 text-xs"
        onClick={async () => {
          await navigator.clipboard.writeText(JSON.stringify(keyframes, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "✓ copied — paste into scene-config.ts" : "copy scenes JSON"}
      </button>
    </div>
  );
}
