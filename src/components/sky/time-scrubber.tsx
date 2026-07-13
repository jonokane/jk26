"use client";

import { useScene } from "@/components/sky/scene-provider";

function formatHour(hour: number): string {
  const hh = String(Math.floor(hour)).padStart(2, "0");
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Visitor-facing sun/moon scrubber (spec §3.4): preview any time of day.
 * Visual styling is a punch-list item; behavior is final.
 */
export function TimeScrubber() {
  const { hour, live, scrub, resume } = useScene();
  if (hour === null) return null;

  return (
    <div
      className="pill fixed right-4 bottom-4 z-40 gap-3 px-4 py-2 text-sm"
      role="group"
      aria-label="Time of day"
    >
      <button
        type="button"
        onClick={resume}
        aria-pressed={live}
        className={live ? "underline underline-offset-4" : "opacity-60"}
      >
        now
      </button>
      <input
        type="range"
        min={0}
        max={24}
        step={0.1}
        value={hour}
        onChange={(e) => scrub(Number(e.target.value))}
        aria-label="Scrub time of day"
        className="w-36 accent-current"
      />
      <span className="tabular-nums" aria-live="polite">
        {formatHour(hour)}
      </span>
    </div>
  );
}
