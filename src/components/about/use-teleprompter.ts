"use client";

import { useEffect, type RefObject } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { TELEPROMPTER as T } from "@/components/about/teleprompter-config";
import { activeCentre, blockStyle, focusFor, wordWeight } from "@/components/about/teleprompter-engine";
import type { WordRole } from "@/components/about/statement-tokens";

interface Opts {
  wrapRef: RefObject<HTMLElement | null>;
  columnRef: RefObject<HTMLElement | null>;
  active: boolean;
  onActiveStatement?: (index: number) => void;
}

/**
 * The teleprompter (spec §8). A tall wrapper drives a sticky stage; the column
 * is translated so the focal centre tracks the scroll, and each block's words
 * resolve as they pass through it.
 *
 * Runs on ScrollTrigger — the shared GSAP ticker that also drives Lenis. No
 * second RAF loop: a competing one has silently locked scrolling on this site.
 *
 * Every colour is READ FROM THE TOKEN LAYER, never hardcoded. The prototype
 * interpolates toward the string literals '#0d0d0d' and '#bcbcbc'; ported that
 * way, dark mode breaks silently — emphasised words would resolve to near-black
 * on a black canvas (spec §3).
 */
export function useTeleprompter({ wrapRef, columnRef, active, onActiveStatement }: Opts): void {
  useEffect(() => {
    if (!active) return;
    const wrap = wrapRef.current;
    const column = columnRef.current;
    if (!wrap || !column) return;

    const blocks = [...column.querySelectorAll<HTMLElement>("[data-statement]")].map((el) => ({
      el,
      words: [...el.querySelectorAll<HTMLElement>("[data-word]")],
      centre: 0,
    }));
    if (blocks.length === 0) return;

    /* Resolved once per theme change, not per frame: reading a custom property
       off <html> is a style read, and this runs on every scrub frame. */
    let dim = "", ink = "", accent = "";
    const readTokens = () => {
      const cs = getComputedStyle(document.documentElement);
      dim = cs.getPropertyValue("--dim").trim();
      ink = cs.getPropertyValue("--ink").trim();
      accent = cs.getPropertyValue("--about").trim();
    };

    let measured = false;
    const measure = () => {
      for (const b of blocks) b.centre = b.el.offsetTop + b.el.offsetHeight / 2;
      measured = blocks.length > 0;
    };

    const apply = (progress: number) => {
      /* An explicit flag, not `if (!first) return`: the prototype guards on the
         first block's centre being truthy, so a centre of exactly 0 silently
         kills the whole section (spec §8). */
      if (!measured) return;
      const vh = window.innerHeight;
      const focalY = vh * T.focalPosition;
      const focalRange = vh * T.focalRange;
      const centre = activeCentre(blocks[0].centre, blocks[blocks.length - 1].centre, progress);
      column.style.transform = `translateY(${(focalY - centre).toFixed(1)}px)`;

      let nearest = 0;
      let nearestDist = Infinity;
      blocks.forEach((b, i) => {
        const delta = b.centre - centre;
        const focus = focusFor(delta, focalRange);
        const { blur, opacity } = blockStyle(delta, focus);
        b.el.style.opacity = opacity.toFixed(3);
        b.el.style.filter = blur > 0.12 ? `blur(${blur.toFixed(1)}px)` : "none";
        for (const w of b.words) {
          const role = (w.dataset.word ?? "ambient") as WordRole;
          w.style.color = mix(dim, role === "ambient" ? accent : ink, focus);
          w.style.fontVariationSettings = `"wght" ${Math.round(wordWeight(role, focus))}`;
        }
        const d = Math.abs(delta);
        if (d < nearestDist) { nearestDist = d; nearest = i; }
      });
      onActiveStatement?.(nearest);
    };

    readTokens();
    measure();

    const st = ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
      onRefreshInit: () => { readTokens(); measure(); },
      onRefresh: (self) => apply(self.progress),
    });

    /* Config Variable and Mae change the blocks' heights, so a pre-font
       measurement puts every centre in the wrong place. */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    /* The theme toggle swaps the tokens the words interpolate toward. */
    const themeObserver = new MutationObserver(() => { readTokens(); apply(st.progress); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      st.kill();
      themeObserver.disconnect();
      column.style.transform = "";
      for (const b of blocks) {
        b.el.style.opacity = "";
        b.el.style.filter = "";
        for (const w of b.words) { w.style.color = ""; w.style.fontVariationSettings = ""; }
      }
    };
  }, [active, wrapRef, columnRef, onActiveStatement]);
}

/** Per-channel lerp between two `#rrggbb` strings. */
function mix(from: string, to: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  if (from.length < 7 || to.length < 7) return to;
  const out = [0, 1, 2].map((i) => Math.round(ch(from, i) + (ch(to, i) - ch(from, i)) * t));
  return `rgb(${out[0]}, ${out[1]}, ${out[2]})`;
}
