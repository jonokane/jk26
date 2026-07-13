"use client";

import { useState } from "react";
import {
  AXIS_MAX,
  AXIS_MIN,
  type EaseName,
  type FalloffName,
  type HeroConfig,
  type HoverMode,
} from "@/lib/hero-config";

const EASE_NAMES: readonly EaseName[] = [
  "sineInOut",
  "cubicInOut",
  "quintInOut",
  "expoInOut",
  "backInOut",
];
const FALLOFF_NAMES: readonly FalloffName[] = ["smooth", "linear", "sharp"];
const HOVER_MODES: readonly HoverMode[] = ["carve", "swell"];

function Row(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onInput: (v: number) => void;
}) {
  const { label, value, min, max, step, format, onInput } = props;
  return (
    <label className="block text-[11px]">
      <span className="flex justify-between text-zinc-400">
        <span>{label}</span>
        <span className="tabular-nums text-zinc-200">
          {format ? format(value) : value}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onInput(Number(e.target.value))}
        className="w-full accent-emerald-400"
      />
    </label>
  );
}

function Select<T extends string>(props: {
  label: string;
  value: T;
  options: readonly T[];
  onSelect: (v: T) => void;
}) {
  return (
    <label className="block text-[11px]">
      <span className="text-zinc-400">{props.label}</span>
      <select
        value={props.value}
        onChange={(e) => props.onSelect(e.target.value as T)}
        className="mt-0.5 w-full rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-zinc-200"
      >
        {props.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Dev-only floating tuning panel for the hero wordmark. Only ever rendered
 * behind a NODE_ENV === "development" gate (see hero-wordmark.tsx), so it is
 * dead-code-eliminated from production builds. Even in dev it is opt-in:
 * append `?tune` to the URL (e.g. localhost:3000/?tune) to show it.
 */
export function WordmarkTunePanel({
  initial,
  onChange,
}: {
  initial: HeroConfig;
  onChange: (patch: Partial<HeroConfig>) => void;
}) {
  const [cfg, setCfg] = useState<HeroConfig>(() => structuredClone(initial));
  const [copied, setCopied] = useState(false);

  function update(patch: {
    ambient?: Partial<HeroConfig["ambient"]>;
    hover?: Partial<HeroConfig["hover"]>;
  }) {
    const next: HeroConfig = {
      ...cfg,
      ambient: { ...cfg.ambient, ...patch.ambient },
      hover: { ...cfg.hover, ...patch.hover },
    };
    setCfg(next);
    onChange(next);
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-h-[70vh] w-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900/95 p-3 shadow-xl backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
        Wordmark tune
      </p>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Ambient</p>
      <Row label="duration" value={cfg.ambient.duration} min={400} max={5000} step={50}
        format={(v) => (v / 1000).toFixed(2) + "s"}
        onInput={(v) => update({ ambient: { duration: v } })} />
      <Row label="variance" value={cfg.ambient.variancePct} min={0} max={100} step={5}
        format={(v) => "±" + v + "%"}
        onInput={(v) => update({ ambient: { variancePct: v } })} />
      <Row label="hold" value={cfg.ambient.hold} min={0} max={2500} step={50}
        format={(v) => (v / 1000).toFixed(2) + "s"}
        onInput={(v) => update({ ambient: { hold: v } })} />
      <Row label="contrast bias" value={cfg.ambient.biasPct} min={0} max={100} step={5}
        format={(v) => v + "%"}
        onInput={(v) => update({ ambient: { biasPct: v } })} />
      <Row label="weight floor" value={cfg.ambient.wmin} min={AXIS_MIN} max={900} step={10}
        onInput={(v) =>
          update({ ambient: { wmin: v, wmax: Math.max(cfg.ambient.wmax, v + 100) } })
        } />
      <Row label="weight ceiling" value={cfg.ambient.wmax} min={270} max={AXIS_MAX} step={10}
        onInput={(v) =>
          update({ ambient: { wmax: v, wmin: Math.min(cfg.ambient.wmin, v - 100) } })
        } />
      <Row label="stagger" value={cfg.ambient.staggerMs} min={0} max={500} step={10}
        format={(v) => v + "ms"}
        onInput={(v) => update({ ambient: { staggerMs: v } })} />
      <Select label="ease" value={cfg.ambient.ease} options={EASE_NAMES}
        onSelect={(v) => update({ ambient: { ease: v } })} />

      <p className="pt-1 text-[10px] uppercase tracking-wider text-zinc-500">Cursor</p>
      <Select label="mode" value={cfg.hover.mode} options={HOVER_MODES}
        onSelect={(v) => update({ hover: { mode: v } })} />
      <Row label="radius" value={cfg.hover.radius} min={50} max={450} step={10}
        format={(v) => v + "px"}
        onInput={(v) => update({ hover: { radius: v } })} />
      <Row label="strength" value={cfg.hover.strengthPct} min={0} max={100} step={5}
        format={(v) => v + "%"}
        onInput={(v) => update({ hover: { strengthPct: v } })} />
      <Row label="lag" value={cfg.hover.lagMs} min={0} max={800} step={20}
        format={(v) => v + "ms"}
        onInput={(v) => update({ hover: { lagMs: v } })} />
      <Select label="falloff" value={cfg.hover.falloff} options={FALLOFF_NAMES}
        onSelect={(v) => update({ hover: { falloff: v } })} />

      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(JSON.stringify(cfg, null, 2));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="w-full rounded bg-emerald-500 py-1 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-400"
      >
        {copied ? "✓ copied — paste into hero-config.ts" : "copy config JSON"}
      </button>
    </div>
  );
}
